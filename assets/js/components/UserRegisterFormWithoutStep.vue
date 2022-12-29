<template>
    <div class="user-register-form-without-step__wrapper">
        <form v-if="!createdAccount" class="form-horizontal"
            id="formulaire"
            @submit="checkForm"
            method="post">
            <fieldset class="row">
                <legend v-if="legend !== ''" class="col-xs-12" v-text="legend"></legend>
                <UserRegisterSimpleinput elem="email"
                    :formGroupClass="getInputConfig('email', 'formGroupClass')"
                    type="email"
                    label="Email"
                    placeholder="exemple@email.com"
                    ref="email"
                    :isValid="emailIsValid"
                    :errorForm="errors.email"
                    v-on:blur="validateEmail()"
                    v-model="email"
                    :set-value="getInputConfig('email', 'value')"
                >
                </UserRegisterSimpleinput>
                <UserRegisterSimpleinput elem="firstName"
                    :formGroupClass="getInputConfig('firstName', 'formGroupClass')"
                    type="text"
                    label="Prénom"
                    ref="firstName"
                    placeholder="Prénom"
                    :isValid="firstNameIsValid"
                    :errorForm="errors.firstName"
                    v-model="firstName"
                    :set-value="getInputConfig('firstName', 'value')"
                >
                </UserRegisterSimpleinput>
                <div class="clearfix" :class="clearfix[0]"></div>
                <UserRegisterSimpleinput type="text"
                    :formGroupClass="getInputConfig('lastName', 'formGroupClass')"
                    elem="lastName"
                    label="Nom"
                    ref="lastName"
                    placeholder="Nom"
                    :errorForm="errors.lastName"
                    :isValid="lastNameIsValid"
                    v-model="lastName"
                    :set-value="getInputConfig('lastName', 'value')"
                >
                </UserRegisterSimpleinput>
                <UserRegisterSimpleinput
                    :formGroupClass="getInputConfig('password', 'formGroupClass')"
                    type="password"
                    elem="password"
                    label="Mot de passe"
                    ref="password"
                    :isValid="passwordIsValid"
                    :errorForm="errors.password"
                    placeholder="Au moins 6 caractères"
                    v-model="password"
                    :set-value="getInputConfig('password', 'value')"
                >
                </UserRegisterSimpleinput>
                <div class="clearfix" :class="clearfix[1]"></div>
                <div class="newsletterBlock col-xs-12">
                    <p class="Form__paragraphe">
                        <label for="want_newsletter">
                            <input type="checkbox"
                                id="want_newsletter"
                                name="want_newsletter"
                                v-model="checked"
                                value="1">
                            {{ newsletterLabel }}
                        </label>
                    </p>
                </div>
                <div class="Form__section col-xs-12">
                    <p class="Form__paragraphe">
                        <button :class="'Form__button ' + submitClass" type="submit">{{ submitText }}</button>
                        <span class="cgv">En cliquant sur « {{ submitText }} », vous acceptez <a href="/content/cgu" target="_blank" rel="nofollow">les conditions générales et particulières de prestation de services</a> et <a href="/content/privacy-policy" target="_blank" rel="nofollow">la politique de confidentialité de Loisirs Enchères</a>.</span>
                    </p>
                </div>
            </fieldset>
        </form>
        <div v-else-if="confirmationTitle !== '' || confirmationHtml !== ''" class="confirmation" :class="{ withoutEasyBid: !withEasyBid }">
            <p v-if="confirmationTitle !== ''" v-html="confirmationTitle" class="title"></p>
            <div v-if="confirmationHtml !== ''" v-html="confirmationHtml"></div>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapGetters } from 'vuex';
    import http from '../services/http';
    import UserRegisterSimpleinput from './UserRegisterSimpleinput.vue';

    export default {
        name: 'UserRegisterFormWithoutStep',
        components: {
          UserRegisterSimpleinput,
        },
      props: {
        legend: {
          type: String,
          require: false,
          default: '',
        },
        settings: {
          type: Object,
          required: false,
          default: () => ({}),
        },
        userIsLogged: {
          type: Boolean,
          required: false,
          default: false,
        },
        confirmationTitle: {
          type: String,
          default: '',
          required: false,
        },
        confirmationHtml: {
          type: String,
          default: '',
          required: false,
        },
        inputConfig: {
          type: Object,
          require: false,
          default: () => ({}),
        },
        newsletterLabel: {
          type: String,
          require: false,
          default: "Je veux être alerté par email du début de l'enchère et recevoir en avant première les offres Loisirs Enchères (vous pouvez vous désinscrire à tout moment)",
        },
        submitText: {
          type: String,
          require: false,
          default: "Je valide",
        },
        submitClass: {
          type: String,
          require: false,
          default: "btn btn-warning btn-circle",
        },
        clearfix: {
          type: Array,
          required: false,
          default: () => ([
            'hidden-xs',
            'hidden-xs',
          ]),
        },
        targetPath: {
          type: String,
          require: false,
          default: '/',
        },
      },
      data() {
        return {
          email: this.getInputConfig('email', 'value'),
          firstName: this.getInputConfig('firstName', 'value'),
          lastName: this.getInputConfig('lastName', 'value'),
          password: '',
          checked: false,
          errors: {
              email: '',
              lastName: '',
              firstName: '',
              password: '',
          },
          emailIsValid: false,
          firstNameIsValid: false,
          lastNameIsValid: false,
          passwordIsValid: false,
          createdAccount: this.userIsLogged,
          withEasyBid: false,
        }
    },
    computed: Object.assign({},
    mapGetters('AuthentificationAction', {
      register2Step: 'register2Step',
      data2Step: 'data2Step',
    })),
    methods: Object.assign({
      hasInputConfig(inputRef, configKey) {
        return this.notEmptyObject(this.inputConfig) && (typeof this.inputConfig[inputRef] !== 'undefined' && typeof this.inputConfig[inputRef][configKey] !== 'undefined');
      },
      getInputConfig(inputRef, configKey) {
        let result = '';
        if (this.hasInputConfig(inputRef, configKey)) {
          result = this.inputConfig[inputRef][configKey];
        } else {
          // Default value by configKey
          switch (configKey) {
            case 'formGroupClass':
              result = 'col-xs-12 col-sm-6'
              break;
            default:
              result = '';
          }
        }
        return result;
      },
        checkForm(e) {
            // check email
            let result = this.validate('email', this.email);
            if (result === true) {
              this.errors.email = '';
              this.emailIsValid = true;
            } else {
              this.emailIsValid = false;
              this.errors.email = result;
            }

            // Check email
            if (!this.emailIsValid) {
              step1Error('Invalid email');/* eslint no-undef: 0 */
            }

            if (!this.register2Step) {
              // Check password
              result = this.validate('password', this.password);
              if (result === true) {
                this.errors.password = '';
                this.passwordIsValid = true;
              } else {
                this.passwordIsValid = false;
                this.errors.password = result;
                step1Error('Password error');
              }
            }

            // Check firstName
            result = this.validate('firstName', this.firstName);
            if (result === true) {
              this.errors.firstName = '';
              this.firstNameIsValid = true;
            } else {
              this.firstNameIsValid = false;
              this.errors.firstName = result;
              step1Error('FirstName error');
            }

            // Check lastName
            result = this.validate('firstName', this.lastName);
            if (result === true) {
              this.errors.lastName = '';
              this.lastNameIsValid = true;
            } else {
              this.lastNameIsValid = false;
              this.errors.lastName = result;
              step1Error('Lastname error');
            }

            // Check if all input is valide
            if (this.emailIsValid && this.firstNameIsValid && this.lastNameIsValid && (this.register2Step || (!this.register2Step && this.passwordIsValid))) {
              this.register();
            }

            e.preventDefault();
          },
        register() {
            const post = new FormData();
            const self = this;
            post.append('firstName', this.firstName);
            post.append('lastName', this.lastName);
            post.append('password', this.password);
            post.append('email', this.email);
            post.append('want_newsletter', this.checked);
            post.append('terms', 1);
            post.append('screenWidth', window.innerWidth);
            post.append('screenHeight', screen.height);
            post.append('settings', JSON.stringify(this.settings));
            if (this.register2Step) {
              if (this.data2Step.oauthSource === 'facebook') {
                post.append('facebookId', this.data2Step.id);
              }
              if (this.data2Step.oauthSource === 'google') {
                post.append('googleId', this.data2Step.sub);
              }
            }
            http({
              method: 'post',
              url: '/user/register?rawdata=1',
              data: post,
              config: {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            }).then((response) => {
              /* eslint prefer-destructuring : 0 */
              const data = response.data;
              /* eslint prefer-destructuring : 1 */

              // Send the result to parent
              this.$emit('submitResponse', Object.assign({ email: self.email }, data));

              if (data.hasError) {
                let textErrors = '';
                const errors = data.errors;
                if (typeof errors === 'string') {
                  textErrors = errors;
                } else {
                  Object.keys(errors).map((name) => {
                    self.errors[name] = errors[name];
                    textErrors += name + ' : ' + errors[name] + ' - ';
                    return textErrors;
                  });
                }
                if (textErrors !== '') {
                  step1Error(textErrors);
                }
              } else {
                ga('send', 'event', 'subscription', 'userRegisterSolidaire', 'step1Passed');
                self.createdAccount = true;

                // GTM event userRegisterValid and var userSha1Email
                dataLayer.push({
                  'event': 'userRegisterValide',
                  'userSha1Email': data.leadNumber,
                });

                const useEasyBid = typeof data.success_easybid !== 'undefined' && data.success_easybid;

                // Get the user data
                if (useEasyBid) {
                  self.withEasyBid = true;
                  self.changeConnected();
                }

                if (data.success) {
                  dataLayer.push({
                    'event': 'confirmRegister',
                  });
                  ga('send', 'pageview', {
                    title: "Registration posted",
                    page: "/user/registration-posted",
                    hitCallback() {
                      if (useEasyBid) {
                        setCookie('showConfirmEmail', '1', 1);
                      }
                      if (data.redirect) {
                        window.location = self.targetPath !== '/' ? self.targetPath : data.redirect;
                      } else {
                        self.hideGeneralLoader();
                      }
                    },
                  });
                  // Eulerian register button track
                  if (typeof window.eulerianTrackAction === "function") {
                    window.eulerianTrackAction([
                      'uid', data.uid,
                      'ref', data.uid,
                      'estimate', 1,
                      'email', data.leadNumber,
                      'profile', data.profile,
                      'type', 'creation-compte',
                      'pagegroup', 'register',
                      'optin-nl', (data.nl ? 'OUI' : 'NON'),
                      'optin-mail', (data.nl ? 'OUI' : 'NON'),
                      'type-compte', 'mail',
                      'path', 'register',
                    ]);
                  }
                }
              }
            }).catch((error) => {
              if (this.$root.$options.methods.errsIsDefined()) {
                  leErrs.meta.Code = error.code;
                  leErrs.track(new Error("UserRegisterFormWithoutStep register : " + error.error));
              }
              self.createdAccount = true;
              self.confirmationTitle = "Erreur";
              self.confirmationHtml = error;
              if (typeof step2Error !== 'undefined') {
                step2Error('Erreur : ' + error);
              }
            })
          },
      },
      mapActions('User', ['changeConnected'])),
    }
</script>
