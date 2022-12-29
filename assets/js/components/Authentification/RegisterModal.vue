<template>
    <modal
            :adaptive="true"
            :max-width="480"
            :scrollable="true"
            @closed="closeModal"
            @opened="opened"
            height="auto"
            id="registerModal"
            name="register"
            width="90%"
    >
        <div class="modal-content">
            <div :class="{'nopadding-bottom': !registerSuccess}" class="modal-body">
                <div @click="$modal.hide('register')" class="text-right close hidden-xs">&times;</div>
                <div @click="$modal.hide('register')" class="close visible-xs left">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
                <div class="clearfix"></div>
                <template v-if="registerSuccess">
                    <p class="text-black confirmEmail-title"><b>{{ registerSuccessData.title }}</b></p>
                    <p class="confirmEmail-content">{{ registerSuccessData.result }}</p>
                </template>
                <template v-else>
                    <template v-if="showForm">
                        <div class="text-center network">
                            Inscription avec
                            <facebook-button
                                    :target-path-default="targetPath"
                                    :use-btn-style="false"
                                    btn-class-additional="text-black"
                                    btn-text="facebook"
                            ></facebook-button>
                            ou
                            <google-button
                                    :target-path="targetPath"
                                    @errors="sendError"
                                    display-type="text"
                            />
                        </div>
                    </template>
                    <template v-else>
                        <facebook-button
                                :target-path-default="targetPath"
                                btn-class-additional="btn-block"
                                btn-text="Inscription avec Facebook"
                        ></facebook-button>
                        <google-button
                                :target-path="targetPath"
                                @errors="sendError"
                                btn-class-additional="btn-block"
                                btn-text="Inscription avec Google"
                        />
                        <form>
                            <input id="connect_form_hidden" name="_target_path" type="hidden" v-model="targetPath">
                            <!-- Used by facebook connect -->
                        </form>
                    </template>
                </template>
            </div>
            <template v-if="registerSuccess === false">
                <div class="separator">
                    <hr/>
                </div>
                <div class="modal-body nopadding-top">
                    <div class="alert alert-danger" v-if="errors.message !== ''">
                        {{ errors.message }}
                    </div>
                    <transition name="slide-fade" v-if="showForm">
                        <user-register-form-without-step
                                :clearfix="['hide']"
                                :target-path="targetPath"
                                @submitResponse="registerReponse"
                                newsletter-label="Je m'inscris à la newsletter et je reçois un cadeau !"
                                submit-class="btn btn-warning"
                                submit-text="S'inscrire"
                        ></user-register-form-without-step>
                    </transition>
                    <button @click="showForm = true" class="btn btn-warning btn-block center-block" v-else>Inscription
                        avec e-mail
                    </button>
                </div>
                <div class="modal-footer">
                    <p class="text-center">Vous êtes déjà membre ? <a @click="iWantToLogin" class="text-black" href="#"
                                                                      rel="nofollow"><b>Connexion</b></a></p>
                </div>
            </template>
        </div>
    </modal>
</template>

<script>
    import Vue from 'vue';
    import { mapActions, mapGetters } from "vuex"
    import VModal from 'vue-js-modal';
    import UserRegisterFormWithoutStep from '../UserRegisterFormWithoutStep.vue';
    import FacebookButton from './FacebookButton.vue';
    import GoogleButton from './GoogleButton.vue';

    Vue.use(VModal);

    export default {
        name: "RegisterModal",
        components: {
            UserRegisterFormWithoutStep,
            FacebookButton,
            GoogleButton,
        },
        props: {
            openModal: {
                type: Boolean,
                require: true,
            },
            targetPathDefault: {
                type: String,
                require: true,
            },
        },
        data() {
            return {
                targetPath: this.targetPathDefault,
                showForm: false,
                registerSuccess: false,
                registerSuccessData: {},
            }
        },
        computed: Object.assign({},
            mapGetters('AuthentificationAction', {
                isOpenRegisterModal: 'openRegisterModal',
                register2Step: 'register2Step',
                errors: 'registerError',
            })),
        watch: {
            openModal(val) {
                if (val) {
                    this.$modal.show('register');
                } else {
                    this.showForm = false;
                }
            },
            register2Step(val) {
                if (val) {
                    this.$modal.hide('register');
                    this.showForm = false;
                }
            },
        },
        methods: Object.assign({
                closeModal() {
                    if (this.isOpenRegisterModal) {
                        this.openRegisterModal();
                    }
                },
                iWantToLogin() {
                    this.$modal.hide('register');
                    this.showForm = false;
                    this.openLoginModal(); // Open modal
                },
                opened() {
                    $('[data-toggle="popover"]').popover();
                    dataLayer.push({
                        'event': 'openRegister',
                    });
                },
                registerReponse(data) {
                    this.registerSuccess = data.success === true;
                    this.sendError(data.errors);
                    this.registerSuccessData = data;
                },
                // get error message with $emit
                sendError(data) {
                    // set error in store
                    data.authType = 'register'
                    this.setError(data);
                },
            },
            mapActions("AuthentificationAction", [
                "openLoginModal",
                "openRegisterModal",
                "setError",
            ])),
        mounted() {
            this.sendError({
                email: '',
                message: '',
            });
        },
    }
</script>
