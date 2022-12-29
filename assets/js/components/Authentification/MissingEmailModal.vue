<template>
    <modal
            id="facebookMissingEmailModal"
            name="missingEmailModal"
            :adaptive="true"
            width="90%"
            height="auto"
            :max-width="480"
            :scrollable="true"
            @closed="closed"
    >
        <div class="modal-content">
            <div class="modal-header">
                <div class="text-right close hidden-xs" @click="$modal.hide('missingEmailModal')">&times;</div>
                <div class="close visible-xs left" @click="$modal.hide('missingEmailModal')">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
                <div>Finalisez votre inscription</div>
            </div>
            <div class="modal-body">
                <p>Afin de pouvoir utiliser la connexion via Facebook nous avons besoin d'un email de contact. Merci de
                    le renseigner. 👍</p>
                <form
                    @submit="checkForm"
                    method="post"
                    id="facebookMissingEmailForm"
                >
                    <p v-if="errorMessage !== ''" class="text-danger" aria-hidden="true">{{ errorMessage }}</p>
                    <UserRegisterSimpleinput
                        elem="facebookMissingEmail"
                        name="facebookMissingEmail"
                        type="email"
                        label="E-mail"
                        placeholder="E-mail"
                        ref="email"
                        :is-valid="emailIsValid"
                        :error-form="errors.email"
                        v-model="email"
                    >
                    </UserRegisterSimpleinput>
                    <button type="submit" class="btn btn-primary btn-block">Terminer l'inscription</button>
                </form>
            </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from "vuex"
  import VModal from 'vue-js-modal';
  import http from '../../services/http';
  import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

  Vue.use(VModal)

  export default {
    name: "MissingEmailModal",
    components: {
      UserRegisterSimpleinput,
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
      isOpenMissingEmailmodal(val) {
        if (val) {
          this.$modal.show('missingEmailModal');
        } else {
          this.$modal.hide('missingEmailModal');
        }
      },
    },
    computed: Object.assign({},
      mapGetters('AuthentificationAction', {
        isOpenMissingEmailmodal: 'openMissingEmailmodal',
        facebookToken: 'facebookToken',
      })),
    methods: Object.assign({
      closed() {
        this.openMissingEmailmodal();
        this.email = '';
        this.emailIsValid = false;
        this.errorMessage = '';
        this.errors = {
          email: '',
        };
      },
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
          this.submit();
        }

        e.preventDefault();
      },
      submit() {
        this.showGeneralLoader();
        const form = new FormData();
        form.append('missingEmail', this.email);
        form.append('oauth_token', this.facebookToken);
        form.append('screenWidth', window.innerWidth);
        http.post('/user/login/facebook', form).then((response) => {
          const data = response.data; /* eslint prefer-destructuring: 0 */
          this.errorMessage = '';
          if (typeof data.error !== 'undefined' && data.error !== '') {
            if (typeof data.url !== 'undefined') {
              window.location = data.url;
            } else {
              this.errorMessage = data.error;
              this.hideGeneralLoader();
            }
          } else {
            this.missingEmailComplete(data);
          } /* eslint prefer-destructuring: 1 */
        }).catch((response) => {
          this.errorMessage = '';
          if (typeof response.response.data === "string") {
            this.errorMessage = response.response.data;
            this.hideGeneralLoader();
          } else {
            location.reload();
          }
        })
      },
    },
    mapActions("AuthentificationAction", [
      "missingEmailComplete",
      "openMissingEmailmodal",
    ])),
  }
</script>
