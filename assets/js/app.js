/* eslint-disable global-require */
/* eslint-disable import/first */

/* Import polyfills only if the bundle is in legacy mode */
if (__BUILD__ === "legacy") {
  require("core-js/stable");
}

/* CoreJS doesn't handle browser APIs so we have to polyfill them separately */
import 'intersection-observer';

import Vue from "vue";


import store from "./store";
import Config from "./config";
import "./filters";
import { setUseWebp } from "./function/ass.imageService";

/* *** Chunked imports *** */

/* General Chunk */
import(/* webpackChunkName: "general" */ './function/Footer.js');
import(/* webpackChunkName: "general" */ './function/Slidebars.js');
const LazyFrame = () => import(/* webpackChunkName: "general" */ './components/Base/LazyFrame.vue');
const LazyImage = () => import(/* webpackChunkName: "general" */ './components/Base/LazyImage.vue');
const LazyPicture = () => import(/* webpackChunkName: "general" */ "./components/Base/LazyPicture.vue");
const PressList = () => import(/* webpackChunkName: "general" */ './components/Footer/PressList.vue');
const OnceTime = () => import(/* webpackChunkName: "general" */ './components/Base/OnceTime.vue');
const ModalTrigger = () => import(/* webpackChunkName: "general" */ './components/Modal/Trigger.vue');

/* Homepage Chunk */
const HomepageSlider = () => import(/* webpackChunkName: "Homepage" */ "./components/Homepage/HomepageSlider.vue");
const BlockPromotion = () => import(/* webpackChunkName: "Homepage" */ "./components/Module/BlockPromotion.vue");

/* Auction Chunk */
const AuctionList = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/AuctionList.vue");
const AuctionListItem = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/AuctionListItem/index.vue");
const AuctionFilters = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/Filters.vue");
const AuctionSort = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/Sort.vue");
const CrossSelling = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/CrossSelling.vue");
const AuctionListHide = () => import(/* webpackChunkName: "AuctionList" */ "./components/Auction/AuctionListHide.vue");

/* BidModule Chunk */
const BidModule = () => import(/* webpackChunkName: "BidModule" */ "./components/BidModule/Index.vue");

/* BidAndPurchase Chunk */
const BidAndPurchase = () => import(/* webpackChunkName: "BidAndPurchase" */ "./components/BidAndPurchase/Index.vue");
const Purchase = () => import(/* webpackChunkName: "BidAndPurchase" */ "./components/Purchase/Index.vue");

/* ProductChooseDate Chunk */
//const ProductChooseDateModal = () => import(/* webpackChunkName: "ProductChooseDate" */ "./modules/chooseDate/ProductChooseDateModal.vue");
//const ProductChooseDate = () => import(/* webpackChunkName: "ProductChooseDate" */ "./modules/chooseDate/ProductChooseDate.vue");

/* UserConnected Chunk */
const UserNav = () => import(/* webpackChunkName: "UserConnected" */ "./components/User/UserNav.vue");
const UserInformationsPaymentAlert = () => import(/* webpackChunkName: "UserConnected" */ "./components/User/UserInformationsPaymentAlert.vue");
const UserWishList = () => import(/* webpackChunkName: "UserConnected" */ "./components/User/UserWishList.vue");
const UserProductsFavorite = () => import(/* webpackChunkName: "UserConnected" */ "./components/User/UserProductsFavorite.vue");
const AuctionsPending = () => import(/* webpackChunkName: "UserConnected" */ "./components/User/AuctionsPending.vue");
const UserRegisterStatus = () => import(/* webpackChunkName: "UserConnected" */ './components/User/UserRegisterStatus.vue');
const UserPurchases = () => import(/* webpackChunkName: "UserConnected" */ './components/User/UserPurchases.vue');

/* UserAnonyme Chunk */
const UserRegisterForm = () => import(/* webpackChunkName: "UserAnonyme" */ './components/UserRegisterForm.vue');
const AuthentificationButtons = () => import(/* webpackChunkName: "UserAnonyme" */ './components/Authentification/AuthentificationButtons.vue');
const AuthenticationModalClickEvent = () => import(/* webpackChunkName: "UserAnonyme" */ './components/Authentification/AuthenticationModalClickEvent.vue');
const FacebookButton = () => import(/* webpackChunkName: "UserAnonyme" */ './components/Authentification/FacebookButton.vue');
const GoogleButton = () => import(/* webpackChunkName: "UserAnonyme" */ './components/Authentification/GoogleButton.vue');

/* Reserver Form Chunk */
const ReserverFormEn = () => import(/* webpackChunkName: "ReserverFormEN" */ './components/Reservation/ReserverFormEN.vue');

/* Landing Page Solidaire Chunk */
const LandingpageSolidaire = () => import(/* webpackChunkName: "LandingpageSolidaire" */ './components/Landingpage/LandingpageSolidaire.vue');

Vue.prototype.$config = Config;

Vue.mixin({
  methods: {
    notEmptyObject(someObject) {
      return Object.keys(someObject).length;
    },
    errsIsDefined() {
      return typeof _errs !== 'undefined';
    },
    validate(type, value, options) {
      let result = '';
      switch (type) {
        case 'email':
          result = this.validateEmail(value, options);
          break;
        case 'phone':
          result = this.validatePhone(value);
          break;
        case 'password':
          result = this.validatePassword(value);
          break;
        case 'firstName':
          result = this.validateWord('firstName', value);
          break;
        case 'lastName':
          result = this.validateWord('lastName', value);
          break;
        default:
          break;
      }

      return result;
    },
    validatePassword(password) {
      if (password.length < 6) {
        return 'Veuillez entrer au moins 6 caractères';
      }
      return true;
    },
    validateWord(inputName, word) {
      const pattern = /\d+/;
      if (pattern.test(word)) {
        return 'Saisie incorrecte.';
      }
      return true;
    },
    validateEmail(email, options) {
      const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; /* eslint no-useless-escape: 0 */
      if (!pattern.test(email)) {
        return 'Veuillez entrer une adresse email valide';
      }
      const checkbbox = typeof options === 'undefined' || (typeof options !== 'undefined' && !options.notCheckBbox);
      if (checkbbox && email.indexOf('@bbox') !== -1) {
        return "Emails bbox non acceptées. Veuillez utiliser un autre email s'il vous plaît";
      }
      const checkspecialChars = typeof options === 'undefined' || (typeof options !== 'undefined' && !options.notCheckSpecialChars);
      const patternSpecialChars = /[*\/\\?!$#%^&(){}[\]~,]+/;
      if (checkspecialChars && patternSpecialChars.test(email)) {
        return "Nous n'acceptons pas les adresses emails contenant des caractères spéciaux.";
      }
      return true;
    },
    validatePhone(phone) {
      const pattern = /^(06|07)[0-9]{8}$/; /* eslint no-useless-escape: 0 */
      if (!pattern.test(phone)) {
        return 'Veuillez entrer un numéro de téléphone valide';
      }
      return true;
    },
    hideGeneralLoader() {
      const loader = document.getElementById("general-loader");
      if (loader) {
        loader.classList.add("hide");
      }
    },
    showGeneralLoader() {
      const loader = document.getElementById("general-loader");
      if (loader) {
        loader.classList.remove("hide");
      }
    },
  },
});

export function createApp() {
  return new Vue({
    el: '#hero-container',
    store,
    components: {
      UserRegisterForm,
      UserNav,
      UserInformationsPaymentAlert,
      AuctionList,
      ReserverFormEn,
      BidModule,
      BidAndPurchase,
      Purchase,
      AuctionFilters,
      AuctionSort,
      UserWishList,
      UserProductsFavorite,
      CrossSelling,
      AuctionListHide,
      AuctionsPending,
      AuctionListItem,
      LandingpageSolidaire,
      UserRegisterStatus,
      HomepageSlider,
      UserPurchases,
      AuthentificationButtons,
      AuthenticationModalClickEvent,
      OnceTime,
      ModalTrigger,
      LazyFrame,
      FacebookButton,
      GoogleButton,
      BlockPromotion,
      PressList,
      LazyImage,
      LazyPicture,
    },
    data: {
      assetCdn: '//' + Config.get('cdn-www.host'),
      visibleXs: screen.width < 768,
      // To call webp in a template use $root.useWebp or in js code use this.$root.useWebp
      useWebp: window.document.querySelector('body').classList.contains('webp'),
      // To call isIe in a template use $root.isIe or in js code use this.$root.isIe
      isIe: window.document.querySelector('body').classList.contains('isie'),
    },
    beforeCreate() {
      this.$store.dispatch('UserDatas/initialize');
    },
    mounted() {
      window.onresize = () => {
        // data visibleXs
        const isXs = screen.width < 768;
        // In order not to recompile the template, let's add conditions
        if (isXs && !this.visibleXs) {
          this.visibleXs = true;
        }
        if (!isXs && this.visibleXs) {
          this.visibleXs = false;
        }
        // data visibleXs END
      };
    },
    created() {
      setUseWebp(this.useWebp);
    },
  });
}
