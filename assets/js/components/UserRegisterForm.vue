<template>
    <div
        v-if="createdAccount"
        class="confirmation user-register-form__wrapper user-register-form__wrapper--confirmation"
    >
        <p v-text="confirmationTitle" class="title"></p>
        <div v-html="confirmationHtml"></div>
    </div>
    <form
        v-else
        class="form-horizontal user-register-form__wrapper user-register-form__wrapper--form"
        id="formulaire"
        @submit="checkForm"
        method="post">
    <fieldset>
        <legend v-if="legend !== ''" v-text="legend"></legend>
            <UserRegisterSimpleinput elem="email"
                            type="email"
                            label="Email"
                            placeholder="exemple@email.com"
                            ref="email"
                            :isValid="emailIsValid"
                            :errorForm="errors.email"
                            v-on:blur="validateEmail()"
                            v-model="email">
            </UserRegisterSimpleinput>
            <transition name="slide-fade">
                <div v-if="step !== 1 || nostep === 1">
                    <UserRegisterSimpleinput elem="firstName"
                                    type="text"
                                    label="Prénom"
                                    ref="firstName"
                                    placeholder="Prénom"
                                    :isValid="firstNameIsValid"
                                    :errorForm="errors.firstName"
                                    v-model="firstName">
                    </UserRegisterSimpleinput>
                    <UserRegisterSimpleinput type="text"
                                    elem="lastName"
                                    label="Nom"
                                    ref="lastName"
                                    placeholder="Nom"
                                    :errorForm="errors.lastName"
                                    :isValid="lastNameIsValid"
                                    v-model="lastName">
                    </UserRegisterSimpleinput>
                </div>
            </transition>
            <transition name="slide-fade">
                <UserRegisterSimpleinput v-if="step !== 1 || nostep === 1"
                                type="password"
                                elem="password"
                                label="Mot de passe"
                                ref="password"
                                :isValid="passwordIsValid"
                                :errorForm="errors.password"
                                placeholder="Au moins 6 caractères"
                                v-model="password">
                </UserRegisterSimpleinput>
            </transition>
            <transition name="slide-fade">
                <div v-if="step !== 1 || nostep === 1" class="newsletterBlock">
                    <p class="Form__paragraphe">
                        <label for="want_newsletter">
                            <input type="checkbox"
                                    id="want_newsletter"
                                    name="want_newsletter"
                                    v-model="checked"
                                    value="1"
                            >{{ textNewsletter }}</label>
                    </p>
                    <template v-if="checkboxes">
                        <p class="Form__paragraphe" v-for="checkbox in checkboxes" :key="checkbox.name">
                            <label :for="'checkbox_' + checkbox.name">
                                <input type="checkbox"
                                       :id="'checkbox_' + checkbox.name"
                                       :name="checkbox.name"
                                       v-model="checkedBoxes[checkbox.name]"
                                       :value="checkbox.value"
                                >{{ checkbox.label }}</label>
                        </p>
                    </template>
                </div>
            </transition>
            <div class="Form__section row">
                <p class="Form__paragraphe col-md-4">
                    <button
                        :class="buttonCss"
                        type="submit"
                    >
                        <span v-if="step === 1 && nostep !== 1">Continuer</span>
                        <span v-else>S'inscrire</span>
                    </button>
                </p>
                <transition name="slide-fade">
                    <p v-if="step !== 1 || nostep === 1" class="cgv col-md-8">
                        En cliquant sur « S'inscrire », vous acceptez
                        <a href="/content/cgu" target="_blank" rel="nofollow">
                            les conditions générales et particulières de prestation de services
                        </a> et <a href="/content/privacy-policy" target="_blank" rel="nofollow">la politique de confidentialité de Loisirs Enchères.</a>
                    </p>
                </transition>
            </div>
        </fieldset>
    </form>
</template>

<script>
    import http from '../services/http';
    import UserRegisterSimpleinput from './UserRegisterSimpleinput.vue';

    /**
     * @vuese
     * Display a form to allow the user to register with minimum data
     * May redirect if the API returned a route after user registration
     */
    export default {
      name: 'UserRegisterForm',
      components: {
        UserRegisterSimpleinput,
      },
      props: {
        /**
         * @vuese
         * Define text of legend
         */
        legend: {
          type: String,
          default: "Créez votre compte et misez gratuitement",
          required: false,
        },
        /**
         * @vuese
         * Define label for input want newsletter
         */
        textNewsletter: {
          type: String,
          default: "Je m'inscris à la newsletter et je reçois un cadeau !",
          required: false,
        },
        /**
         * @vuese
         * Define if we want the steps  (0) form or display the whole form (1)
         */
        nostep: {
          type: Number,
          default: 0,
        },
        /**
         * @vuese
         * Add more check box
         * ['name', 'value', 'label']
         */
        checkboxes: {
          type: Array,
          required: false,
          default() {
            return [];
          },
        },
        /**
         * @vuese
         * Edit the submit css class
         */
        buttonCss: {
          type: String,
          required: false,
          default: 'Form__button btn btn-warning',
        },
        /**
         * @vuese
         * Define user Settings
         */
        settings: {
          type: Object,
          required: false,
          default() {
            return {};
          },
        },
      },
        data() {
          return {
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            checkedBoxes: {},
            checked: false,
            step: 1,
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
            createdAccount: false,
            confirmationTitle: '',
            confirmationHtml: '',
          }
        },
        methods: {
            checkForm (e) {
                // check email
                let result = this.validate('email', this.email);
                if (result === true) {
                    this.errors.email = '';
                    this.emailIsValid = true;
                } else {
                    this.emailIsValid = false;
                    this.errors.email = result;
                }

                // Check step
                if (this.step === 1 && this.nostep !== 1) {
                    if (this.emailIsValid) {
                        this.step = 2;
                        step1Passed();
                    } else {
                      step1Error('Invalid email');
                    }
                } else {
                   if (this.nostep === 1) {
                     if (!this.emailIsValid) {
                       step2Error('Invalid email');
                     }
                   }

                    // Check password
                    result = this.validate('password', this.password);
                    if (result === true) {
                        this.errors.password = '';
                        this.passwordIsValid = true;
                    } else {
                        this.passwordIsValid = false;
                        this.errors.password = result;
                        step2Error('Password error');
                    }

                    // Check firstName
                    result = this.validate('firstName', this.firstName);
                    if (result === true) {
                        this.errors.firstName = '';
                        this.firstNameIsValid = true;
                    } else {
                        this.firstNameIsValid = false;
                        this.errors.firstName = result;
                        step2Error('FirstName error');
                    }

                    // Check lastName
                    result = this.validate('firstName', this.lastName);
                    if (result === true) {
                        this.errors.lastName = '';
                        this.lastNameIsValid = true;
                    } else {
                        this.lastNameIsValid = false;
                        this.errors.lastName = result;
                        step2Error('Lastname error');
                    }
                }

                // Check if all input is valide
                if (this.emailIsValid && this.firstNameIsValid && this.lastNameIsValid && this.passwordIsValid) {
                    this.register();
                }

                e.preventDefault();
            },
            register() {
                const post = new FormData();
                post.append('firstName', this.firstName);
                post.append('lastName', this.lastName);
                post.append('password', this.password);
                post.append('email', this.email);
                post.append('want_newsletter', this.checked);
                post.append('terms', 1);
                post.append('screenWidth', window.innerWidth);
                post.append('screenHeight', screen.height);
                if (this.checkboxes.length) {
                  Object.keys(this.checkedBoxes).forEach((name) => {
                    post.append(name, this.checkedBoxes[name]);
                  });
                }
                if (this.notEmptyObject(this.settings)) {
                  post.append('settings', JSON.stringify(this.settings));
                }
                http({
                    method: 'post',
                    url: '/user/register?rawdata=1',
                    data: post,
                    config: { headers: { 'Content-Type': 'multipart/form-data' } },
                }).then((response) => {
                  const data = response.data;
                  if (data.hasError) {
                    let textErrorsStep1 = '';
                    let textErrorsStep2 = '';
                    const errors = data.errors;
                    Object.keys(errors).forEach((name) => {
                      this.errors[name] = errors[name];
                      if (name === 'email') {
                        textErrorsStep1 += name + ' : ' + errors[name] + ' - ';
                      } else {
                        textErrorsStep2 += name + ' : ' + errors[name] + ' - ';
                      }
                    });
                    if (textErrorsStep1 !== '') {
                      step1Error(textErrorsStep1);
                    }
                    if (textErrorsStep2 !== '') {
                      step2Error(textErrorsStep2);
                    }
                  } else {
                    step2Passed(() => {
                      if (data.success_easybid) {
                        setCookie('showConfirmEmail', '1', 1);
                      }
                      if (data.redirect) {
                        window.location = data.redirect;
                      }
                    });
                    this.createdAccount = true;
                    this.confirmationHtml = data.result;
                    this.confirmationTitle = data.title;

                    // GTM event userRegisterValide and var userSha1Email
                    dataLayer.push({
                      'event': 'userRegisterValide',
                      'userSha1Email': data.leadNumber,
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
                }).catch((error) => {
                  if (this.$root.$options.methods.errsIsDefined()) {
                      leErrs.meta.Code = error.code;
                      leErrs.track(new Error("UserRegisterForm register : " + error.message));
                  }
                  this.createdAccount = true;
                  this.confirmationTitle = "Erreur";
                  this.confirmationHtml = error;
                  if (typeof step2Error !== 'undefined') {
                    step2Error('Erreur : ' + error);
                  }
                })
            },
        },
      mounted() {
        if (this.checkboxes.length) {
          this.checkboxes.forEach((checkbox) => {
            this.checkedBoxes[checkbox.name] = false;
          });
        }
      },
    }
</script>
