<template>
    <div class="row upcoming">
        <a :href="link" class="no-opacity picture">
            <auction-picture :auction="auction" :sources-edit="sourcesEdit"></auction-picture>
            <div class="coming-soon">Bientôt<br>disponible</div>
        </a>
        <div class="moduleTexte nomargin-bottom">
            <a :href="link">
                <div class="texte">
                    <p
                            v-if="auction.product_shortloc != null && auction.concatenate == '1'"
                            v-line-clamp="thumbInfoLine"
                            class="auctionThumbInfo shortloc"
                    >{{ auction.product_shortloc }}</p>
                    <p
                            class="auctionThumbTitle"
                            v-line-clamp="thumbTitleLine"
                    >{{ auction.auction_name }}</p>
                </div>
            </a>
            <auction-future-alert
                    v-cloak
                    :auction-id="auction.auction_id"
                    :auction-uuid="auction.auctionUuid"
                    :product-id="auction.product_id"
                    :user-notification-next-auction="userNotificationNextAuction"
                    :ea-site="eaSite"
                    :ea-location="'vp' + auction.product_id"
            ></auction-future-alert>
        </div>
    </div>
</template>

<script>
    import Vue from "vue";
    import lineClamp from "vue-line-clamp";
    import AuctionPicture from "./AuctionPicture.vue";
    import AuctionFutureAlert from '../Future/Alert.vue';

    Vue.use(lineClamp, {
        importCss: true,
    });

    export default {
        name: "Upcoming",
        components: {
            AuctionPicture,
            AuctionFutureAlert,
        },
        props: {
            auction: {
                type: Object,
                required: true,
            },
            sourcesEdit: {
                required: false,
                type: Array,
                default() {
                    return [];
                },
            },
            activePage: {
                type: Boolean,
                default: true,
                required: false,
            },
            // Eulerian site key (default if omitted is prod value)
            eaSite: {
                type: String,
                require: false,
                default: 'loisirs-encheres-com',
            },
        },
        data() {
            return {
                thumbInfoLine: 1,
                thumbTitleLine: 2,
            };
        },
        computed: {
            link() {
                const {
                    product_id: productId,
                } = this.auction;
                if (!this.activePage) {
                    return '#';
                }
                return this.isApp
                    ? `comloisirsencheres://product/${productId}`
                    : `/product/${productId}`;
            },
            userNotificationNextAuction() {
                return false;
            },
        },
    };
</script>
