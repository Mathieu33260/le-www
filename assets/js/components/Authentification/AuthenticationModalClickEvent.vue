<template>
    <div aria-hidden="true"></div>
</template>

<script>
  import { mapActions } from "vuex"
  import "../../function/ass.auctionManager";

  export default {
    name: "AuthenticationModalClickEvent",
    props: {
      // You can add multiple elements like ".divA", or ".divA, .divB" or "#header .divA" etc
      element: {
        type: String,
        required: true,
      },
      // Open modal on click an auction
      auctions: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    methods: Object.assign({
      addEvent(element) {
          if (typeof element !== 'undefined') {
              element.addEventListener('click', (e) => {
                  e.preventDefault();
              });
              element.onclick = this.openRegisterModal;
          }
      },
    },
    mapActions("AuthentificationAction", [
      "openRegisterModal",
    ])),
    mounted() {
      // Polyfill for IE forEach
      if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
      }

      window.document.querySelectorAll(this.element).forEach((input) => {
        this.addEvent(input)
      });

      if (this.auctions) {
        window.auctionManager._callbacks.addAuction.push((auction) => {
          this.addEvent(auction.$container[0]);
        });
      }
    },
  }
</script>
