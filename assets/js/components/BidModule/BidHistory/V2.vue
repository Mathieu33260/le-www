<template>
    <div v-if="historicalBids.length > 0" id="bid-history" v-cloak>
        <ul class="bids-list list-unstyled collapse in">
            <li v-for="(bid, key) in historicalBids" :key="key" v-bind:class="bidClass(bid.userHash)">
                <span class="prix col-xs-4 col-md-4 col-sm-5 col-md-offset-1 nopadding-right-only-xs">
                    {{ bid.amount/100 }} €
                    <i v-if="bid.isAutobid" class='icon-faq' data-toggle='modal' v-bind:data-target="iconTarget(bid)"></i>
                </span>
                <span class="col-xs-8 col-md-7 col-sm-7 nopadding-left-only">
                    <span class="nom username">{{ bid.firstName | toLowerCase | capitalize }}<template v-if="!bid.isStartPrice"> {{ bid.lastName | uppercase }}.</template>
                        <span v-if="bid.isStartPrice" class="icon-faq" data-container="#bidmodule" data-toggle="popover" data-placement="bottom" data-html="true" :data-content="startPriceText"></span>
                        <span v-if="bid.showZipcode && bid.zipcode">{{ bid.zipcode | trim }}</span>
                        <span v-if="bid.nbAuctionPaid > 0 && bid.nbAuctionPaid < 5" class='popup-info-bidder-status' data-value='<b>Enchérisseur novice</b> : ils débutent mais ne vous fiez pas aux apparences'><a href="/content/programme-fidelite" rel="nofollow" target="_blank"> <img :src="$root.assetCdn+'/assets/gfx/rank1.png'" alt="rank1" /></a></span>
                        <span v-else-if="bid.nbAuctionPaid >= 5 && bid.nbAuctionPaid < 10" class='popup-info-bidder-status' data-value='<b>Enchérisseur confirmé</b> : ils ont plus d’une enchère dans leur sac'><a href="/content/programme-fidelite" rel="nofollow" target="_blank"><img :src="$root.assetCdn+'/assets/gfx/rank2.png'" alt="rank2" /></a></span>
                        <span v-else-if="bid.nbAuctionPaid >= 10 && bid.nbAuctionPaid < 20" class='popup-info-bidder-status' data-value='<b>Enchérisseur aguerri</b> : enchérir est devenu pour eux une seconde nature'><a href="/content/programme-fidelite" rel="nofollow" target="_blank"><img :src="$root.assetCdn+'/assets/gfx/rank3.png'" alt="rank3" /></a></span>
                        <span v-else-if="bid.nbAuctionPaid >= 20 && bid.nbAuctionPaid < 50" class='popup-info-bidder-status' data-value='<b>Enchérisseur expert</b> : ils enchérissent plus vite que leur ombre'><a href="/content/programme-fidelite" rel="nofollow" target="_blank"><img :src="$root.assetCdn+'/assets/gfx/rank4.png'" alt="rank4" /></a></span>
                        <span v-else-if="bid.nbAuctionPaid > 50" class='popup-info-bidder-status' data-value='<b>Maître Enchérisseur</b> : aucune enchère ne leur résiste'><a href="/content/programme-fidelite" rel="nofollow" target="_blank"><img :src="$root.assetCdn+'/assets/gfx/rank5.png'" alt="rank5" /></a></span>
                    </span>
                    <span class="date" v-if="bid.date"><small>le {{ bid.date|moment("DD/MM/YYYY à HH:mm:ss") }}</small></span>
                </span>
            </li>
        </ul>
        <h3 v-pre data-toggle="collapse" data-parent="#bid-history" aria-expanded="true" data-target=".bids-list" class="background-blanc"><span>Historique des mises <span class="icon-flash-up"></span></span></h3>
    </div>
</template>

<script>
    import moment from 'moment';
    import { mapGetters } from 'vuex';

    moment.locale('fr');

    export default {
        name: 'BidHistory',
        props: {
            // HTML and text displayed if bid.startPrice is true
            startPriceText: {
                type: String,
                required: false,
            },
        },
        computed: {
            ...mapGetters('BidsDatas', [
                'bids',
            ]),
            ...mapGetters('UserDatas', [
                'userInfos',
            ]),
            historicalBids() {
                return this.bids.filter((bid, index) => index > 0 && this.notEmptyObject(bid));
            },
        },
        methods: {
            /**
             * @vuese
             * Add class to <li> element
             * @arg String
             */
            bidClass(bidHash) {
                return this.notEmptyObject(this.userInfos) && this.userInfos.userHash === bidHash ? 'me row' : 'row';
            },
            /**
             * @vues
             * add click icon if it's an autoBid
             * @arg Object
             */
            iconTarget(bid) {
                if (bid.isAutobid) {
                    return '#bidisauto';
                }
                return '';
            },
        },
    }
</script>
