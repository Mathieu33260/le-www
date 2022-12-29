<template>
  <div class="enchere" :class="enchereContainerCss">
    <component
            v-if="upcomingItem"
            :is="'Upcoming'"
            :auction="auction"
            :sources-edit="sourcesEdit"
    ></component>
    <div v-else :class="enchereContainerRowCss">
      <i
              v-if="notEmptyObject(user)"
              class="icon-favorite not-favorite"
              data-toggle="tooltip"
              data-placement="right"
              title="Ajouter aux favoris"
              v-once
              @click="changeReloadFavorite"
      ></i>
      <div class="thumbContent nopadding-only" :class="thumbContentClass + ' ' + templatePageType">
        <a :href="link(auction.product_id)" class="no-opacity">
          <auction-picture
                :auction="auction"
                :sources-edit="sourcesEdit"
                :template-page-type="templatePageType"
          ></auction-picture>
          <div
                  class="feedbackContainer"
                  :class="[{ shadow: auction.feedback_nb && auction.feedback_score }]"
          >
            <div v-if="auction.feedback_nb && auction.feedback_score">
              <template v-for="i in 5">
                <img
                        v-if="feedbackScore(auction.feedback_score, i) === 'complete'"
                        :src="$root.assetCdn+'/assets/gfx/stars_color_small_2.png'"
                        alt="#"
                        :key="auction.auction_id+'-'+i+'-1'"
                >
                <img
                        v-else-if="feedbackScore(auction.feedback_score, i) === 'half'"
                        :src="$root.assetCdn+'/assets/gfx/picto_half_star-white.png'"
                        alt="#"
                        :key="auction.auction_id+'-'+i+'-2'"
                >
                <img
                        v-else
                        :src="$root.assetCdn+'/assets/gfx/stars_white_small.png'"
                        alt="#"
                        :key="auction.auction_id+'-'+i+'-3'"
                >
              </template>
              <span class="scorenb">
                {{ auction.feedback_score }}/5
                <span
                        class="hidden-xs"
                >({{ auction.feedback_nb }} avis)</span>
              </span>
            </div>
            <div class="nouveautePictoContainer" v-else-if="auction.hasNewTag == 1">
              <img
                      :src="$root.assetCdn+'/assets/gfx/picto-nouveautes-orange.png'"
                      title="nouveauté"
                      alt="nouveauté"
              >
            </div>
          </div>
        </a>
      </div>
      <div class="moduleTexte moduleTexteAuction" :class="moduleTexteClass">
        <a :href="link(auction.product_id)">
          <div class="texte">
            <p
                    v-if="auction.product_shortloc != null && auction.concatenate == '1'"
                    v-line-clamp="thumbInfoLine"
                    class="auctionThumbInfo shortloc"
            >{{ auction.product_shortloc }}</p>
            <p
                    class="auctionThumbTitle"
                    v-line-clamp="thumbTitleLine"
            >{{ auction.auction_name }}</p>
          </div>
          <div class="prix price-row">
            <div class="row">
              <div class="time col-sm-6 col-xs-7 nopadding-right-only-xs">
                <div v-if="auction.timelefttext">{{ auction.timelefttext }}</div>
                <div v-else>
                  <span class="time-placeholder hide">{{ auction.auction_end }}</span>
                  <span class="time-countdown">
                    <span class="hours">{{ auction.hours }}</span>:
                    <span class="minutes">{{ auction.minutes }}</span>:
                    <span class="seconds">{{ auction.seconds }}</span>
                  </span>
                </div>
              </div>
              <div class="price col-xs-5 col-sm-6 nopadding-left-only-xs">
                <span>
                  <span class="bid-amount">{{ auction.bid_amount | amount }}</span> &euro;
                </span>
              </div>
              <div
                      v-if="auction.product_shortprice != null && auction.concatenate"
                      class="col-xs-12"
              >
                <span v-if="distanceES !== null" class="shortprice text-left">{{ distanceES }}</span>
                <span class="shortprice text-right">{{ auction.product_shortprice }}</span>
              </div>
            </div>
          </div>
        </a>
      </div>
      <template v-if="withStatus">
        <div v-if="auction.lead">
          <p class="text-success text-center">Vous êtes en tête !</p>
          <a
                  :href="link(auction.product_id)"
                  class="btn btn-default btn-block text-uppercase"
          >Je suis mon enchère</a>
        </div>
        <div v-else>
          <p class="text-danger text-center">Vous n'êtes plus en tête !</p>
          <a
                  :href="link(auction.product_id)"
                  class="btn btn-warning btn-block text-uppercase"
          >Je surenchéris !</a>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";
  import lineClamp from "vue-line-clamp";
  import { mapActions } from "vuex";

  import AuctionPicture from './AuctionPicture.vue';
  import Upcoming from './Upcoming.vue';

  Vue.use(lineClamp, {
    importCss: true,
  });

  export default {
    name: "AuctionListItem",
    components: {
      AuctionPicture,
      Upcoming,
    },
    filters: {
      amount(v) {
        return v > 0 ? v / 100 : 0;
      },
    },
    props: {
      auction: {
        type: Object,
        required: true,
      },
      listName: {
        type: String,
        required: false,
        default: "",
      },
      classCss: {
        type: String,
        required: false,
        default: "col-xs-12 col-s-6",
      },
      auctionsClassCss: {
        type: String,
        required: false,
        default: "",
      },
      thumbContentClass: {
        type: String,
        required: false,
        default: "col-xs-12",
      },
      moduleTexteClass: {
        type: String,
        required: false,
        default: "col-xs-12",
      },
      enchereContainerCss: {
        type: String,
        required: false,
        default: "container",
      },
      enchereContainerRowCss: {
        type: String,
        required: false,
        default: "row",
      },
      withStatus: {
        type: Boolean,
        required: false,
        default: false,
      },
      templatePageType: {
        type: String,
        required: false,
        default: "default",
      },
      isApp: {
        type: Boolean,
        required: true,
        default: false,
      },
      auctionType: {
        type: String,
        default: "list",
        required: false,
      },
      tabIndex: {
        type: Number,
        required: true,
      },
      listId: {
        type: String,
        required: false,
        default: "auctionsList",
      },
      user: {
        type: Object,
      },
      blockClick: {
        type: Boolean,
        default: false,
        required: false,
      },
      sourcesEdit: {
        required: false,
        type: Array,
      },
      upcomingItem: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    data() {
      return {
        urlData: {},
        thumbInfoLine: 1,
        thumbTitleLine: 2,
      };
    },
    computed: {
      distanceES() {
        if ('distance_elasticSearch' in this.auction && this.auction.distance_elasticSearch !== null) {
          return this.auction.distance_elasticSearch.toFixed(0) + ' km' + (this.auction.distance_elasticSearch.toFixed(0) > 1 ? 's' : '');
        }
        return null;
      },
    },
    methods: Object.assign(
            {
              link(productId) {
                if (this.blockClick) {
                  return '#';
                }
                return this.isApp
                        ? "comloisirsencheres://product/" + productId
                        : "/product/" + productId;
              },
              feedbackScore(score, i) {
                if (score >= i - 1 + 0.8) {
                  return "complete";
                }
                if (score >= i - 1 + 0.2 && score <= i - 1 + 0.8) {
                  return "half";
                }
                return "empty";
              },
            },
            mapActions("AuctionListSettings", ["changeReloadFavorite"]),
    ),
  };
</script>
