<template>
    <form class="form-inline" @submit="submitCodeNumber" method="post">
        <fieldset class="row">
            <UserRegisterSimpleinput elem="code"
                                     type="text"
                                     :label="label"
                                     :placeholder="placeholder"
                                     ref="code"
                                     :error-form="errors.code"
                                     v-model="code"
                                     :form-group-class="formGroupClass"
            >
            </UserRegisterSimpleinput>
            <div class="Form__section col-xs-12">
                <p class="Form__paragraphe">
                    <button class="Form__button btn btn-warning btn-circle btn-block" type="submit" v-text="btnText"></button>
                </p>
            </div>
        </fieldset>
    </form>
</template>

<script>
  import http from '../../services/http';
  import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

  export default {
    name: "UserFormPhoneCodeValidation",
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
      phone: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        code: '',
        errors: {
          code: '',
        },
      }
    },
    methods: {
      submitCodeNumber(e) {
        const post = new FormData();
        const self = this;
        post.append('phone', this.phone);
        post.append('code', this.code);
        http({
          method: 'post',
          url: '/user/profile',
          data: post,
          config: {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        }).then((response) => {
          if (response.data.error === false) {
            this.$modal.hide('confirmPhoneCode');
          }
          this.$emit('submitResponse', response);
        }).catch((response) => {
          if (this.$root.$options.methods.errsIsDefined()) {
              leErrs.meta.Code = response.code;
              leErrs.track(new Error("UserFormPhoneCodeValidation.vue submitCodeNumber : " + response.error));
          }
          self.errors.code = response.response.data.message;
        });
        e.preventDefault();
      },
    },
  };
</script>
