<template>
    <div>
        <div v-if="useBtnStyle" :class="btnClass" @click="connectFacebook" :disabled="FBStatut == ''">
            <img :src="$root.assetCdn + '/assets/img/social/facebook.png'" alt="#" width="20" /> <span>{{ btnText }}</span>
        </div>
        <template v-else>
            <a href="#" :class="btnClass" @click="connectFacebook">{{ btnText }}</a>
        </template>
    </div>
</template>

<script>
  import Vue from 'vue';
  import { mapActions, mapGetters } from "vuex"
  import VModal from 'vue-js-modal';
  import http from '../../services/http';

  Vue.use(VModal);

  export default {
    name: "FacebookButton",
    props: {
      btnClassAdditional: {
        type: String,
        required: false,
        default: '',
      },
      btnText: {
        type: String,
        required: false,
        default: 'Connexion avec Facebook',
      },
      targetPathDefault: {
        type: String,
        required: false,
        default: '',
      },
      useBtnStyle: {
        type: Boolean,
        require: false,
        default: true,
      },
    },
    data() {
      return {
        FBStatut: '',
        token: '',
        targetPath: this.targetPathDefault,
      }
    },
    watch: {
      missingEmailComplete(data) {
        if (this.notEmptyObject(data)) {
          this.submitFacebookLoginForm(data);
        }
      },
    },
    methods: Object.assign({
        connectFacebook() {
            Cookies('screenWidth', window.innerWidth);

            if (this.FBStatut === 'connected') {
              // User is connected to app
              this.showGeneralLoader();
              // Create User
              const form = new FormData();
              form.append('oauth_token', this.token);
              form.append('screenWidth', window.innerWidth);
              http.post("/user/login/facebook", form).then((response) => {
                const data = response.data;
                if (data.created) {
                  this.submitFacebookLoginForm(data);
                } else {
                  // Register in 2 step
                  data.oauthSource = 'facebook';
                  this.setData2Step(data);
                  this.register2Step(true);
                  this.hideGeneralLoader();
                }
              }).catch((response) => {
                if (response.response.data.message === 'facebook.no_email_found') {
                  if (this.isOpenRegisterModal) {
                    this.openRegisterModal();
                  }
                  this.facebookToken(this.token);
                  this.openMissingEmailmodal();
                  this.hideGeneralLoader();
                }
              })
            } else {
              // User not connected to app or user not login in FB
              this.login();
            }

            ga('send', 'event', 'subscription', 'facebook');
          },
        login() {
            FB.login((response) => {
              this.FBStatut = response.status;
              if (this.FBStatut === 'connected') {
                // Logged into your app and Facebook.
                this.token = response.authResponse.accessToken;
                this.connectFacebook();
              }
            }, { scope: 'public_profile,email,user_birthday' });
          },
        submitFacebookLoginForm(response) {
            if (response.justCreated) {
              dataLayer.push({
                'event': 'registrationConfirmed',
                'userId': response.id,
              });
              ga('send', 'pageview', { title: "Acount validated", page: "/user/registration-confirm" });
            }
            if (typeof window.eulerianTrackAction === "function") {
                // Tracking Eulerian
                const edata = [
                    'uid', response.num,
                    'email', response.leadNumber,
                    'profile', response.profile,
                    'pagegroup', ((this.btnText.indexOf("Connexion") < 0) ? 'Inscription' : 'Connexion'),
                    'optin-mail', (response.nl ? 'OUI' : 'NON'),
                    'optin-sms', 'NON',
                    'type-compte', 'fb-connect',
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
            hiddenFieldUsername.setAttribute("value", '_fblogin');
            form.appendChild(hiddenFieldUsername);
            const hiddenFieldPassword = document.createElement("input");
            hiddenFieldPassword.setAttribute("type", "hidden");
            hiddenFieldPassword.setAttribute("name", '_password');
            hiddenFieldPassword.setAttribute("value", this.token);
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
        "openRegisterModal",
        "openMissingEmailmodal",
        "facebookToken",
        "register2Step",
        "setData2Step",
      ])),
    computed: Object.assign({
        btnClass() {
            let str = this.useBtnStyle ? 'btn btn-facebook connectfacebook' : '';
            if (this.btnClassAdditional !== '') {
              if (str !== '') {
                str += ' ';
              }
              str += this.btnClassAdditional;
            }
            return str;
        },
        // Check button type looking btnLabel
        btnType() {
          if (this.btnText.indexOf("Connexion") >= 0) {
              return "login";
          }
          return "register";
        },
      },
      mapGetters('AuthentificationAction', {
        isOpenRegisterModal: 'openRegisterModal',
        missingEmailComplete: 'missingEmailComplete',
      })),
    created() {
      /* eslint-disable */
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/fr_FR/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
      /* eslint-enable */

      if (typeof FB === 'undefined') {
        window.fbAsyncInit = () => {
          FB.init({
            appId: this.$config.get('facebook_appId'),
            status: true,
            cookie: true,
            xfbml: true,
            version: 'v2.10',
          });
          FB.getLoginStatus((response) => {
            this.FBStatut = response.status;
            if (response.status === 'connected') {
              this.token = response.authResponse.accessToken;
            }
          });

          FB.Canvas.setAutoGrow(true);
        };
      } else {
        FB.getLoginStatus((response) => {
          this.FBStatut = response.status;
          if (response.status === 'connected') {
            this.token = response.authResponse.accessToken;
          }
        });
      }
    },
    mounted() {
      if (document.URL.indexOf('back_from_fb=1') !== -1 && document.URL.indexOf('code=') !== -1) {
        window.opener.FB.getLoginStatus(() => {}, true);
        window.opener.checkLoginState();
        window.close();
      }
    },
  }
</script>
