<template>
    <div v-if="loaded" id="bid-history-v3">
        <h3>Activité de l'enchère</h3>
        <ul v-chat-scroll="{always: false, smooth: true}" class="bids-list list-unstyled">
            <li v-if="auctionDate && bids.length < 10" class="bids-list-date">L'enchère a commencé le {{ auctionDate | moment("DD/MM/YYYY à HH:mm:ss") }}</li>
            <li v-if="bids.length < 10" class="bids-list-item system">
                <span class="bids-list-item-bubble">
                    <svg viewBox="0 0 377 377"><defs><linearGradient id="a" x1="188.5" y1="12.83" x2="188.5" y2="364.95" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f5ae1b"/><stop offset=".49" stop-color="#f59c1d"/><stop offset="1" stop-color="#ef7b1c"/></linearGradient></defs><rect x="11.5" y="11.83" width="354" height="354" rx="177" fill="url(#a)"/><path d="M193.82 199.72l-10.52 10.7a21.8 21.8 0 01-30.73.26l-21.45-21.09a21.78 21.78 0 01-.26-30.72l52.81-53.73a21.8 21.8 0 0130.73-.26L235.85 126a21.79 21.79 0 01.27 30.72l-10.52 10.7a4.77 4.77 0 00.05 6.73l46.91 46.11a4.78 4.78 0 007.29-.72c11-16.22 18.17-35.25 18.17-56.28a109.86 109.86 0 00-109.68-110s.13 0 0 0c-59.48.44-109.11 49.51-109.11 110 0 41 28.59 74.46 56.91 94.24 21.29 14.86 36.14 32.81 45.31 58 4 10.89 10.91 10.89 14.87 0 9.16-25.24 24-43.19 45.28-58q2.86-2 5.71-4.18a4.77 4.77 0 00.46-7.19l-47.23-46.44a4.75 4.75 0 00-6.72.03z" fill="#fff"/></svg>
                </span>
                <ul class="bids-list-item-inner list-unstyled">
                    <li class="bids-list-item-text">Mesdames, Messieurs !</li>
                    <li class="bids-list-item-text">On commence à 1&euro; pour cette belle offre.</li>
                </ul>
            </li>
            <bid-history-list-group v-for="(bidGroup, key) in bidsFiltered" :key="key" :bidGroup="bidGroup"></bid-history-list-group>
        </ul>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { mapGetters } from 'vuex';
    import VueChatScroll from 'vue-chat-scroll';
    import moment from 'moment';
    import BidHistoryListGroup from './BidHistoryListGroup.vue';

    moment.locale('fr');

    Vue.use(VueChatScroll);

    export default {
        name: 'BidHistoryList',
        components: {
            BidHistoryListGroup,
        },
        props: {
            // The date of the auction
            auctionDate: {
                type: String,
                required: true,
                default: '',
            },
        },
        data() {
            return {
                loaded: false,
            }
        },
        mounted() {
            // prevent firebase bids loading
            // front messages (header) have been displayed before firebase bids was loaded
            // this create a glitch if there are more than 10 bids in json datas
            setTimeout(() => {
                this.loaded = true;
            }, 2500);
        },
        computed: {
            ...mapGetters('BidsDatas', [
                'bids',
            ]),
            ...mapGetters('UserDatas', [
                'userInfos',
            ]),
            bidsFiltered() {
                const lng = this.bids.length;
                const bids = [];
                for (let i = 0; i < lng; i++) {
                    const bid = this.bids[i];
                    const user = !this.isUser(bid.userHash) ? this.getNameOfUser(bid) : 'currentUser';
                    const lastGroup = bids[bids.length - 1];

                    if (lastGroup && lastGroup.sender === user) {
                        lastGroup.bids.push(bid);
                    } else {
                        bids.push({
                            sender: user,
                            bids: [bid],
                        })
                    }
                }
                return bids;
            },
        },
        methods: {
            /**
             * @vuese
             * Check if the bid author is current user
             * @arg String
             * @return Boolean
             */
            isUser(userHash) {
                if (!this.notEmptyObject(this.userInfos)) return false;
                if (this.userInfos.userHash === userHash) return true;
            },
            /**
             * @vuese
             * Get initials of user
             * @arg Object
             * @return String
             */
            getNameOfUser(bid) {
                let str = '';
                if (bid.firstName) {
                    str += this.firstLetterInUppercase(bid.firstName);
                }
                if (bid.lastName) {
                    str += this.firstLetterInUppercase(bid.lastName);
                }
                return str;
            },
            /**
             * @vuese
             * Get letter and add uppercase format
             * @arg String
             * @return String
             */
            firstLetterInUppercase(value) {
                return value.charAt(0).toUpperCase();
            },
        },
    }
</script>
