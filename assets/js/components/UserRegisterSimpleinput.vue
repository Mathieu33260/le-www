<template>
    <div :class="inputBlocClass">
        <label class="control-label" :for="elem" v-text="label"></label>
        <div class="input" :class="active">
            <input class="form-control"
                :type="type"
                :id="elem"
                :name="name !== '' ? name : elem"
                :placeholder="placeholder"
                v-model="value"
                @input="$emit('input', $event.target.value)"
                @focus="focused()"
                @blur="blured($event.target.value)">
            <div class="line"></div>
            <span class="help-block" v-html="error != '' ? error : errorForm"></span>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'UserRegisterSimpleinput',
        props: {
            elem: String,
            name: {
              type: String,
              require: false,
              default: '',
            },
            label: String,
            placeholder: String,
            type: String,
            isValid: Boolean,
            errorForm: {
                type: String,
                default: '',
            },
            formGroupClass: {
              type: String,
              required: false,
              default: '',
            },
            setValue: {
              type: String,
              required: false,
              default: '',
            },
            disabledDefaultValidate: {
                type: Boolean,
                default: false,
            },
          validateOption: {
            type: Object,
            required: false,
            default() {
              return {};
            },
          },
        },
        data() {
            return {
                count: 0,
                active: 'before',
                input: '',
                value: this.setValue,
                error: '',
                formGroupClassCss: this.formGroupClass !== '' ? 'form-group simpleInputBloc ' + this.formGroupClass : 'form-group simpleInputBloc',
            }
        },
      computed: {
        inputBlocClass() {
          let strClass = this.formGroupClassCss;
          if (this.error !== '' || this.errorForm !== '') {
            if (strClass !== '') {
              strClass += ' ';
            }
            strClass += 'has-error';
          }
          return strClass
        },
      },
      methods: {
        focused() {
          this.active = "doing";
        },
        focusedAfter() {
          return new Promise((resolve) => {
            this.active = "after";
            resolve()
          });
        },
        blured() {
          // Valide value when cursor escape input
          if (this.value !== '' && this.disabledDefaultValidate === false) {
            const result = this.$root.$options.methods.validate(this.type, this.value, this.validateOption);
            if (result === true) {
                this.error = '';
                return true;
            }
            this.error = result;
            return false;
          }
          const result = this.$root.$options.methods.validate(this.type, this.value, this.validateOption);
          if (result === true) {
            this.error = '';
            return true;
          }
          this.error = result;
          return false;
        },
      },
      watch: {
        setValue(val) {
          this.value = val;
        },
      },
    }
</script>
