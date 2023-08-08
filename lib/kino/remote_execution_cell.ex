defmodule Kino.RemoteExecutionCell do
  @moduledoc false

  use Kino.JS, assets_path: "lib/assets/remote_execution_cell"
  use Kino.JS.Live
  use Kino.SmartCell, name: "Remote execution"

  @default_code "# runs on the remote node"

  @impl true
  def init(attrs, ctx) do
    cookie = attrs["cookie"] || ""

    fields = %{
      "node" => attrs["node"] || "",
      "cookie" => cookie,
      "use_cookie_secret" => Map.has_key?(attrs, "cookie_secret") || cookie == "",
      "cookie_secret" => attrs["cookie_secret"] || "",
      "result_variable" => Kino.SmartCell.prefixed_var_name("result", attrs["result_variable"])
    }

    ctx = assign(ctx, fields: fields)

    {:ok, ctx, editor: [attribute: "code", language: "elixir", default_source: @default_code]}
  end

  @impl true
  def handle_connect(ctx) do
    payload = %{
      fields: ctx.assigns.fields
    }

    {:ok, payload, ctx}
  end

  @impl true
  def handle_event("update_field", %{"field" => field, "value" => value}, ctx) do
    fields = Map.put(ctx.assigns.fields, field, value)
    {:noreply, assign(ctx, fields: fields)}
  end

  @impl true
  def to_attrs(%{assigns: %{fields: fields}}) do
    cookie_keys = if fields["use_cookie_secret"], do: ["cookie_secret"], else: ["cookie"]
    Map.take(fields, ["node", "result_variable"] ++ cookie_keys)
  end

  @impl true
  def to_source(attrs) do
    if attrs["node"] not in [nil, ""] do
      conn_setup = attrs |> quoted_conn_setup() |> Kino.SmartCell.quoted_to_string()

      """
      #{conn_setup}

      #{attrs["result_variable"]} =
        :erpc.call(#{inspect(String.to_atom(attrs["node"]))}, fn ->
          #{attrs["code"]}
        end)
      """
    else
      ""
    end
  end

  defp quoted_conn_setup(attrs) do
    node = String.to_atom(attrs["node"])
    variable = {String.to_atom(attrs["result_variable"]), [], nil}
    code = Code.string_to_quoted!(attrs["code"])

    quote do
      true = Node.set_cookie(unquote(quoted_cookie(attrs)))
      true = Node.connect(unquote(node))

      unquote(variable) = :erpc.call(unquote(node), fn -> unquote(code) end)
    end
  end

  defp quoted_cookie(%{"cookie" => cookie}), do: cookie

  defp quoted_cookie(%{"cookie_secret" => ""}), do: ""

  defp quoted_cookie(%{"cookie_secret" => secret}) do
    quote(do: System.fetch_env!(unquote("LB_#{secret}")))
  end
end
