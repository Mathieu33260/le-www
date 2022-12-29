<template>
    <modal
        id="chooseDateModal"
        name="chooseDateModal"
        :adaptive="true"
        width="90%"
        height="auto"
        :max-width="480"
        :scrollable="true"
        @closed="closeOpenModal"
        :pivot-y="0"
        :max-height="300"
    >
        <div class="modal-content">
            <div class="modal-header">
                <div class="text-right close hidden-xs" @click="$modal.hide('chooseDateModal')">&times;</div>
                <div class="close visible-xs left" @click="$modal.hide('chooseDateModal')">
                    <i class="icon-close"></i> <small>Fermer</small>
                </div>
            </div>
            <div class="modal-body">
                <div v-if="chosenDay !== ''" class="confirmDay">
                    <div v-if="backupInProgress" class="text-center">
                        <img :src="$root.assetCdn + '/assets/gfx/loader.gif?v=20170307'" alt="Pré-réservation en cours" width="40"><br />
                        Pré-réservation en cours...
                    </div>
                    <template v-else>
                        <img src="/assets/gfx/pictos/dateConfirm.svg" alt="#" class="center-block">
                        <div class="info">
                            <div class="row row-no-margin">
                                <div class="col-xs-3 col-s-2 day nopadding-only text-center">
                                    {{ availability.travelInfos.dateTrip|moment('ddd')|capitalize }}<br />
                                    {{ availability.travelInfos.dateTrip|moment('DD') }}<br />
                                    {{ availability.travelInfos.dateTrip|moment('MMM')|uppercase }}
                                </div>
                                <div class="col-xs-9 col-s-7 nopadding-right">
                                    <strong class="chosenCity"><i class="icon-airplan-sytle-lineal"></i> {{ availability.city }}</strong>
                                    <div class="return">
                                        <i class="icon-info"></i>
                                        <strong>Retour le {{ availability.travelInfos.returnDate|moment("ddd DD MMM") }}</strong><br />
                                        <span class="length">{{ length }}</span>
                                    </div>
                                </div>
                                <div class="action col-xs-12 col-s-3 nopadding">
                                    <button class="btn btn-link btn-sm btn-block" @click="resetOfDay">Modifier</button>
                                </div>
                            </div>
                        </div>
                        <p class="title"><strong>À vos marques, prêt, <br class="visible-xs" />enchérissez !</strong></p>
                        <p class="text-muted">Continuez d'enchérir et soyez le dernier à miser pour remporter votre séjour !</p>
                        <button class="btn btn-primary btn-block" @click="$modal.hide('chooseDateModal')">Fermer</button>
                    </template>
                </div>
                <div class="selectADate" v-else-if="showSelectADate">
                    <div v-if="notEmptyObject(cities) === 0" class="text-center">
                        <template v-if="getError === 'Error while retrieving availability'">
                            Impossible de récupérer les dates de disponibilité.
                            <button class="btn btn-sm btn-default" @click="$modal.hide('chooseDateModal')">Fermer</button>
                        </template>
                        <template v-else>
                            <img :src="$root.assetCdn + '/assets/gfx/loader.gif?v=20170307'" alt="Chargements des dates" width="40"><br />
                            Chargement des dates en cours...
                        </template>
                    </div>
                    <template v-else>
                        <template  v-if="notEmptyObject(cities) > 1">
                            <p class="text-muted">Choisissez votre aéroport de départ et votre date de départ pour filtrer les disponibilités.</p>
                            <div class="airport">
                                <strong>Aéroport de départ ?</strong>
                                <div>
                                    <button
                                        v-for="city in cities"
                                        :key="city"
                                        @click="setSelectedCity(city)"
                                        type="button"
                                        class="btn btn-default"
                                        :class="{ 'active': selectedCity === city }"
                                    >{{ city }}</button>
                                </div>
                            </div>
                        </template>
                        <div class="months" v-if="notEmptyObject(months) > 1">
                            <strong>Date de départ ?</strong>
                            <div>
                                <button
                                    v-for="month in months"
                                    :key="month"
                                    @click="setSelectedMonth(month)"
                                    type="button"
                                    class="btn btn-default"
                                    :class="{ 'active': selectedMonth === month }"
                                >{{ month|capitalize }}</button>
                            </div>
                        </div>
                        <div class="availability">
                            <strong>Disponibilités</strong>
                            <p class="text-primary">Il s'agit d'une option sur une date, la réservation définitive se fera une fois l'enchère remportée.</p>
                            <div v-for="(day, id) in choices" :key="id" :class="classList(day.travelInfos.id)">
                                <div class="row row-no-margin">
                                    <div class="col-xs-3 col-s-2 day nopadding-only text-center">
                                        {{ day.travelInfos.dateTrip|moment('ddd')|uppercase }}<br />
                                        {{ day.travelInfos.dateTrip|moment('DD') }}<br />
                                        {{ day.travelInfos.dateTrip|moment('MMM')|uppercase }}
                                    </div>
                                    <div class="col-xs-9 col-s-7 nopadding-only">
                                        <strong class="chosenCity"><i class="icon-airplan-sytle-lineal"></i> {{ day.city }}</strong>
                                        <hr />
                                        <div class="return">
                                            <i class="icon-info"></i>
                                            <span><strong>Retour le {{ returnDate(day.travelInfos.dateTrip) }}</strong><br />{{ length }}</span>
                                        </div>
                                    </div>
                                    <div class="action col-xs-12 col-s-3 nopadding">
                                        <button
                                            class="btn btn-block nomargin"
                                            :class="[isCurrentDay(day.travelInfos.id) ? 'btn-warning' : 'btn-primary']"
                                            @click="choiceOfDay(day.travelInfos.id, isCurrentDay(day.travelInfos.id))"
                                        >{{ isCurrentDay(day.travelInfos.id) ? 'Annuler' : 'Choisir'}}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                <template v-else>
                    <img src="/assets/gfx/pictos/winner.svg" alt="#" class="center-block">
                    <p class="modal-title text-left">Vous êtes en tête de l'enchère !</p>
                    <p>Et si vous nous disiez quand vous partez ? Choisissez votre ville de départ, puis la date !</p>
                    <div class="row">
                        <div class="col-xs-12 col-s-6">
                            <button class="btn btn-primary btn-block" :class="{ 'btn-sm': $root.visibleXs }" @click="selectADate = true">Choisir une date</button>
                        </div>
                        <div class="col-xs-12 col-s-6">
                            <button class="btn btn-default btn-block" :class="{ 'btn-sm': $root.visibleXs }" @click="$modal.hide('chooseDateModal')">Plus tard</button>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from "vuex"
  import VModal from 'vue-js-modal';

  Vue.use(VModal);

  const moment = require('moment')
  require('moment/locale/fr')

  /**
   * Modal to chooseDate
   */
  export default {
    name: "ProductChooseDateModal",
    props: {
      // The id product
      productId: {
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
        // day id chosen by user
        chosenDay: '',
        /**
         * @vuese
         * Indicates if the user is a bider of the auction - null (We do not know), false (no) or true (yes)
         * `'null'` / `'false'` / `'true'`
         */
        userHasAlreadyPutBid: null,
        // Show contents to select a date
        selectADate: false,
      }
    },
    computed: Object.assign({
      // Show template to select a date
      showSelectADate() {
        return this.selectADate || (this.userBookingOption && this.userBookingOption[this.productId] && this.notEmptyObject(this.userBookingOption[this.productId]));
      },
    },
    mapGetters("Availabilities", [
      "getError",
      "openModal",
      "backupInProgress",
      'cities',
      'months',
      "selectedCity",
      "selectedMonth",
      "choices",
      "userBookingOption",
      "availability", // Data of the availability chosen by the user
      "allAvailabilities",
      "userAuction",
      "length",
      "automaticallyShowModal",
      "userBider",
    ])),
    watch: {
      openModal(val) {
        if (val) {
          this.$modal.show('chooseDateModal');
        } else {
          this.resetOfDay();
        }
      },
      userBider(val) {
        const hasBooking = this.userBookingOption !== undefined && this.userBookingOption[this.productId] !== undefined;
        if (this.userHasAlreadyPutBid === false && !hasBooking && val && this.automaticallyShowModal) {
          this.closeOpenModal();
          this.userHasAlreadyPutBid = true;
        }
      },
    },
    methods: Object.assign({
        /**
         * @vuese
         * A day is chosen
         * @arg The availabilityId is a int of availability
         * @param The argument is a boolean value for cancel reservation
         */
      choiceOfDay(availabilityId, cancel) {
        this.chosenDay = cancel ? '' : availabilityId;
        this.saveOption({
          availabilityId,
          cancel,
        });
        if (cancel) {
          this.selectADate = true;
        }
      },
        /**
         * @vuese
         * Reset user chosen day
         */
      resetOfDay() {
        this.chosenDay = '';
      },
        /**
         * @vuese
         * Define and format the return date
         * @arg A date of trip
         * @return date return
         */
      returnDate(dateTrip) {
        const days = this.lengthOfDay !== 0 ? this.lengthOfDay : this.lengthOfNight;
        const returnDate = moment(dateTrip).add(days, 'days');
        return returnDate.format('ddd DD MMM');
      },
        /**
         * @vuese
         * Define css class of a availability item
         * @arg The availability id
         * @returns {string}
         */
      classList(id) {
        let str = 'list';
        if (this.isCurrentDay(id)) {
          str += ' active';
        }
        return str;
      },
        /**
         * @vuese
         * Set if it is the day chosen by the user
         * @arg The availability id
         * @returns {boolean}
         */
      isCurrentDay(id) {
        const bookingOption = this.userBookingOption;
        return bookingOption !== undefined && bookingOption[this.productId] !== undefined && parseInt(bookingOption[this.productId].availabilityId, 10) === parseInt(id, 10);
      },
    },
    mapActions("Availabilities", {
      recoversAvailability: "recoversAvailability",
      closeOpenModal: "openModal",
      saveOption: "saveOption",
      setSelectedMonth: "setSelectedMonth",
      setSelectedCity: "setSelectedCity",
    })),
    updated() {
      if (this.userHasAlreadyPutBid === null) {
        this.userHasAlreadyPutBid = this.userBider; // We know if the user to bid - false or true
      }
      if (this.selectADate && !this.notEmptyObject(this.allAvailabilities)) {
        this.recoversAvailability({
          noSoldout: true,
        });
      }
    },
  }
</script>
