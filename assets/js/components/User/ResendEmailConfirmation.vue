<template>
    <div>
        <p v-if="showConfirmMsg">Un email a été renvoyé</p>
        <form
            v-else
            class="form-inline resendEmailConfirmation"
            method="post"
            @submit="submitEmail"
        >
            <fieldset class="row">
                <UserRegisterSimpleinput
                    ref="email"
                    v-model="email"
                    elem="email"
                    type="email"
                    label="Email"
                    placeholder="exemple@email.com"
                    :is-valid="emailIsValid"
                    :error-form="errors.email"
                    :disabled-default-validate="true"
                    v-on:blur="validateEmail()"
                    form-group-class="col-xs-12"
                    :errorForm="errors.email"
                    :set-value="email"
                />
                <div class="Form__section col-xs-12">
                    <button :class="btnClassStyle" type="submit">Renvoyer un e-mail</button>
                </div>
            </fieldset>
        </form>
    </div>
</template>

<script>
  import http from '../../services/http';
  import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

  export default {
    name: "ResendEmailConfirmation",
    components: {
        UserRegisterSimpleinput,
      },
    props: {
        emailDefault: {
          type: String,
          required: false,
          default: '',
        },
        btnClass: {
          type: String,
          required: false,
          default: 'btn-warning btn-circle btn-block',
        },
      },
    data() {
          return {
            email: this.emailDefault,
            emailIsValid: false,
            showConfirmMsg: false,
            errors: {
              email: '',
            },
          }
      },
    computed: {
      btnClassStyle() {
        return 'Form__button btn ' + this.btnClass;
      },
    },
    methods: {
        submitEmail(e) {
          e.preventDefault();
          const result = this.validateEmail(this.email);
          if (result === true) {
            this.errors.email = '';
            this.emailIsValid = true;
          } else {
            this.errors.email = result;
            this.emailIsValid = false;
          }

          if (this.emailIsValid) {
            const data = new FormData();
            data.append('email', this.email);
            data.append('change', 1);

            http.post("/user/email", data).then(() => {
              this.showConfirmMsg = true;
            }).catch((error) => {
              if (this.$root.$options.methods.errsIsDefined()) {
                  leErrs.meta.Code = error.code;
                  leErrs.track(new Error("ResendEmailConfirmation.vue submitEmail : " + error.message));
              }
              this.errors.email = error.response.data.message;
            });
          }
        },
      },
    watch: {
      emailDefault(val) {
        if (this.email === '') {
          this.email = val;
        }
      },
    },
  };
</script>
