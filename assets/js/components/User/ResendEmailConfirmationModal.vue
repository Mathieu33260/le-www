<template>
    <modal
        id="ResendEmailConfirmationModal"
        name="ResendEmailConfirmation"
        :adaptive="true"
        width="90%"
        height="auto"
        :max-width="480"
        :scrollable="true"
    >
        <div class="modal-content">
            <div class="modal-body">
                <div class="text-right close hidden-xs" @click="$modal.hide('ResendEmailConfirmation')">&times;</div>
                <div class="close visible-xs left" @click="$modal.hide('ResendEmailConfirmation')">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
                <div class="clearfix"></div>
                <template>
                    <p class="text-black confirmEmail-title"><b>Confirmez votre e-mail</b></p>
                    <p class="confirmEmail-content">Consultez votre adresse {{ getEmail }} et cliquez sur le lien dans l'e-mail que nous venons de vous envoyer pour confirmer votre inscription.</p>
                    <resend-email-confirmation
                        :email-default="getEmail"
                        btn-class="btn-warning btn-block"
                    ></resend-email-confirmation>
                </template>
            </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from "vuex"
  import VModal from 'vue-js-modal';
  import ResendEmailConfirmation from './ResendEmailConfirmation.vue';

  Vue.use(VModal);

  export default {
    name: "ResendEmailConfirmationModal",
    components: {
      ResendEmailConfirmation,
    },
    props: {
      email: {
        type: String,
        required: false,
      },
    },
    data() {
      return {
        errors: {
          email: '',
        },
      }
    },
    computed: Object.assign({
      getEmail() {
        return this.notEmptyObject(this.userInfos) ? this.userInfos.email : this.email;
      },
    },
    mapGetters('UserDatas', [
      'userInfos',
    ]),
    mapGetters('AuthentificationAction', {
      openModal: 'openMissingEmailmodal',
    })),
    methods: Object.assign({},
      mapActions("AuthentificationAction", [
        "openMissingEmailmodal",
      ])),
    watch: {
      openModal(val) {
        if (val) {
          this.$modal.show("ResendEmailConfirmation");
        }
      },
    },
    mounted() {
      if (getCookie('showConfirmEmail') !== undefined) {
        this.openMissingEmailmodal();
        eraseCookie('showConfirmEmail');
      }
      if (this.email !== '') {
        this.openMissingEmailmodal();
      }
    },
  }
</script>
