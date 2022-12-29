import Vue from 'vue';
import Vuex from 'vuex';
import UserDatas from "./modules/User/userFirebase";
import BidsDatas from "./modules/Bids/bidFirebase";
import AuctionListSettings from "./modules/Auction/AuctionListSettings";
import Auction from "./modules/Auction/AuctionSettings";
import BidModule from "./BidModule";
import BidAndPurchase from "./BidAndPurchase";
import Modal from './modules/Modal';
import User from "./modules/User/userData";
import AuthentificationAction from "./modules/Authentification/AuthentificationAction";
import GeneralAction from "./modules/GeneralAction";
import Availabilities from "../modules/chooseDate/_store";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        UserDatas,
        BidsDatas,
        AuctionListSettings,
        Auction,
        User,
        AuthentificationAction,
        GeneralAction,
        Availabilities,
        BidModule,
        BidAndPurchase,
        Modal,
    },
});
