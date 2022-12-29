<template>
    <li :class="bidListGroupClass">
        <span v-if="bidGroup.sender !== 'currentUser'" class="bids-list-item-bubble">
            <span>{{ bidGroup.sender }}</span>
        </span>
        <ul class="bids-list-item-inner list-unstyled">
            <bid-history-list-item v-for="(bidItem, key) in bidGroup.bids" :key="key" :bid="bidItem"></bid-history-list-item>
        </ul>
    </li>
</template>

<script>
    import BidHistoryListItem from './BidHistoryListItem.vue';

    export default {
        name: 'BidHistoryListGroup',
        components: {
            BidHistoryListItem,
        },
        props: {
            // Object containing bids grouped by sender
            bidGroup: {
                type: Object,
                required: true,
            },
        },
        computed: {
            bidListGroupClass() {
                return this.bidGroup.sender !== 'currentUser' ? 'bids-list-item system' : 'bids-list-item user';
            },
        },
    }
</script>
