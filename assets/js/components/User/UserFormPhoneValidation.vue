<template>
    <form class="form-inline" @submit="submitPhoneNumber" method="post">
        <fieldset class="row">
            <UserRegisterSimpleinput elem="phone"
                                     type="tel"
                                     :label="label"
                                     :placeholder="placeholder"
                                     ref="phone"
                                     :isValid="phoneIsValid"
                                     :errorForm="errors.phone"
                                     :disabled-default-validate="true"
                                     v-on:blur="validatePhone()"
                                     v-model="phone"
                                     :form-group-class="formGroupClass"
            >
            </UserRegisterSimpleinput>
            <div class="Form__section col-xs-12">
                <p class="Form__paragraphe">
                    <button class="Form__button btn btn-warning btn-circle btn-block" type="submit" v-text="btnText" :disabled="phoneIsValid"></button>
                </p>
            </div>
        </fieldset>
    </form>
</template>

<script>
  import http from '../../services/http';
  import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

  export default {
    name: "UserFormPhoneValidation",
    components: {
      UserRegisterSimpleinput,
    },
    props: {
      btnText: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      placeholder: {
        type: String,
        required: true,
      },
      formGroupClass: {
        type: String,
        required: false,
        default: '',
      },
    },
    data() {
      return {
        phone: '',
        phoneIsValid: false,
        errors: {
          phone: '',
        },
      }
    },
    methods: {
      submitPhoneNumber(e) {
        const result = this.validatePhone(this.phone);
        if (result === true) {
          this.errors.phone = '';
          this.phoneIsValid = true;
        } else {
          this.phoneIsValid = false;
          this.errors.phone = result;
        }

        if (this.phoneIsValid) {
          const post = new FormData();
          post.append('phone', this.phone);
          http({
            method: 'post',
            url: '/user/profile',
            data: post,
            config: {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          }).then(() => {
            // Send the result to parent
            this.$emit('submitResponse', Object.assign({ phone: this.phone }));
          }).catch((response) => {
            if (this.$root.$options.methods.errsIsDefined()) {
                leErrs.meta.Code = response.code;
                leErrs.track(new Error("UserFormPhoneValidation.vue submitPhoneNumber : " + response.error));
            }
            this.errors.phone = response.response.data.message;
          })
        }
        e.preventDefault();
      },
    },
  };
</script>
