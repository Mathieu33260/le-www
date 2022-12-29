<template>
    <li v-html="getMsgFormat(bid)" :data-time="getBidTime" :class="['bids-list-item-text', {'is-autobid': bid.isAutobid}]"></li>
</template>

<script>
    import moment from 'moment';

    moment.locale('fr');

    export default {
        name: 'BidHistoryItem',
        props: {
            // Bid item
            bid: {
                type: Object,
                required: false,
                default: () => {},
            },
        },
        computed: {
            getBidTime() {
                const bidTimestamp = moment(this.bid.date).format('X');
                const yerstedayTimestamp = moment().subtract(1, 'days').format('X');

                if (bidTimestamp <= yerstedayTimestamp) {
                    return moment(this.bid.date).format('DD/MM');
                }
                return moment(this.bid.date).format('HH:mm');
            },
        },
        methods: {
            /**
             * @vuese
             * Get bid message format
             * @arg Object
             * @return String
             */
            getMsgFormat(bid) {
                const msg = [];
                let firstName;
                let lastName;

                if (bid.firstName) {
                    firstName = bid.firstName.charAt(0).toUpperCase() + bid.firstName.slice(1).toLowerCase();
                }

                if (bid.lastName) {
                    lastName = bid.lastName.toUpperCase();
                }

                if (bid.isAutobid) {
                    msg.push('Mise automatique');

                    if (firstName || lastName) {
                        msg.push('pour');

                        if (firstName) msg.push(firstName);
                        if (lastName) msg.push(lastName);
                    }

                    msg.push('de');
                } else {
                    if (firstName) msg.push(firstName);
                    if (lastName) msg.push(lastName);
                    msg.push('vient de miser');
                }

                if (bid.amount) {
                    msg.push(bid.amount / 100 + '&euro;');
                }

                return msg.join(' ');
            },
        },
    }
</script>
