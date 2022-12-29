<template>
    <modal
            :adaptive="true"
            :max-width="480"
            :scrollable="true"
            @closed="closeModal"
            @opened="opened"
            height="auto"
            id="loginModal"
            name="login"
            width="90%"
    >
        <div class="modal-content">
            <div class="modal-header">
                <div @click="$modal.hide('login')" class="text-right close hidden-xs">&times;</div>
                <div @click="$modal.hide('login')" class="close visible-xs left">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
                <div v-if="headerText !== ''">{{ headerText }}</div>
            </div>
            <div class="modal-body block-separ-top" v-if="onlyView">
                <p class="text-center">
                    <a :href="'comloisirsencheres://login?redirect=comloisirsencheres://auction/' + auctionId"
                       class="btn btn-md btn-primary">Connectez
                        vous</a> <br>
                    OU <br>
                    <a :href="'comloisirsencheres://registration?redirect=comloisirsencheres://auction/'+ auctionId"
                       class="btn btn-md btn-primary">Inscrivez-vous</a>
                </p>
            </div>
            <template v-else>
                <div class="modal-body socialNetwork">
                    <facebook-button
                            :target-path-default="targetPath"
                            btn-class-additional="btn-block"
                    ></facebook-button>
                    <google-button
                            :target-path="targetPath"
                            @errors="sendError"
                            btn-class-additional="btn-block"
                    />
                </div>
                <div class="separator">
                    <hr/>
                </div>
                <div class="modal-body">
                    <form
                            @submit="checkForm"
                            action="/user/login_check"
                            method="post"
                    >
                        <p aria-hidden="true" class="text-danger" v-if="errors.message !== ''">{{ errors.message }}</p>
                        <input name="_target_path" type="hidden" v-model="targetPath">
                        <UserRegisterSimpleinput
                                :error-form="errors.email"
                                :is-valid="emailIsValid"
                                :validate-option="validateOption"
                                elem="emailLogin"
                                label="E-mail"
                                name="_username"
                                placeholder="E-mail"
                                ref="email"
                                type="email"
                                v-model="email"
                        >
                        </UserRegisterSimpleinput>
                        <UserRegisterSimpleinput
                                :errorForm="errors.password"
                                :isValid="passwordIsValid"
                                elem="passwordLogin"
                                label="Mot de passe"
                                name="_password"
                                placeholder="Au moins 6 caractères"
                                ref="password"
                                type="password"
                                v-model="password"
                        >
                        </UserRegisterSimpleinput>
                        <div class="checkbox">
                            <label for="rememberme">
                                <input id="rememberme" name="rememberme" title="se souvenir de moi" type="checkbox"/>Se
                                souvenir de moi
                            </label>
                            <span :data-content="sessionInformations" class="icon-faq"
                                  data-container="#loginModal .modal-content"
                                  data-html="true" data-placement="bottom" data-toggle="popover"></span>
                            <a @click="iLostMyPassword" class="right text-black lostpassword" href="#"><b>Mot de passe
                                oublié ?</b></a>
                        </div>
                        <div :key="checkbox.name" class="checkbox" v-for="checkbox in checkboxes" v-if="checkboxes">
                            <label :for="'checkbox_' + checkbox.name">
                                <input :id="'checkbox_' + checkbox.name"
                                       :name="'checkbox_' + checkbox.name"
                                       :value="checkbox.value"
                                       type="checkbox"
                                       v-model="checkbox.value"
                                >{{ checkbox.label }}
                                <button @click="checkbox.showTCS = !checkbox.showTCS"
                                        class="btn btn-link btn-sm nopadding-only"
                                        type="button">[en savoir plus]
                                </button>
                            </label>
                            <p class="small" v-if="checkbox.toggle && checkbox.showTCS">
                                {{ checkbox.toggle }}
                            </p>
                        </div>
                        <div id="btn_connect_popup">
                            <button class="btn btn-warning btn-block" type="submit">Connexion</button>
                        </div>
                    </form>
                </div>
                <template v-if="headerHideRegisterButton === false">
                    <hr/>
                    <div class="modal-body">
                        <p class="text-center">Vous êtes nouveau sur Loisirs Enchères ? <a @click="iWantToRegister"
                                                                                           class="text-black"
                                                                                           href="#"
                                                                                           rel="nofollow"><b>Inscription</b></a>
                        </p>
                    </div>
                </template>
            </template>
        </div>
    </modal>
</template>

<script>
    import Vue from 'vue';
    import { mapActions, mapGetters } from "vuex"
    import VModal from 'vue-js-modal';
    import http from '../../services/http';
    import UserRegisterSimpleinput from '../UserRegisterSimpleinput.vue';
    import FacebookButton from './FacebookButton.vue';
    import GoogleButton from './GoogleButton.vue';

    Vue.use(VModal);

    export default {
        name: "LoginModal",
        components: {
            UserRegisterSimpleinput,
            FacebookButton,
            GoogleButton,
        },
        props: {
            headerTextDefault: {
                type: String,
                require: false,
                default: '',
            },
            headerHideRegisterButton: {
                type: Boolean,
                require: false,
                default: false,
            },
            targetPathDefault: {
                type: String,
                require: true,
            },
            auctionId: {
                type: String,
                require: false,
            },
            onlyView: {
                type: Boolean,
                require: false,
                default: false,
            },
            checkboxesProps: {
                type: Array,
                required: false,
                default() {
                    return [];
                },
            },
        },
        data() {
            return {
                headerText: this.onlyView && this.headerTextDefault === '' ? 'Inscrivez-vous ou connectez-vous pour enchérir' : this.headerTextDefault,
                email: '',
                password: '',
                targetPath: this.targetPathDefault,
                emailIsValid: false,
                passwordIsValid: false,
                validateOption: {
                    notCheckBbox: true,
                    notCheckSpecialChars: true,
                },
                showTCS: false,
                checkboxes: [],
            }
        },
        mounted() {
            if (this.checkboxesProps.length) {
                this.checkboxesProps.forEach((checkbox) => {
                    checkbox.showTCS = false;
                    this.$set(this.checkboxes, this.checkboxes.length, checkbox);
                });
            }
        },
        watch: {
            isOpenLoginModal(val) {
                if (val) {
                    this.$modal.show('login');
                } else {
                    this.$modal.hide('login');
                }
            },
            register2Step(val) {
                if (val) {
                    this.$modal.hide('login');
                }
            },
        },
        computed: Object.assign({
                sessionInformations() {
                    return "Pour des raisons de sécurité vous êtes déconnecté de Loisirs Enchères sur cet ordinateur ou téléphone au bout d'un certain moment.<br />Vous pouvez étendre la durée de vie de votre connexion avec l'option se souvenir de moi.<br />Durée session normale : " + this.sessionDuration() + " jours<br />Durée du se 'souvenir de moi' : " + this.remembermeExpire() + " jours";
                },
            },
            mapGetters('AuthentificationAction', {
                isOpenLoginModal: 'openLoginModal',
                register2Step: 'register2Step',
                errors: 'loginError',
            })),
        methods: Object.assign({
                closeModal() {
                    if (this.isOpenLoginModal) {
                        this.openLoginModal();
                    }
                },
                iWantToRegister() {
                    this.openLoginModal(); // Hide login modal
                    this.openRegisterModal(); // Open register modal
                },
                iLostMyPassword() {
                    this.openLoginModal(); // Hide login modal
                    this.openLostPasswordModal(); // Open password modal
                },
                opened() {
                    $('[data-toggle="popover"]').popover();
                    this.sendError({
                        email: '',
                        password: '',
                        message: '',
                    });
                },
                sessionDuration() {
                    // define the session duration
                    const session = this.$config.get("session.storage.options");
                    return Math.round(session.cookie_lifetime / (60 * 60 * 24));
                },
                remembermeExpire() {
                    // define the rememberme expire time
                    const expire = this.$config.get("rememberme.expire");
                    return Math.round(expire / (60 * 60 * 24));
                },
                checkForm(e) {
                    // check email
                    let result = this.validateEmail(this.email, this.validateOption);
                    if (result === true) {
                        this.sendError({
                            email: '',
                        });
                        this.emailIsValid = true;
                    } else {
                        this.emailIsValid = false;
                        this.sendError({
                            email: result,
                        });
                    }

                    // Check password
                    result = this.validate('password', this.password);
                    if (result === true) {
                        this.sendError({
                            password: '',
                        });
                        this.passwordIsValid = true;
                    } else {
                        this.passwordIsValid = false;
                        this.sendError({
                            password: result,
                        });
                    }

                    // Check if all input is valide
                    if (this.emailIsValid && this.passwordIsValid) {
                        this.login();
                    }

                    e.preventDefault();
                },
                getEulerianEdata(done) {
                    if (typeof window.eulerianTrackAction === "function") {
                        http.get('/eulerian/edata', {
                            params: {
                                track: 'login',
                            },
                        }).then((edata) => {
                            if ('data' in edata) {
                                window.eulerianTrackAction(edata.data);
                            }
                            done();
                        }).catch(() => {
                            done();
                        });
                    } else {
                        done();
                    }
                },
                login() {
                    this.showGeneralLoader();
                    const form = new FormData();
                    form.append('_username', this.email);
                    form.append('_password', this.password);
                    form.append('_target_path', this.targetPath);
                    if (this.checkboxes.length) {
                        this.checkboxes.forEach((checkbox) => {
                            const inThreeHours = new Date(new Date().getTime() + 3 * 60 * 60 * 1000); // 3 hours
                            Cookies.set(checkbox.name, checkbox.value ? 1 : 0, {
                                expires: inThreeHours,
                            });
                        });
                    }

                    http.post('/user/login_check', form).then((response) => {
                        this.getEulerianEdata(() => {
                            const data = response.data; /* eslint prefer-destructuring: 0 */
                            this.sendError({
                                message: '',
                            });
                            if (typeof data.error !== 'undefined' && data.error !== '') {
                                if (typeof data.url !== 'undefined') {
                                    window.location = data.url;
                                } else if (data.error === false) {
                                    window.location.reload();
                                } else {
                                    this.sendError({
                                        message: data.error,
                                    });
                                    this.hideGeneralLoader();
                                }
                            } else {
                                if (typeof data.auctionsPending !== 'undefined') {
                                    window.location = urls['user.auctions'];
                                } else if (typeof data.goto !== 'undefined') {
                                    window.location = data.goto;
                                } else {
                                    window.location.reload();
                                }
                            } /* eslint prefer-destructuring: 1 */
                        });
                    }).catch((response) => {
                        this.sendError({
                            message: '',
                        });
                        if (this.$root.$options.methods.errsIsDefined()) {
                            leErrs.meta.Code = response.code;
                            leErrs.track(new Error("LoginModal login : " + response.error));
                        }
                        if (typeof response.error === "string" && response.error !== '') {
                            this.sendError({
                                message: response.error,
                            });
                            this.hideGeneralLoader();
                        } else {
                            location.reload();
                        }
                    })
                },
                // get error message with $emit
                sendError(data) {
                    // set error in store
                    data.authType = 'login';
                    this.setError(data);
                },
            },
            mapActions("AuthentificationAction", [
                "openRegisterModal",
                "openLoginModal",
                "openLostPasswordModal",
                "setError",
            ])),
    }
</script>
