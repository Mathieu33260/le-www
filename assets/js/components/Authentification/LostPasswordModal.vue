<template>
    <modal
        id="lostPassword"
        name="lostPassword"
        :adaptive="true"
        width="90%"
        height="auto"
        :max-width="480"
        @closed="openLostPasswordModal"
        :scrollable="true"
    >
        <div class="modal-content">
            <div class="text-right close" @click="$modal.hide('lostPassword')">&times;</div>
            <div class="modal-body">
                <p class="text-black title"><b>Mot de passe oublié</b></p>
                <p class="content">Pour recevoir votre nouveau mot de passe, entrez votre adresse email. Vous allez recevoir un lien pour réinitialiser votre mot de passe.</p>
                <form
                    @submit="checkForm"
                    method="post"
                    action="/user/login_check">
                    <p v-if="errorMessage !== ''" class="text-danger" aria-hidden="true" v-html="errorMessage"></p>
                    <UserRegisterSimpleinput
                        elem="emailLogin"
                        name="_username"
                        type="email"
                        label="E-mail"
                        placeholder="E-mail"
                        ref="email"
                        :is-valid="emailIsValid"
                        :error-form="errors.email"
                        v-model="email"
                    >
                    </UserRegisterSimpleinput>
                    <button type="submit" class="btn btn-warning btn-block">Réinitialiser</button>
                </form>
            </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapActions } from "vuex"
  import VModal from 'vue-js-modal';
  import http from '../../services/http';
  import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

  Vue.use(VModal);

  export default {
    name: "LostPasswordModal",
    components: {
      UserRegisterSimpleinput,
    },
    props: {
      openModal: {
        type: Boolean,
        require: true,
      },
    },
    data() {
      return {
        email: '',
        emailIsValid: false,
        errors: {
          email: '',
        },
        errorMessage: '',
      }
    },
    watch: {
      openModal(val) {
        if (val) {
          this.$modal.show('lostPassword');
        }
      },
    },
    mounted() {
      if (this.openModal) {
        this.$modal.show('lostPassword');
      }
    },
    methods: Object.assign({
      checkForm(e) {
        // check email
        const result = this.validate('email', this.email);
        if (result === true) {
          this.errors.email = '';
          this.emailIsValid = true;
        } else {
          this.emailIsValid = false;
          this.errors.email = result;
        }

        // Check if all input is valide
        if (this.emailIsValid) {
          this.reset();
        }

        e.preventDefault();
      },
      reset() {
        this.showGeneralLoader();
        const form = new FormData();
        form.append('email', this.email);
        http.post('/user/mot-de-passe-perdu', form).then((response) => {
          const data = response.data;
          this.errorMessage = '';
          if (typeof data.error !== 'undefined' && data.error !== '') {
            if (typeof data.url !== 'undefined') {
              window.location = data.url;
            } else {
              this.errorMessage = data.error;
              this.hideGeneralLoader();
            }
          } else {
            location.reload();
          }
        }).catch((response) => {
          this.errorMessage = '';
          if (this.$root.$options.methods.errsIsDefined()) {
              leErrs.meta.Code = response.code;
              leErrs.track(new Error("LostPasswordModal reset : " + response.error));
          }
          if (typeof response.error === "string" && response.error !== '') {
            this.errorMessage = response.error;
            this.hideGeneralLoader();
          } else {
            location.reload();
          }
        })
      },
    },
    mapActions("AuthentificationAction", [
      "openLostPasswordModal",
    ])),
  }
</script>
