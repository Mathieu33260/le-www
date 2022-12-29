<template>
    <div id="registerStatus">
        <p v-if="showTitle && notEmptyObject(userInfos)">Remplissez les étapes suivantes pour mettre toutes les chances
            de votre côté :</p>
        <div class="row" v-if="notEmptyObject(userInfos)">
            <div :class="itemClass" v-if="showStepOne">
                <div class="media first valide">
                    <div class="media-left">
                        <span class="media-object img-circle text-center"><i class="icon-check-sytle-lineal"></i></span>
                    </div>
                    <div class="media-body">
                        <b class="media-heading">Inscription à l'enchère</b>
                        Vous avez renseigné les informations générales pour la création de votre compte.
                    </div>
                </div>
            </div>
            <div :class="itemClass">
                <div :class="{ valide: userInfos.hasEmailConfirmed }" @click="confirmEmailModal" class="media">
                    <div class="media-left">
                    <span class="media-object img-circle text-center">
                      <i
                              class="icon-check-sytle-lineal"
                              v-if="userInfos.hasEmailConfirmed"
                      />
                      </span>
                    </div>
                    <div class="media-body">
                        <b class="media-heading">Confirmation de votre e-mail</b>
                        <template v-if="userInfos.hasEmailConfirmed">
                            Vous avez bien confirmé votre adresse e-mail {{ userInfos.email }}.
                        </template>
                        <template v-else>
                            Un e-mail a été envoyé sur votre adresse {{ userInfos.email }}. Ouvrez-le et cliquez sur «
                            Confirmer mon adresse ».<br>
                            <button @click="openMissingEmailmodal"
                                    class="btn btn-link nopadding-left-only nopadding-right-only">
                                Je n'arrive pas à confirmer mon email
                            </button>
                        </template>
                    </div>
                </div>
            </div>
            <div :class="itemClass" @click="confirmPhoneModal" v-if="usePhoneValidation">
                <div :class="{ valide: userInfos.hasPhoneConfirmed }" class="media">
                    <div class="media-left">
                        <span class="media-object img-circle text-center"><i class="icon-check-sytle-lineal"
                                                                             v-if="userInfos.hasPhoneConfirmed"></i></span>
                    </div>
                    <div class="media-body">
                        <b class="media-heading">Saisie de votre numéro de téléphone</b>
                        <template v-if="userInfos.hasPhoneConfirmed">Vous avez bien confirmé votre numéro de téléphone
                            {{ userInfos.phone }}.
                        </template>
                        <template v-else>
                            {{ phoneContent }}<br/>
                            <span v-if="userInfos.hasEmailConfirmed === false">Je renseigne mon numéro</span>
                        </template>
                    </div>
                </div>
                <button class="btn btn-warning btn-circle btn-block"
                        v-if="userInfos.hasEmailConfirmed && userInfos.hasPhoneConfirmed === false">Je renseigne mon numéro
                </button>
            </div>
            <div class="accountComplete col-xs-12" v-if="showBlockAccountComplete">
                <p v-html="blockAccountCompleteText"></p>
                <a :class="blockAccountCompleteLinkCss" :href="blockAccountCompleteLink"
                   v-html="blockAccountCompleteLinkText" v-if="blockAccountCompleteLink !== ''"></a>
            </div>
        </div>
        <div class="loader text-center" v-else-if="showLoader">
            <img :src="$root.assetCdn+'/assets/gfx/loader.gif?v=20170307'" width="50"><br/>
            <small>Récupération de vos données en cours...</small>
        </div>
        <modal :adaptive="true" :max-width="480" height="auto" name="confirmEmail" width="90%">
            <div class="modal-content">
                <div
                        @click="$modal.hide('confirmEmail')"
                        class="text-right close"
                >
                    &times;
                </div>
                <div class="modal-header">
                    <p class="modal-title">
                        Confirmation de votre e-mail
                    </p>
                </div>
                <div class="modal-body">
                    <p>Consultez votre boîte mail et cliquez sur le lien joint à l’e-mail de confirmation pour valider
                        cette étape.</p>
                    <p>Notre message a peut-être été filtré par erreur, pensez à vérifier votre dossier Spam/Courrier
                        indérisable.</p>
                    <p>Pour tenter un nouvel envoi, vérifiez votre adresse et cliquez sur le bouton ci-dessous.</p>
                    <div class="form">
                        <form
                                @submit="submitEmail"
                                class="form-inline"
                                method="post"
                        >
                            <fieldset class="row">
                                <UserRegisterSimpleinput
                                        :disabled-default-validate="true"
                                        :error-form="errors.email"
                                        :errorForm="errors.email"
                                        :is-valid="emailIsValid"
                                        :set-value="userInfos.email"
                                        elem="email"
                                        form-group-class="col-xs-12"
                                        label="Email"
                                        placeholder="exemple@email.com"
                                        ref="email"
                                        type="email"
                                        v-model="email"
                                        v-on:blur="validateEmail()"
                                />
                                <div class="Form__section col-xs-12">
                                    <p class="Form__paragraphe">
                                        <button class="Form__button btn btn-warning btn-circle btn-block" type="submit">
                                            Renvoyer un e-mail
                                        </button>
                                    </p>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        </modal>
        <modal :adaptive="true" :max-width="480" height="auto" name="confirmPhone" v-if="usePhoneValidation"
               width="90%">
            <div class="modal-content">
                <div @click="$modal.hide('confirmPhone')" class="text-right close">&times;</div>
                <div class="modal-header">
                    Étape 1 sur 2
                </div>
                <div class="modal-body">
                    <p class="modal-title">Confirmez votre numéro de téléphone</p>
                    <p>Indiquez votre numéro de téléphone mobile, vous recevrez un code de vérification par SMS.</p>
                    <div class="form">
                        <user-form-phone-validation
                                @submitResponse="sentCode"
                                btn-text="Envoyer un code"
                                form-group-class="col-xs-12"
                                label="Numéro de téléphone mobile"
                                placeholder="Numéro de téléphone mobile"
                        ></user-form-phone-validation>
                    </div>
                </div>
            </div>
        </modal>
        <modal :adaptive="true" :max-width="480" height="auto" name="confirmPhoneCode" v-if="usePhoneValidation"
               width="90%">
            <div class="modal-content">
                <div @click="$modal.hide('confirmPhoneCode')" class="text-right close">&times;</div>
                <div class="modal-header">
                    Étape 2 sur 2
                </div>
                <div class="modal-body">
                    <p class="modal-title">Confirmez votre numéro de téléphone</p>
                    <p>Recopiez le code de confirmation reçu par SMS pour valider cette étape.</p>
                    <div class="form">
                        <user-form-phone-code-validation
                                :phone="phone"
                                btn-text="Valider le code"
                                form-group-class="col-xs-12"
                                label="Code de vérification"
                                placeholder="Code de vérification"
                        ></user-form-phone-code-validation>
                    </div>
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { mapActions, mapGetters } from "vuex";
    import VModal from 'vue-js-modal';
    import VueScrollTo from "vue-scrollto";
    import http from '../../services/http';
    import UserFormPhoneValidation from './UserFormPhoneValidation.vue';
    import UserFormPhoneCodeValidation from './UserFormPhoneCodeValidation.vue';
    import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';

    Vue.use(VModal);
    Vue.use(VueScrollTo);

    export default {
        name: "UserRegisterStatus",
        components: {
            UserFormPhoneValidation,
            UserFormPhoneCodeValidation,
            UserRegisterSimpleinput,
        },
        props: {
            blockAccountCompleteText: {
                type: String,
                required: false,
                default: '',
            },
            blockAccountCompleteLink: {
                type: String,
                required: false,
                default: '',
            },
            blockAccountCompleteLinkText: {
                type: String,
                required: false,
                default: '',
            },
            blockAccountCompleteLinkCss: {
                type: String,
                required: false,
                default: 'btn btn-warning btn-block btn-circle',
            },
            usePhoneValidation: {
                type: Boolean,
                required: false,
                default: true,
            },
            showTitle: {
                type: Boolean,
                required: false,
                default: true,
            },
            disabledScroll: {
                type: Boolean,
                required: false,
                default: false,
            },
            itemClass: {
                type: String,
                required: false,
                default: 'col-md-4',
            },
            showStepOne: {
                type: Boolean,
                required: false,
                default: true,
            },
            phoneContent: {
                type: String,
                required: true,
            },
        },
        data() {
            return {
                email: '',
                phone: '',
                code: '',
                phoneIsValid: false,
                codeIsValid: false,
                emailIsValid: false,
                errors: {
                    phone: '',
                    code: '',
                    email: '',
                },
            }
        },
        watch: {
            connected(val) {
                if (val === true) {
                    this.userInitialize();
                }
            },
            userInfos(val) {
                this.email = val.email;
                if (!this.disabledScroll) {
                    this.$scrollTo('#registerStatus', 500);
                }
            },
        },
        methods: Object.assign({
                userInitialize() {
                    this.$store.dispatch("UserDatas/initialize");
                },
                confirmEmailModal() {
                    if (this.userInfos.hasEmailConfirmed === false) {
                        this.$modal.show('confirmEmail');
                    }
                },
                confirmPhoneModal() {
                    if (this.userInfos.hasPhoneConfirmed === false) {
                        this.$modal.show('confirmPhone')
                    }
                },
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
                            this.$store.dispatch("UserDatas/initialize");
                            this.$modal.hide('confirmEmail');
                        }).catch((error) => {
                            const data = error.response.data;
                            if (this.$root.$options.methods.errsIsDefined()) {
                                leErrs.meta.Code = data.code;
                                leErrs.track(new Error("UserRegisterStatus submitEmail : " + data.message));
                            }
                            this.errors.email = data.message;
                        });
                    }
                },
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
                        const data = new FormData();
                        const self = this;
                        data.append('phone', this.phone);
                        http({
                            method: 'post',
                            url: '/user/profile',
                            data,
                            config: {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            },
                        }).then((response) => {
                            const data = response.data;

                            // Hide current modal
                            this.$modal.hide('confirmPhone');

                            // Open modal phone code
                            this.$modal.show('confirmPhoneCode');
                        }).catch((response) => {
                            if (this.$root.$options.methods.errsIsDefined()) {
                                leErrs.meta.Code = response.code;
                                leErrs.track(new Error("UserRegisterStatus submitPhoneNumber : " + response.error));
                            }
                            self.errors.phone = response.response.data.message;
                        })
                    }
                    e.preventDefault();
                },
                submitCodeNumber(e) {
                    const data = new FormData();
                    const self = this;
                    data.append('phone', this.phone);
                    data.append('code', this.code);
                    http({
                        method: 'post',
                        url: '/user/profile',
                        data,
                        config: {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        },
                    }).then((response) => {
                        const data = response.data;

                        if (data.error === false) {
                            this.$modal.hide('confirmPhoneCode');
                        }
                    }).catch((response) => {
                        if (this.$root.$options.methods.errsIsDefined()) {
                            leErrs.meta.Code = response.code;
                            leErrs.track(new Error("UserRegisterStatus submitCodeNumber : " + response.error));
                        }
                        self.errors.code = response.response.data.message;
                    });

                    e.preventDefault();
                },
                sentCode(result) {
                    // A code was sent by SMS
                    this.phone = result.phone;
                    // Hide current modal
                    this.$modal.hide('confirmPhone');

                    // Open modal phone code
                    this.$modal.show('confirmPhoneCode');
                },
            },
            mapActions("AuthentificationAction", [
                "openMissingEmailmodal",
            ])),
        computed: Object.assign({
                showBlockAccountComplete() {
                    return (this.blockAccountCompleteText !== '' || (this.blockAccountCompleteLink !== '' && this.blockAccountCompleteLinkText !== '')) && this.notEmptyObject(this.userInfos) && this.userInfos.hasEmailConfirmed && this.userInfos.hasPhoneConfirmed;
                },
                showLoader() {
                    return this.errorUserInfos === null
                },
            },
            mapGetters('User', {
                connected: 'connected',
            }),
            mapGetters('UserDatas', {
                userInfos: 'userInfos',
                errorUserInfos: 'error',
            })),
    };
</script>
