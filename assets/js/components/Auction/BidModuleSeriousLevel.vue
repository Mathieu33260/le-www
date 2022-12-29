<template>
    <div class="seriousLevel">
        <modal id="confirmPhone" name="confirmPhone" :adaptive="true" width="90%" height="auto" :max-width="480" @closed="closedModal" @opened="openedModal">
            <div class="modal-content modal-content--bidmodule">
                <div class="text-right close modal__close--bidmodule" @click="$modal.hide('confirmPhone')">&times;</div>
                <div class="modal-header">
                    Étape 1 sur 2
                </div>
                <div class="modal-body modal-body--bidmodule">
                    <p class="modal-title modal-title--bidmodule">On passe aux choses sérieuses !</p>
                    <p>Cette enchère a beaucoup de succès !<br />Complétez les deux étapes suivantes pour continuer à enchérir.</p>
                    <p>Indiquez votre numéro de téléphone mobile pour recevoir un code de confirmation par SMS.</p>
                    <div class="form">
                        <user-form-phone-validation
                                btn-text="M'envoyer un code de confirmation"
                                label="Votre numéro de téléphone"
                                placeholder="Votre numéro de téléphone"
                                form-group-class="col-xs-12"
                                @submitResponse="sentCode"
                        ></user-form-phone-validation>
                    </div>
                </div>
            </div>
        </modal>
        <modal id="confirmPhoneCode" name="confirmPhoneCode" :adaptive="true" width="90%" height="auto" :max-width="480" @closed="closedModal" @opened="openedModal">
            <div class="modal-content modal-content--bidmodule">
                <div class="text-right close modal__close--bidmodule" @click="$modal.hide('confirmPhoneCode')">&times;</div>
                <div class="modal-header">
                    Étape 1 sur 2
                </div>
                <div class="modal-body modal-body--bidmodule">
                    <p class="modal-title modal-title--bidmodule">On passe aux choses sérieuses !</p>
                    <p>Cette enchère a beaucoup de succès !<br />Complétez les deux étapes suivantes pour continuer à enchérir.</p>
                    <p>Recopiez le code de confirmation envoyé au {{ userPhoneValidate }} pour valider cette étape.</p>
                    <div class="form">
                        <user-form-phone-code-validation
                                btn-text="Valider le code de confirmation"
                                label="Code de vérification"
                                placeholder="Code de vérification"
                                form-group-class="col-xs-12"
                                :phone="userPhoneValidate"
                                @submitResponse="validePhoneCodeResponse"
                        ></user-form-phone-code-validation>
                    </div>
                </div>
            </div>
        </modal>
        <modal id="confirmCard" name="confirmCard" :adaptive="true" width="90%" height="auto" :max-width="480" @closed="closedModal" @opened="openedModal">
            <div class="modal-content modal-content--bidmodule">
                <div class="text-right close modal__close--bidmodule" @click="$modal.hide('confirmCard')">&times;</div>
                <div class="modal-header">
                    Étape 2 sur 2
                </div>
                <div class="modal-body modal-body--bidmodule">
                    <p class="modal-title modal-title--bidmodule">On passe aux choses sérieuses !</p>
                    <p v-if="showFormCard === false">Cette enchère a beaucoup de succès ! Dernière étape : Renseignez vos coordonnées bancaires pour continuer à enchérir.</p>
                    <p v-if="showFormCard === false">Afin de certifier la validité de votre carte bancaire, nous interrogerons votre banque pour un montant de 1€. Cette procédure est demandée uniquement à des fins de vérification, <b>aucun prélèvement réel ne sera effectué sur votre compte</b>.</p>
                    <form v-show="showFormCard === false" @submit="submitAcceptCard" method="post">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="accept" value="1" required="" v-model="acceptCard"> Je comprends qu'aucun paiement ne sera effectué à cette étape.
                            </label>
                        </div>
                        <button type="submit" class="btn btn-warning btn-circle btn-block" :class="{disabled: acceptCard === false}">Accéder au formulaire bancaire</button>
                    </form>
                    <div v-show="showFormCard">
                        <iframe
                            id="creditCardIframe"
                            width="100%"
                            height="240px"
                            scrolling="no"
                            frameborder="0"
                            :src="'/user/'+userInfos.num+'/creditcard/add'"
                        ></iframe>
                    </div>
                </div>
            </div>
        </modal>
        <modal name="confirmFlowComplete" :adaptive="true" width="90%" height="auto" :max-width="480" @closed="closedModal">
            <div class="modal-content modal-content--bidmodule">
                <div class="text-right close modal__close--bidmodule" @click="$modal.hide('confirmFlowComplete')">&times;</div>
                <div class="modal-body modal-body--bidmodule">
                    <p class="modal-title modal-title--bidmodule">On passe aux choses sérieuses !</p>
                    <p>Vous pouvez dès maintenant continuer à enchérir pour tenter de remporter ce lot exceptionnel.</p>
                    <p>Bonne chance 🤞</p>
                    <button type="submit" class="btn btn-warning btn-circle btn-block" @click="$modal.hide('confirmFlowComplete')">J’enchéris !</button>
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters } from "vuex";
  import VModal from 'vue-js-modal';
  import UserFormPhoneValidation from '../User/UserFormPhoneValidation.vue';
  import UserFormPhoneCodeValidation from '../User/UserFormPhoneCodeValidation.vue';

  Vue.use(VModal);

  export default {
    name: "BidModuleSeriousLevel",
    components: {
      UserFormPhoneValidation,
      UserFormPhoneCodeValidation,
    },
    props: {
      activateTheFlow: {
        type: Boolean,
        required: true,
      },
    },
    computed: Object.assign({},
      mapGetters('UserDatas', {
        userInfos: 'userInfos',
        errorUserInfos: 'error',
      }),
        mapGetters('Auction', {
            settings: 'settings',
        })),
    data() {
      return {
        userPhoneValidate: '',
        acceptCard: false,
        showFormCard: false,
        errors: {
          acceptCard: '',
        },
        flowInProgress: false,
      }
    },
      mounted() {
        window.addEventListener('needConfirmCard', this.confirmCard);
        window.addEventListener('needConfirmPhone', this.confirmPhoneModal);
      },
    watch: {
      activateTheFlow(launch) {
        if (launch && !this.flowInProgress) {
          this.flowInProgress = true;
          this.executeFlow();
        } else {
          this.flowInProgress = false;
        }
      },
      userInfos(val) {
        if (val.hasCreditCardConfirmed && val.hasPhoneConfirmed) {
          this.flowComplete();
          if (this.flowInProgress) {
            // The serious flow is confirmed, we close it
            this.$modal.show('confirmFlowComplete');
          }
        }
      },
    },
    methods: {
      executeFlow(forcePhoneConfirmed = false) {
        if (this.userInfos.hasPhoneConfirmed === false && !forcePhoneConfirmed) {
          this.confirmPhoneModal();
        } else if (this.userInfos.hasCreditCardConfirmed === false) {
          this.$modal.hide('confirmPhone');
          this.$modal.hide('confirmPhoneCode');
          this.confirmCard();
        }
      },
      sentCode(result) {
        // A code was sent by SMS
        this.userPhoneValidate = result.phone;
        // Hide current modal
        this.$modal.hide('confirmPhone');

        // Open modal phone code
        this.$modal.show('confirmPhoneCode');
      },
      confirmPhoneModal() {
        this.$modal.show('confirmPhone')
      },
      confirmCard() {
        this.$modal.show('confirmCard')
      },
      submitAcceptCard(e) {
        const result = this.acceptCard;
        if (result === true) {
          this.errors.acceptCard = '';
          this.showFormCard = true;
        }
        e.preventDefault();
      },
      validePhoneCodeResponse() {
        // code phone confirm, continue the flow
        this.executeFlow(true);
      },
      closedModal(modalName) {
        this.$emit('closeModal', modalName);
      },
      openedModal(modalName) {
        this.$emit('openedModal', modalName);
      },
      flowComplete() {
        this.$emit('flowComplete');
        this.flowInProgress = false;
        // Close all modal
        this.$modal.hide('confirmCard');
        this.$modal.hide('confirmPhoneCode');
        this.$modal.hide('confirmPhone');
      },
    },
  };
</script>
