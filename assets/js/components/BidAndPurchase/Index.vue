<template>
  <div class="switch background-blanc">
    <div class="row">
      <div class="col-xs-8 col-xs-offset-2">
        <switch-button></switch-button>
      </div>
    </div>
  </div>
</template>

<script>
    import { mapActions } from 'vuex';
    import SwitchButton from './Switch/Button.vue';

    export default {
      name: "BidAndPurchase",
      components: {
        SwitchButton,
      },
      props: {
        paneActiveDefault: {
          type: String,
          required: true,
          validator(value) {
            if (!["bid", "buyNow"].includes(value)) {
              console.error("[ERROR] Props MODE must have as value 'bid' or 'buyNow'");
              return false;
            }
            return true;
          },
        },
        auctionId: {
          type: Number,
          required: true,
        },
      },
      methods: Object.assign({},
          mapActions('BidAndPurchase', {
              definePaneActive: 'switchTo',
          })),
      mounted() {
        this.definePaneActive(this.paneActiveDefault);
        const makeBuyNow = Cookies.get('want-purchase-' + this.auctionId);
        if (makeBuyNow) {
          this.definePaneActive("buyNow");
        }
      },
    }
</script>
