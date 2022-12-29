<template>
    <modal
        id="registerSocialModal"
        name="registerSocial"
        :adaptive="true"
        width="90%"
        height="auto"
        :max-width="480"
        @closed="closeModal"
        :scrollable="true"
    >
        <div class="modal-content">
            <div class="modal-header">
                <div class="text-right close hidden-xs" @click="$modal.hide('registerSocial')">&times;</div>
                <div class="close visible-xs left" @click="$modal.hide('registerSocial')">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
            </div>
            <div class="modal-body" :class="{'nopadding-bottom': !registerSuccess}">
                <div v-if="error !== '' && !registerSuccess" class="alert alert-danger">
                    <p>{{ error }}</p>
                </div>
                <template v-if="!registerSuccess">
                    <transition name="slide-fade">
                        <user-register-form-without-step
                                newsletter-label="Je m'inscris à la newsletter et je reçois un cadeau !"
                                submit-text="Valider"
                                submit-class="btn btn-warning"
                                @submitResponse="registerReponse"
                                :clearfix="['hide']"
                                :input-config="inputConfig"
                        ></user-register-form-without-step>
                    </transition>
                </template>
            </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapActions, mapGetters } from "vuex"
  import VModal from 'vue-js-modal';
  import UserRegisterFormWithoutStep from '../UserRegisterFormWithoutStep.vue';

  Vue.use(VModal);

  export default {
    name: "RegisterSocialModal",
    components: {
      UserRegisterFormWithoutStep,
    },
    data() {
      return {
        // Registration is successful
        registerSuccess: false,
        // May contain information about the individual configuration of the form fields
        inputConfig: {},
        // Error message
        error: '',
      }
    },
    computed: Object.assign({},
      mapGetters('AuthentificationAction', {
        register2Step: 'register2Step',
        data2Step: 'data2Step',
      })),
    watch: {
      // If the registration passes in two stages
      register2Step(val) {
        if (val) {
          this.$modal.show('registerSocial');
        }
      },
      // User data
      data2Step(val) {
        if (this.notEmptyObject(val)) {
          this.inputConfig = {
            email: {
              value: val.email,
            },
            firstName: {
              value: val.first_name,
            },
            lastName: {
              value: val.last_name,
            },
          };
        }
      },
    },
    methods: Object.assign({
      // The modal closes
      closeModal() {
        this.setRegister2Step(false);
      },
      // Callback of register
      registerReponse(data) {
        this.registerSuccess = data.success === true;
        this.error = data.errors;
        if (this.registerSuccess) {
          window.document.location.reload(true);
        }
      },
    },
    mapActions("AuthentificationAction", {
      setRegister2Step: "register2Step",
    })),
  }
</script>
