<template>
    <div id="userActiveAuctions" class="auctions hide">
        <div
            v-for="(auction, uuid) in auctions"
            :key="auction.auction_id"
            :data-auction-uuid="'auction_'+uuid"
            class="push-auction auction hide"
            >&nbsp;
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';
    import { winNotification } from "../../function/ass.auctionManager";
    import { firebaseDbInit } from "../../firebase"
    import { initAuctions } from "../../services/Auction/Index";

    export default {
        name: "AuctionListHide",
        data() {
            return {
                auctions: [],
            }
        },
        computed: Object.assign({},
            mapGetters('UserDatas', {
                userInfos: 'userInfos',
            })),
        methods: {
            notification(data) {
                // Edit notifications user winner auctions pending
                winNotification(data, this.userInfos.userHash);
            },
        },
        watch: {
            userInfos(val) {
                if (val && val.auCurrent) {
                    const self = this;
                    const oldAuctions = this.auctions;
                    const newAuctions = val.auCurrent;

                    // Remove auctions
                    if (this.notEmptyObject(oldAuctions)) {
                        this.auctions = oldAuctions.filter((currentAuction, index) => {
                            let find = false;
                            Object.keys(newAuctions).map((keyCurrentData) => {
                                if (currentAuction.uuid === keyCurrentData) {
                                    find = true;
                                    return;
                                }
                            });
                            if (!find) {
                                self.auctions.splice(index);
                                return false;
                            }
                            return true;
                        });
                    }

                    // Add auctions
                    if (this.notEmptyObject(newAuctions)) {
                        Object.keys(newAuctions).map((key) => {
                            let find = false;
                            const newData = {
                                uuid: key,
                                hasBid: newAuctions[key].hasBid,
                                endAuction: {},
                            };

                            Object.keys(oldAuctions).map((keyCurrentData) => {
                                if (oldAuctions[keyCurrentData].uuid === newData.uuid) {
                                    find = true;
                                    return false;
                                }
                            });

                            if (!find) {
                                self.auctions.push(newData);
                                firebaseDbInit((snapshotValue) => {
                                    if (snapshotValue) {
                                        newData.endAuction = snapshotValue;
                                        if (!snapshotValue.stopAuction) {
                                            self.notification(snapshotValue);
                                        }
                                    }
                                }, { channel: `au/${key}/endAuction` })
                                    .catch((error) => {
                                        if (this.$root.$options.methods.errsIsDefined()) {
                                            leErrs.meta.Code = error.code;
                                            leErrs.track(new Error("auctionListHide watch userInfos : " + error.message));
                                        }
                                    })
                            }
                        });
                    }

                    initAuctions(this.auctions, this);
                }
            },
        },
    };
</script>
