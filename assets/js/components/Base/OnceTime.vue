<template>
    <div id="modals">
        <resend-email-confirmation-modal :open-modal="showConfirmEmail" :email="resendEmailConfirmation"></resend-email-confirmation-modal>
        <template v-if="!userLogged">
            <login-modal
                :target-path-default="targetPath"
                :auction-id="auctionId"
                :only-view="onlyView"
                :checkboxes-props="checkboxes"
                :header-hide-register-button="headerHideRegisterButton"
            ></login-modal>
            <register-modal
                :open-modal="isOpenRegisterModal"
                :target-path-default="targetPath"
            ></register-modal>
            <lost-password-modal
                :open-modal="isOpenLostPasswordModal"
            ></lost-password-modal>
            <missing-email-modal></missing-email-modal>
            <register-social-modal></register-social-modal>
        </template>
        <pub-modal></pub-modal>
        <keep-alive>
          <modal :open-modal="getModalDisplay"></modal>
        </keep-alive>
    </div>
</template>

<script>
  import { mapGetters, mapActions } from "vuex"

  /* UserAnonyme Chunk */
  const LostPasswordModal = () => import(/* webpackChunkName: "UserAnonyme" */ '../Authentification/LostPasswordModal.vue');
  const LoginModal = () => import(/* webpackChunkName: "UserAnonyme" */ '../Authentification/LoginModal.vue');
  const RegisterModal = () => import(/* webpackChunkName: "UserAnonyme" */ '../Authentification/RegisterModal.vue');
  const MissingEmailModal = () => import(/* webpackChunkName: "UserAnonyme" */ '../Authentification/MissingEmailModal.vue');
  const PubModal = () => import(/* webpackChunkName: "general" */ '../General/PubModal.vue');
  const RegisterSocialModal = () => import(/* webpackChunkName: "UserAnonyme" */ '../Authentification/RegisterSocialModal.vue');
  const Modal = () => import(/* webpackChunkName: "general" */ '../Modal/Index.vue');

  /* UserConnected Chunk */
  const ResendEmailConfirmationModal = () => import(/* webpackChunkName: "general" */ '../User/ResendEmailConfirmationModal.vue');

  /* To include only one component in the page. Example: a modal */
  export default {
    name: "OnceTime",
    components: {
      LoginModal,
      RegisterModal,
      LostPasswordModal,
      MissingEmailModal,
      PubModal,
      RegisterSocialModal,
      ResendEmailConfirmationModal,
      Modal,
    },
    props: {
      userLogged: {
        type: Boolean,
        required: true,
      },
      targetPathDefault: {
        type: String,
        required: false,
      },
      auctionId: {
        type: String,
        required: false,
      },
      onlyView: {
        type: Boolean,
        required: false,
        default: false,
      },
      resendEmailConfirmation: {
        type: String,
        required: false,
        default: '',
      },
        checkboxes: {
            type: Array,
            required: false,
            default() {
                return [];
            },
        },
        headerHideRegisterButton: {
            type: Boolean,
            require: false,
            default: false,
        },
    },
    data() {
      return {
        targetPath: this.targetPathDefault,
        showConfirmEmail: this.resendEmailConfirmation !== '',
      }
    },
    computed: Object.assign({
      ...mapGetters('Modal', [
        'getModalDisplay',
      ]),
    },
      mapGetters('AuthentificationAction', {
        isOpenRegisterModal: 'openRegisterModal',
        isOpenLostPasswordModal: 'openLostPasswordModal',
        facebookToken: 'facebookToken',
      })),
    methods: Object.assign({
        userNotation() {
          const star = decodeURIComponent(getParameterByName('star'));
          const availableStars = ["1", "2", "3", "4", "5"];
          if (star !== '' && availableStars.indexOf(star) !== -1) {
            if (!this.userLogged) {
              // Log user
              this.targetPath = this.targetPath + '?star=' + star; // Allow to redirect with url param
              this.openLoginModal();
            }
            // User got a link to rate a product, show comment tab and fill the appropriate number of star
            $('.panel-collapse').collapse('hide');
            $('#collapseFour').collapse('show');
            $('.nav-tabs a[href="#feedback"]').tab('show');
            $('.starsComment').removeClass('selected');
            for (let i = 1; i <= star; i++) {
              $('.starsComment[data-index=' + i + ']').addClass('selected');
              $('.starsComment[data-index=' + i + ']').prop('src', this.$root.assetCdn + '/assets/gfx/stars_color.png');
            }
          }
        },
        getAnchor() {
          return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
        },
        togglePubModal() {
          if (this.getAnchor() === 'pub') {
            this.openPubModal();
          }
        },
    },
    mapActions("AuthentificationAction", [
      "openRegisterModal",
      "openLoginModal",
    ]),
    mapActions("GeneralAction", [
        "openPubModal",
    ])),
    mounted() {
        this.userNotation();
        this.togglePubModal();
    },
  }
</script>
