<template>
    <div>
        <div
                :class="btnClass"
                @click="handleClickSignIn"
                v-if="displayType == 'btn'"
        >
            <img
                    :src="$root.assetCdn + '/assets/img/social/google.png'"
                    alt="Google Logo"
                    width="20px"
            >
            <span>{{ btnText }}</span>
        </div>
        <a
                @click="handleClickSignIn"
                class="text-black"
                href="#"
                v-else
        >
            google
        </a>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { mapActions } from "vuex"

    import GAuth from 'vue-google-oauth2'
    import http from '../../services/http';
    import Config from "../../config";

    const gauthOption = {
        clientId: Config.get("google.config").clientId + '.apps.googleusercontent.com',
        prompt: 'select_account',
    };

    Vue.use(GAuth, gauthOption);

    /**
     * @vuese Display a single button or a link for Google authentication
     */
    export default {
        name: "GoogleButton",
        props: {
            /**
             * @vuese
             * Default type is button (btn) else it is a link
             */
            displayType: {
                type: String,
                required: false,
                default: 'btn',
            },
            targetPath: {
                type: String,
                required: false,
                default: '',
            },
            /**
             * @vuese
             * Change the wording of the button
             */
            btnText: {
                type: String,
                required: false,
                default: 'Connexion avec Google',
            },
            /**
             * @vuese
             * Add css class in btn
             */
            btnClassAdditional: {
                type: String,
                required: false,
                default: '',
            },
        },
        data() {
            return {
                gToken: null,
            }
        },
        computed: {
            // Check button type lookin btnLabel
            btnType() {
                if (this.btnText.indexOf("Connexion") >= 0) {
                    return "login";
                }
                return "register";
            },
            // Define the css class
            btnClass() {
                let str = this.displayType ? 'btn btn-google' : '';
                if (this.btnClassAdditional !== '') {
                    if (str !== '') {
                        str += ' ';
                    }
                    str += this.btnClassAdditional;
                }
                return str;
            },
        },
        methods: Object.assign({
            handleClickSignIn() {
                this.$gAuth.signIn()
                    .then((GoogleUser) => {
                        const form = new FormData();
                        this.gToken = GoogleUser.getAuthResponse().id_token;
                        form.append('oauth_token', this.gToken);
                        http.post("/user/login/google", form).then((response) => {
                          const data = response.data;
                          if (data.created) {
                            this.submitGoogleLoginForm(response);
                          } else {
                            // Register in 2 step
                            data.first_name = data.given_name;
                            data.last_name = data.family_name;
                            this.setData2Step(data);
                            this.register2Step(true);
                            this.hideGeneralLoader();
                          }
                        }).catch((response) => {
                            if (this.$root.$options.methods.errsIsDefined()) {
                                leErrs.meta.Code = response.code;
                                leErrs.track(new Error("GoogleButton.vue handleClickSignIn : " + response.message));
                            }
                        })
                    })
                    .catch((error) => {
                        if (error.error === 'popup_blocked_by_browser') {
                            this.$emit('errors', {
                                message: "popup_blocked_by_browser",
                            });
                        } else {
                            if (error.error !== 'popup_closed_by_user' && this.$root.$options.methods.errsIsDefined()) {
                                leErrs.meta.Code = error.code;
                                const errorName = error.error ? error.error : error;
                                leErrs.track(new Error("GoogleButton.vue handleClickSignIn : " + errorName));
                            }
                        }
                    })
            },
            submitGoogleLoginForm(response) {
                if (response.justCreated) {
                    dataLayer.push({
                        'event': 'registrationConfirmed',
                        'userId': response.id,
                    });
                    ga('send', 'pageview', {
                        title: "Acount validated",
                        page: "/user/registration-confirm",
                    });
                }
                if (typeof window.eulerianTrackAction === "function") {
                    // Tracking Eulerian
                    const edata = [
                        'uid', response.data.num,
                        'email', response.data.leadNumber,
                        'profile', response.data.profile,
                        'pagegroup', ((this.btnText.indexOf("Connexion") < 0) ? 'Inscription' : 'Connexion'),
                        'optin-mail', (response.data.nl ? 'OUI' : 'NON'),
                        'optin-sms', 'NON',
                        'type-compte', 'g-connect',
                        'path', this.btnType,
                    ];
                    window.eulerianTrackAction(edata);
                }

                    // Login user
                    const form = document.createElement("form");
                    form.setAttribute("method", 'post');
                    form.setAttribute("action", "/user/login_check");
                    const hiddenFieldUsername = document.createElement("input");
                    hiddenFieldUsername.setAttribute("type", "hidden");
                    hiddenFieldUsername.setAttribute("name", '_username');
                    hiddenFieldUsername.setAttribute("value", '_googlelogin');
                    form.appendChild(hiddenFieldUsername);
                    const hiddenFieldPassword = document.createElement("input");
                    hiddenFieldPassword.setAttribute("type", "hidden");
                    hiddenFieldPassword.setAttribute("name", '_password');
                    hiddenFieldPassword.setAttribute("value", this.gToken);
                    form.appendChild(hiddenFieldPassword);

                    if (this.targetPath !== '') {
                        const hiddenFieldPath = document.createElement("input");
                        hiddenFieldPath.setAttribute("type", "hidden");
                        hiddenFieldPath.setAttribute("name", "_target_path");
                        hiddenFieldPath.setAttribute("value", this.targetPath + window.location.hash);
                        form.appendChild(hiddenFieldPath);
                    }

                    document.body.appendChild(form);
                    form.submit();
                },
            },
            mapActions("AuthentificationAction", [
                "register2Step",
                "setData2Step",
            ])),
    }
</script>
