import * as Vue from "https://cdn.jsdelivr.net/npm/vue@3.2.26/dist/vue.esm-browser.prod.js";

export function init(ctx, payload) {
  ctx.importCSS("main.css");
  ctx.importCSS(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
  );
  ctx.importCSS(
    "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.min.css"
  );

  const BaseInput = {
    name: "BaseInput",

    props: {
      label: {
        type: String,
        default: "",
      },
      inputClass: {
        type: String,
        default: "input",
      },
      modelValue: {
        type: [String, Number],
        default: "",
      },
      inline: {
        type: Boolean,
        default: false,
      },
      grow: {
        type: Boolean,
        default: false,
      },
      number: {
        type: Boolean,
        default: false,
      },
    },

    template: `
    <div v-bind:class="[inline ? 'inline-field' : 'field', grow ? 'grow' : '']">
      <label v-bind:class="inline ? 'inline-input-label' : 'input-label'">
        {{ label }}
      </label>
      <input
        :value="modelValue"
        @input="$emit('update:data', $event.target.value)"
        v-bind="$attrs"
        v-bind:class="[inputClass, number ? 'input-number' : '']"
      >
    </div>
    `,
  };

  const app = Vue.createApp({
    components: {
      BaseInput: BaseInput,
    },

    template: `
    <div class="app">
      <form @change="handleFieldChange">
        <div class="header">
          <div class="inline-field">
            <BaseInput
              name="node"
              label="Remote node"
              type="text"
              placeholder="node@address"
              v-model="fields.node"
              inputClass="input input--xs input-text"
              :inline
            />
          </div>
          <div class="inline-field">
            <BaseInput
              name="cookie"
              label="Cookie"
              type="text"
              placeholder="Cookie"
              v-model="fields.cookie"
              inputClass="input input--xs input-text"
              :inline
            />
          </div>
          <div class="inline-field">
            <BaseInput
              name="result_variable"
              label="Assign to"
              type="text"
              placeholder="Assign to"
              v-model="fields.result_variable"
              inputClass="input input--xs input-text"
              :inline
            />
          </div>
        </div>
      </form>
    </div>
    `,

    data() {
      return {
        fields: payload.fields,
      };
    },

    methods: {
      handleFieldChange({ target: { name, value } }) {
        ctx.pushEvent("update_field", { field: name, value });
      },
    },
  }).mount(ctx.root);

  ctx.handleEvent("update_field", ({ field, value }) => {
    app.fields[field] = value;
  });

  ctx.handleSync(() => {
    // Synchronously invokes change listeners
    document.activeElement &&
      document.activeElement.dispatchEvent(
        new Event("change", { bubbles: true })
      );
  });
}
