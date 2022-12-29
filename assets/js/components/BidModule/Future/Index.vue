<template>
    <div class="paddingtop1">
        <p class="text-center">
            L'enchère commence le : <br>
            <span v-cloak class="time-status auction_date text-center planned_alert_date planned_alert_row">{{ auction.start|moment('dddd')|capitalize }} {{ auction.start|moment('Do') }} {{ auction.start|moment('MMMM')|capitalize }}<br> à {{ auction.start | moment('HH:mm') }}</span>
        </p>
        <div class="text-center marginbottom1" v-if="nbUsersNotified">
            {{ nbUsersNotified }} personnes sont déjà inscrites à l'alerte
        </div>
        <auction-future-alert
                v-cloak
                :auction-id="auction.id"
                :auction-uuid="auction.uuid"
                :product-id="auction.product"
                :ea-site="eaSite"
                :ea-location="'fp' + auction.product"
                @activatedAlarm="activatedAlarm"
        ></auction-future-alert>
    </div>
</template>

<script>
    import AuctionFutureAlert from '../../Auction/Future/Alert.vue';

    export default {
        name: "BidModuleFuture",
        components: {
            AuctionFutureAlert,
        },
        props: {
            /* Auction object */
            auction: {
                type: Object,
                required: true,
            },
            /* boolean to know if user has subscribed to next auction or not */
            userNotificationNextAuction: {
                type: Boolean,
                default: false,
            },
            /* Number of users subscribed to next auction */
            nbUsersNotificationNextAuction: {
                type: Number,
                default: 0,
            },
            /* Eulerian site key (default if omitted is prod value) */
            eaSite: {
                type: String,
                require: false,
                default: 'loisirs-encheres-com',
            },
        },
        data() {
            return {
                nbUsersNotified: this.nbUsersNotificationNextAuction,
            }
        },
        methods: {
            eaPrinting() {
                if (typeof EA_dyntpview !== 'undefined') {
                    EA_dyntpview(this.eaSite, 'enchères à venir', 'fp' + this.auction.product, this.eaSite, 'generic');
                }
            },
            activatedAlarm(val) {
                if (val) {
                    // we subtract the current user from the displayed number
                    this.nbUsersNotified++;
                }
            },
        },
        mounted() {
            this.eaPrinting();
        },
    }
</script>
