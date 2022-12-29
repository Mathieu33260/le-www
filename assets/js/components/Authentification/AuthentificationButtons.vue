<template>
    <div class="btn--auth__wrapper">
        <template v-if="mobileBtn && !forceButtonVersion">
            <button :class="classCssLoginBtn" @click="openRegisterModal">
                <i class="icon-mon-profil"></i>
            </button>
        </template>
        <template v-else>
            <button v-if="!hideRegisterButton" :class="classCssRegisterBtn" @click="openRegisterModal">{{ registerText }}</button>
            <button v-if="!hideLoginButton" :class="classCssLoginBtn" @click="openLoginModal">{{ loginText }}</button>
        </template>
    </div>
</template>

<script>
  import { mapActions } from "vuex"

  export default {
    name: "AuthentificationButtons",
    props: {
        // Display buttons event on mobile version
      forceButtonVersion: {
        type: Boolean,
        required: false,
        default: false,
      },
      loginButtonTransparent: {
        type: Boolean,
        required: false,
        default: false,
      },
      registerButtonDefault: {
        type: Boolean,
        required: false,
        default: false,
      },
      hideRegisterButton: {
        type: Boolean,
        required: false,
        default: false,
      },
      hideLoginButton: {
        type: Boolean,
        required: false,
        default: false,
      },
      classCssLoginBtnDefault: {
        type: String,
        required: false,
        default: 'btn btn-sm login',
      },
      // Change style of register button with custom css
      classCssRegisterBtnDefault: {
        type: String,
        required: false,
        default: 'btn btn-sm register',
      },
      loginText: {
        type: String,
        required: false,
        default: 'Connexion',
      },
      registerText: {
        type: String,
        required: false,
        default: 'Inscription',
      },
    },
    data() {
      return {
        mobileBtn: this.$root.visibleXs,
      }
    },
    methods: Object.assign({
      handleResize() {
        this.mobileBtn = screen.width < 768;
      },
    },
    mapActions("AuthentificationAction", [
      "openRegisterModal",
      "openLoginModal",
    ])),
    computed: {
      classCssLoginBtn() {
        let str = this.classCssLoginBtnDefault;
        str += this.loginButtonTransparent ? ' btn-transparent' : ' btn-default';
        return str;
      },
      classCssRegisterBtn() {
        let str = this.classCssRegisterBtnDefault;
        str += this.registerButtonDefault ? ' btn-default' : ' btn-warning';
        return str;
      },
    },
    mounted() {
      const blocks = document.querySelectorAll('.authentification > .placeholder-block');
      for (let i = 0; i < blocks.length; i++) {
        blocks[i].style.display = "none";
      }
      window.addEventListener('resize', this.handleResize);
    },
  }
</script>
