<template>
    <div v-show="showPurchaseModule" id="purchaseModule">
        <div v-if="schema.product" class="text-center">
            <span class="background-gris productValue" itemprop="offers" itemscope itemtype="http://schema.org/Offer">
                Valeur : <span itemprop="price" :content="publicPrice">{{ publicPrice | formatAmount }}</span> <span itemprop="priceCurrency" content="EUR">€</span>
            </span>
        </div>
        <div class="text-center paddingtop2">
            <img :src="$root.assetCdn + '/assets/gfx/pictos/time-is-money.png'" alt="#" />
        </div>
        <div class="text-center paddingtop1">
            <b>Le temps c'est de l'argent.</b>
        </div>
        <div class="text-center paddingtop1 paddingleft1 paddingright1">
            Si vous n'avez pas le temps d'attendre la fin de l'enchère, achetez-la immédiatement au prix de
        </div>
        <div class="text-center">
            <b class="buyNowPrice">{{ priceBuyNow }}€</b>
            <span class="icon-info" @click="openModal"></span>
            <br>sans frais supplémentaires
        </div>
        <div class="text-center text-success" v-if="percentDiscount !== 0">
            économisez {{ diffDiscount }}€ ({{ percentDiscount }}%)
        </div>
        <div class="paddingleft1 checkbox engagement">
            <label for="engagementBuyNow">
                <input type="checkbox" id="engagementBuyNow" name="engagement" class="buyNowInput" v-model="confirmBuyNow"> Je m'engage à régler mon achat
            </label>
            <span :class="errorConfirmCssClass"><small>Vous devez cocher la case <em>"Je m'engage à régler mon achat"</em></small></span>
        </div>
        <div class="paddingright1 paddingleft1">
            <button @click="createCheckout" class="btn btn-green btn-block center-block marginbottom1">
                J'achète maintenant !
            </button>
        </div>
        <modal
            id="buyNowInfoModal"
            name="buyNowInfo"
            :adaptive="true"
            width="90%"
            height="auto"
            :max-width="480"
            @closed="closeModal"
            @opened="openModal"
        >
            <div class="modal-content">
                <div class="modal-body">
                    <div class="text-right close hidden-xs" @click="closeModal">&times;</div>
                    <div class="close visible-xs right marginbottom1" @click="closeModal">
                        <i class="icon-close"></i> <small>Fermer</small>
                    </div>
                    <div class="clearfix"></div>
                    <template>
                        <p>Cette fonctionnalité vous permet d‘acheter une expérience sur notre site, sans avoir à passer par la case des enchères.</p>
                        <p> C'est simple : vous payez, vous réservez, vous profitez !</p>
                    </template>
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { mapGetters, mapActions } from "vuex"
    import VModal from 'vue-js-modal';
    import { postCheckout } from "../../api/BidModule/buyNow";

    Vue.use(VModal);

    export default {
        name: "Purchase",
        props: {
            publicPrice: {
                type: Number,
                required: true,
            },
            buyNowPrice: {
                type: Number,
                required: false,
            },
            cost: {
                type: Number,
                required: true,
            },
            auctionId: {
                type: Number,
                required: true,
            },
            productId: {
                type: Number,
                required: true,
            },
            onlyView: {
                type: Boolean,
                required: true,
            },
        },
        data() {
            return {
                confirmBuyNow: false,
                errorConfirmBuyNow: 'hide',
            }
        },
        computed: Object.assign({
            errorConfirmCssClass() {
                return this.errorConfirmBuyNow + ' help-block text-danger';
            },
            priceBuyNow() {
                return Math.abs(Math.round((this.buyNowPrice) / 100));
            },
            diffDiscount() {
                return Math.abs(Math.round(this.publicPrice - this.priceBuyNow));
            },
            percentDiscount() {
                if (this.publicPrice === 0) {
                    return 0;
                }
                return Math.abs(Math.round((this.diffDiscount * 100) / this.publicPrice));
            },
            showPurchaseModule() {
                return this.paneActive === 'buyNow';
            },
        },
        mapGetters('UserDatas', {
            userInfos: 'userInfos',
        }),
        mapGetters('BidAndPurchase', [
            'paneActive',
        ]),
        mapGetters('BidsDatas', [
            'bids',
        ]),
        mapGetters("BidModule", [
            'schema',
        ])),
        methods: Object.assign({
            openModal() {
                this.$modal.show('buyNowInfo');
            },
            closeModal() {
                this.$modal.hide('buyNowInfo');
            },
            openLoginOrRegisterModal(bidType) {
                if (this.onlyView) {
                    this.openLoginModal();
                } else {
                    this.openRegisterModal(bidType);
                }
            },
            createCheckout() {
                if (!this.notEmptyObject(this.userInfos)) {
                    const inThreeMinutes = new Date(new Date().getTime() + 3 * 60 * 1000); // 3 minutes
                    Cookies.set('want-purchase-' + this.auctionId, 1, { expires: inThreeMinutes });
                    this.openLoginOrRegisterModal();
                } else if (this.confirmBuyNow) {
                    const params = new FormData();
                    params.append('product', this.productId);
                    postCheckout(params).then((response) => {
                        if (response.data === 1) {
                            window.location.href = "/user/auctions";
                        } else {
                            if (response.data.error === 'account.confirm.needed') {
                                confirmEmail(); // A global function
                            } else if (response.data.error === 'payment.pending') {
                                $('.error-bid .modal-body > div').hide();
                                $('.error-bid').modal('hide');
                                $('.error-bid .modal-title').html('Paiement en attente');
                                $('.error-bid .unpaid').show();
                                $('.error-bid').modal('show');
                            } else {
                                $('.error-bid .modal-body > div').hide();
                                $('.error-bid').modal('hide');
                                $('.error-bid .modal-title').html("Une erreur s'est produite");
                                $('.declined').text(response.data.error);
                                $('.declined').show();
                                $('.error-bid').modal('show');
                            }
                        }
                    });

                    this.auctionTracking({
                        "auctionId": this.auctionId,
                        "key": "clickedBuyNowToPayBtn",
                        "value": "1",
                    });
                } else {
                    this.errorConfirmBuyNow = 'show';
                }
            },
        },
        mapActions("AuthentificationAction", [
            "openRegisterModal",
            "openLoginModal",
        ]),
        mapActions("BidModule", {
            auctionTracking: 'auctionTracking',
        })),
        filters: {
            formatAmount(str) {
                return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(parseInt(str, 10))
            },
        },
        watch: {
            paneActive(val) {
                if (val === 'buyNow') {
                    this.auctionTracking({
                        "auctionId": this.auctionId,
                        "key": "clickedBuyNowBtn",
                        "value": "1",
                    });
                }
            },
        },
    }
</script>
