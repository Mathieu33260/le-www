<template>
    <div>
        <user-register-form-without-step
            legend="Pas encore membre Loisirs Enchères ? Créez votre compte pour accéder à l'enchère le 25 février !"
            :confirmation-title="confirmationTitleRegister"
            :confirmation-html="confirmationHtmlRegister"
            :settings="{registerKimpembe: {value: 1, group: 'register'}}"
            :user-is-logged="connected"
            @submitResponse="setSubmitResponse"
        ></user-register-form-without-step>
        <user-register-status
            v-show="connected"
            block-account-complete-text="Vous êtes prêt pour l’enchère du 25 février. Testez vos talents d’enchérisseur avant le Jour J en participant à l’une de nos enchères Voyages et Loisirs."
            block-account-complete-link="/"
            block-account-complete-link-text="Découvrir nos offres"
            phone-content="Astuce : soyez alerté du début et de la fin de cette enchère unique !"
        ></user-register-status>
    </div>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  import VueScrollTo from "vue-scrollto";
  import UserRegisterStatus from '../User/UserRegisterStatus.vue';
  import UserRegisterFormWithoutStep from "../UserRegisterFormWithoutStep.vue";

  Vue.use(VueScrollTo);

  export default {
    name: "LandingpageSolidaire",
    components: {
      UserRegisterStatus,
      UserRegisterFormWithoutStep,
    },
    props: {
      userIsLogged: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    computed: Object.assign({},
      mapGetters('User', {
        connected: 'connected',
      })),
    data() {
      return {
        submitResponse: null,
        confirmationTitleRegister: '',
        confirmationHtmlRegister: '',
      }
    },
    updated() {
      if (this.connected) {
        this.$scrollTo('#registerStatus', 500)
      }
    },
    methods: Object.assign({
      setSubmitResponse(val) {
        this.submitResponse = val;
        if (val.success_easybid) {
          // Confirm message for mobile
          this.confirmationTitleRegister = '🎉 Félicitations ! Votre inscription pour l’enchère du 25 février est validée !';
          this.confirmationHtmlRegister = '';
        } else {
          // Confirm message for desktop
          this.confirmationTitleRegister = 'Vous y êtes presque !';
          this.confirmationHtmlRegister = "<span class='sprite'>&nbsp;</span><br />Consultez votre adresse " + val.email + " pour confirmer votre inscription et être prêt pour le début de l'enchère (pensez à vérifier vos spams on ne sait jamais !)";
        }
      },
    }, mapActions('User', ['changeConnected'])),
    created() {
      if (this.userIsLogged) {
        this.changeConnected();
      }
    },
  };
</script>
