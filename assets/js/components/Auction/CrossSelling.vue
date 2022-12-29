<template>
<div
    id="crossSellingBlock"
    class="moduleEnchere"
>
    <mugen-scroll
        :handler="fetchData"
        :should-handle="!scrolled"
    />
    <div class="row">
        <div
            v-if="auctionsLength > 0"
            class="col-xs-10 col-xs-offset-1 nopadding-only-xs col-sm-12 col-sm-offset-0"
        >
            <hr class="bleu">
            <div class="h4">{{ crossSellingText }}</div>
        </div>
        <div v-if="scrolled" class="col-xs-12">
            <auction-list
                class-css="col-xs-12 col-s-6 col-md-4"
                auction-type="crossSelling"
                :nb-auctions-increment-default="3"
                :nb-auctions-default="3"
                :url="'/product/'+productId+'/refreshCrossSelling'"
                list-name="crossSelling"
                request-uri="requestUri"
                :is-app="isApp"
                :tab-index="1"
                :use-no-auction-found-mess="false"
                :use-more-auctions-btn="false"
            />
        </div>
    </div>
</div>
</template>

<script>
    import MugenScroll from 'vue-mugen-scroll'
    import { mapGetters } from 'vuex';
    import AuctionList from "./AuctionList.vue";

    export default {
        name: "CrossSelling",
        components: {
            AuctionList,
            MugenScroll,
        },
        props: {
            requestUri: {
                type: String,
                required: true,
            },
            isApp: {
                type: Boolean,
                required: true,
            },
            productId: {
                type: String,
                required: true,
            },
            // Are auctions of cross selling linked by purchases ?
            isWithPay: {
                type: Boolean,
                default: true,
                required: false,
            },
        },
        data() {
            return {
                scrolled: false,
            }
        },
        computed: Object.assign({
                crossSellingText() {
                    return this.isWithPay
                        ? 'Les membres ayant gagné cette enchère ont également gagné'
                        : 'Ces enchères pourraient aussi vous intéresser';
                },
            },
            mapGetters('AuctionListSettings', {
                reload: 'loadAuctions',
                auctionsLength: 'auctionsLength',
            })),
        methods: {
            fetchData() {
                this.scrolled = true;
                this.$store.dispatch("AuctionListSettings/changeLoadAuctions");
            },
        },
    };
</script>
