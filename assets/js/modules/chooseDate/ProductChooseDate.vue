<template>
    <div class="background-blanc" v-if="openModule">
        <div class="chooseDate" :class="{ 'warning': dateUnavailable }" @click="openModal">
            <div class="media">
                <div class="media-left media-middle hidden-sm">
                    <img class="media-object" :src="media" alt="#">
                </div>
                <div class="media-body">
                    <div v-if="chosenDateAndAvailable">
                        <template v-if="notEmptyObject(availability)">
                            <div class="text-blue-dark2 nopadding-left-only title-edit">
                                <strong>{{ availability.city }}</strong>
                                <button class="btn btn-link btn-sm edit"><strong>Modifier</strong></button>
                            </div>
                            <div class="clearfix" aria-hidden="true"></div>
                            <div>
                                <strong class="small">
                                    Du {{ availability.travelInfos.dateTrip|moment('ddd DD')|capitalize }}
                                    au {{ availability.travelInfos.returnDate|moment('ddd DD')|capitalize }} {{ availability.travelInfos.returnDate|moment('MMMM YYYY')|capitalize }}
                                </strong>
                                <div class="small right">{{ length }}</div>
                            </div>
                        </template>
                        <p v-else class="text-center">
                            <img :src="$root.assetCdn + '/assets/gfx/loader.gif?v=20170307'" alt="Chargement en cours" width="40"><br />
                            Chargement en cours...
                        </p>
                    </div>
                    <div v-else class="dateInformations">
                        <div class="col-xs-9 col-md-10 nopadding-left-only" :class="{ 'text-blue-dark2': notEmptyObject(availability) }">
                            <strong class="text-blue-dark2 nopadding-left-only" v-if="dateUnavailable">Préparez votre voyage</strong>
                            <strong v-else>Préparez votre voyage</strong>
                            <br />
                            <small class="text-grey-fonce" v-if="dateUnavailable"><b>Les dates sélectionnées ne sont plus disponibles</b></small>
                            <small v-else>Choisissez votre ville et date de départ</small>
                        </div>
                        <div class="col-xs-3 col-md-2 right nopadding">
                            <button class="btn btn-transparent with-icon">
                                &nbsp;
                                <i class="icon-arrow-right-sytle-lineal icon-2x"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from "vuex"

  const moment = require('moment')
  require('moment/locale/fr')

  /**
   * Show module chooseDate
   */
  export default {
    name: "ProductChooseDate",
    props: {
      // The id product
      productId: {
        type: Number,
        required: true,
      },
      // The id auction
      auctionId: {
        type: Number,
        required: true,
      },
      // Length of stay in days
      lengthOfDay: {
        type: Number,
        required: true,
      },
      // Length of stay in night
      lengthOfNight: {
        type: Number,
        required: true,
      },
      // The uuid auction
      auctionUuid: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        // Icon url
        media: '/assets/gfx/pictos/dateValid.svg',
      }
    },
    computed: Object.assign({
      // The date chosen by the user is no longer available
      dateUnavailable() {
        return this.userBookingOption && this.userBookingOption[this.productId] && this.userBookingOption[this.productId].available === false;
      },
      // User has chosen an available date
      chosenDateAndAvailable() {
        const chosen = this.userBookingOption && this.userBookingOption[this.productId] && this.notEmptyObject(this.userBookingOption[this.productId]) && !this.dateUnavailable;
        if (chosen) {
          this.recoversAvailability({
            noSoldout: true,
          });
        }
        return chosen;
      },
      // Set if we display the module
      openModule() {
        return this.userAuction && this.userAuction[this.auctionUuid] && this.userAuction[this.auctionUuid].hasBid === '1';
      },
    },
    mapGetters("Availabilities", [
      "userBookingOption",
      "userAuction",
      "availability", // Data of the availability chosen by the user
      "length",
    ])),
    methods: Object.assign({},
    mapActions("Availabilities", [
      "openModal",
      "recoversAvailability",
      "setProductId",
      "setAuctionId",
      "setAuctionUuid",
      "setLengthOfDay",
      "setLengthOfNight",
    ])),
    watch: {
      dateUnavailable(val) {
        const picto = val ? 'dateInvalid.svg' : 'dateValid.svg';
        this.media = '/assets/gfx/pictos/' + picto;
      },
      userBookingOption(val) {
        const notAvailable = val && val[this.productId] && val[this.productId].available === false;
        if (notAvailable) {
          this.recoversAvailability({
            noSoldout: true,
          });
        }
      },
    },
    created() {
      this.setProductId(this.productId);
      this.setAuctionId(this.auctionId);
      this.setAuctionUuid(this.auctionUuid);
      this.setLengthOfDay(this.lengthOfDay);
      this.setLengthOfNight(this.lengthOfNight);
    },
  }
</script>
