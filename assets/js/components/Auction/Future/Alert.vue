<template>
    <div class="row">
        <div class="col-xs-10 col-xs-offset-1 nopadding-only btns planned_alert_row">
            <button :class="btnClass" @click="updateAlarmWanted">
                <template v-if="activatedAlarm">
                    <span><b>Alerte activée</b></span>
                    <i class="icon-check-sytle-lineal hidden-sm"></i>
                </template>
                <template v-else>
                    <span><b>Je veux être alerté</b></span>
                    <i class="icon-notification-sytle-lineal hidden-sm"></i>
                </template>
            </button>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapGetters } from "vuex"
    import { putAlarmWanted } from "../../../api/BidModule/future";

    export default {
        name: "AuctionFutureAlert",
        props: {
            /* Auction id */
            auctionId: {
                type: [Number, String],
                required: true,
            },
            /* Auction UUID */
            auctionUuid: {
                type: String,
                required: true,
            },
            /* Product id */
            productId: {
                type: [Number, String],
                required: true,
            },
            /* boolean to know if user has subscribed to next auction or not */
            userNotificationNextAuction: {
                type: Boolean,
                default: false,
            },
            /* Eulerian site key (default if omitted is prod value) */
            eaSite: {
                type: String,
                required: false,
                default: 'loisirs-encheres-com',
            },
            // Eulerian location name
            eaLocation: {
                type: String,
                required: true,
            },
        },
        data() {
            return {
                isUserNotifiedNextAuction: this.userNotificationNextAuction,
            }
        },
        computed: Object.assign({
                btnClass() {
                    let str = 'btn btn-block text-center no-radius with-icon planned_alert_txt';
                    if (this.activatedAlarm) {
                        str += ' btn-default';
                    } else {
                        str += ' btn-warning'
                    }
                    return str;
                },
                activatedAlarm() {
                    if (this.isUserNotifiedNextAuction || (this.userInfos.auCurrent && this.userInfos.auCurrent[this.auctionUuid] && this.userInfos.auCurrent[this.auctionUuid].alarmWanted === '1')) {
                        return true;
                    }
                },
            },
            mapGetters('UserDatas', {
                userInfos: 'userInfos',
            })),
        watch: {
            activatedAlarm(val) {
                this.$emit('activatedAlarm', val);
            },
        },
        methods: Object.assign({
                eaClick() {
                    if (typeof EA_dyntpclick !== 'undefined') {
                        EA_dyntpclick(this.eaSite, 'enchères à venir', this.eaLocation, this.eaSite, 'generic');
                    }
                },
                updateAlarmWanted() {
                    if (this.activatedAlarm) {
                        // Alarm already actived
                        return;
                    }
                    if (userId !== '0') {
                        putAlarmWanted({
                            'alarmWanted': 1,
                            'auctionId': this.auctionId,
                            'userId': userId,
                        })
                            .then(() => {
                                this.isUserNotifiedNextAuction = 1;
                            });
                    } else {
                        this.openLoginOrRegisterModal(null);
                    }

                    this.eaClick()
                },
                openLoginOrRegisterModal(bidType) {
                    if (this.onlyView) {
                        this.openLoginModal();
                    } else {
                        this.openRegisterModal(bidType);
                    }
                },
            },
            mapActions("AuthentificationAction", [
                "openRegisterModal",
                "openLoginModal",
            ])),
    }
</script>
