<template>
  <div ref="auctionList">
      <component
              :is="titleType"
              v-if="useTitle"
              v-text="titleText"
      />
      <div
              :id="listId"
              class="auctions"
              :class="defineAuctionsClassCss"
              :data-list="listName"
              :data-auctiontype="auctionType"
              :data-tabindex="tabIndex"
      >
        <vue-glide
                v-if="useCarousel && loaded"
                type="slider"
                :bullet="false"
                :autoplay="0"
                :breakpoints="carouselBreakpoints"
                :per-view="1"
                :gap="0"
        >
          <vue-glide-slide
                  v-for="(auction, index) in auctions"
                  :key="auction.auction_id"
          >
           <div
                    :data-productname="auction.product_name | escapeCote"
                    :data-pid="auction.product_id"
                    :data-auction-uuid="'auction_'+auction.uuid"
                    :data-time-start="auction.datatimestart"
                    :data-time-end="auction.datatimeend"
                    :data-position="index"
                    :class="auctionCss(auction, index)"
            >
              <auction-list-item
                      :list-name="listName"
                      :class-css="classCss"
                      :auctions-class-css="auctionsClassCss"
                      :thumb-content-class="thumbContentClass"
                      :module-texte-class="moduleTexteClass"
                      :with-status="withStatus"
                      :template-page-type="templatePageType"
                      :is-app="isApp"
                      :auction-type="auctionType"
                      :tab-index="tabIndex"
                      :list-id="listId"
                      :auction="auction"
                      :user="userInfos"
                      :enchere-container-css="enchereContainerCss"
                      :enchere-container-row-css="enchereContainerRowCss"
              />
            </div>
          </vue-glide-slide>
          <template
                  slot="control"
                  class="auctions-carousel__controls"
          >
            <button
                    data-glide-dir="<"
                    class="glide-controls--auctions__controls glide-controls--auctions__controls--left"
            >
              <img
                      :src="`${$root.assetCdn}/assets/img/slider/icon-arrow-left.png`"
                      alt="précédent"
              >
            </button>
            <button
                    data-glide-dir=">"
                    class="glide-controls--auctions__controls glide-controls--auctions__controls--right"
            >
              <img
                      :src="`${$root.assetCdn}/assets/img/slider/icon-arrow-right.png`"
                      alt="suivant"
              >
            </button>
          </template>
        </vue-glide>
        <div
              v-else
              v-for="(auction, index) in auctions"
              :key="auction.auction_id"
              :data-productname="auction.product_name | escapeCote"
              :data-pid="auction.product_id"
              :data-auction-uuid="'auction_'+auction.uuid"
              :data-time-start="auction.datatimestart"
              :data-time-end="auction.datatimeend"
              :data-position="index"
              :class="auctionCss(auction, index)"
        >
          <auction-list-item
                  :list-name="listName"
                  :class-css="classCss"
                  :auctions-class-css="auctionsClassCss"
                  :thumb-content-class="thumbContentClass"
                  :module-texte-class="moduleTexteClass"
                  :with-status="withStatus"
                  :template-page-type="templatePageType"
                  :is-app="isApp"
                  :auction-type="auctionType"
                  :tab-index="tabIndex"
                  :list-id="listId"
                  :auction="auction"
                  :user="userInfos"
                  :enchere-container-css="enchereContainerCss"
                  :enchere-container-row-css="enchereContainerRowCss"
                  :sources-edit="sourcesEdit"
                  :upcoming-item="upcoming"
          />
        </div>
      </div>
      <div v-if="load && !usePlaceholder" class="row moreAuctionsLoader">
        <div class="col-xs-12 text-center" v-on:click="patience">
          <img :src="$root.assetCdn+'/assets/gfx/loader.gif?v=20170504'" alt="chargement" width="64" /><br />
          {{ textLoader }}
        </div>
      </div>
      <template v-else-if="showBlockNoAuctionFound">
        <component :is="noAuctionFoundMessComponent"></component>
      </template>
      <div v-if="showBtnMoreAuctions" class="row moreAuctions marginbottom1">
        <div class="col-xs-12">
          <button class="btn btn-warning center-block animationDown with-icon" @click="moreAuctions">
            Afficher plus d'enchères
            <i class="icon-arrow-down" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <a v-if="showBtnAllAuctions" href="/all" class="btn btn-primary text-uppercase marginbottom1 with-icon" id="see_all_btn">
        Voir toutes nos enchères <i class="icon-arrow-right" aria-hidden="true"></i>
      </a>
  </div>
</template>

<script>
    import Vue from "vue";
    import { mapGetters, mapActions } from "vuex";
    import lineClamp from "vue-line-clamp";
    import { Glide, GlideSlide } from "vue-glide-js";
    // import "vue-glide-js/dist/vue-glide.css";   /* Moved CSS import to Less pipeline, in main.less */
    import TrackTiming from "../../function/TrackTiming";
    import assAuction from "../../function/ass.auctionManager";
    import { firebaseDbInit } from "../../firebase"
    import { initAuctions } from "../../services/Auction/Index";
    import * as api from "./_api";
    import AuctionListItem from "./AuctionListItem/index.vue";
    import NoAuctionFoundMess from "./NoAuctionFoundMess.vue";
    import NoAuctionFoundMessUser from "./NoAuctionFoundMessUser.vue";

    Vue.use(lineClamp, {
        importCss: true,
    });

    export default {
        name: "AuctionList",
        components: {
            AuctionListItem,
            NoAuctionFoundMess,
            NoAuctionFoundMessUser,
            [Glide.name]: Glide,
            [GlideSlide.name]: GlideSlide,
        },
        filters: {
            escapeCote(str) {
                return str.replace("'", "");
            },
        },
        props: {
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
            clustName: {
                type: String,
                required: false,
                default: '',
            },
            searchTerms: {
                type: String,
                required: false,
                default: '',
            },
            useFilters: {
                type: Boolean,
                required: false,
                default: false,
            },
            useSort: {
                type: Boolean,
                required: false,
                default: false,
            },
            sort: {
                type: String,
                required: false,
            },
            url: {
                type: String,
                required: false,
                default: "/auction/activeauctions",
            },
            urlParams: {
                type: Object,
                required: false,
                default() {
                    return {};
                },
            },
            successCallback: {
                type: String,
                required: false,
            },
            requestUri: {
                type: String,
                required: false,
            },
            useNoAuctionFoundMess: {
                type: Boolean,
                required: false,
                default: true,
            },
            usePlaceholder: {
                type: Boolean,
                required: false,
                default: false,
            },
            isApp: {
                type: Boolean,
                required: true,
                default: false,
            },
            nbAuctionsDefault: {
                type: [Number, String],
                default: 0,
                required: false,
            },
            nbAuctionsIncrementDefault: {
                type: Number,
                default: 0,
                required: false,
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
            tag: {
                type: String,
                required: false,
            },
            useMoreAuctionsBtn: {
                type: Boolean,
                required: false,
                default: true,
            },
            useTitle: {
                type: Boolean,
                default: false,
            },
            titleType: {
                type: String,
                default: "h2",
            },
            titleText: String,
            useCarousel: {
                type: Boolean,
                default: false,
                required: false,
            },
            noAuctionFoundMessComponent: {
                type: String,
                default: "NoAuctionFoundMess",
                required: false,
            },
            auctionsData: {
                type: Array,
                default: () => new Array(),
                required: false,
            },
            blockClick: {
                type: Boolean,
                default: false,
                required: false,
            },
            /* offset for get auction */
            offset: {
                type: Number,
                default: 0,
                required: false,
            },
            sourcesEdit: {
                required: false,
                type: Array,
            },
            // Auction in the future. Special template
            upcoming: {
                type: Boolean,
                required: false,
                default: false,
            },
            // Eulerian site key (default if omitted is prod value)
            eaSite: {
                type: String,
                require: false,
                default: 'loisirs-encheres-com',
            },
        },
        data() {
            return {
                auctions: [],
                load: true,
                textLoader: "Chargement des enchères en cours ...",
                urlData: {},
                nbAuctionsIncrement: 0,
                nbAuctions: 0,
                realSort: this.sort,
                // Number of bids retrieved
                nbAuctionsRetrieved: 0,
                carouselBreakpoints: {
                    600: { perView: 1 },
                    991: { perView: 2 },
                    5000: { perView: 3 },
                },
                observerEvent: {
                    observer: null,
                    options: {
                        root: null,
                        threshold: 0,
                    },
                },
                blockClickData: this.blockClick,
                placeholderRemoved: false,
            };
        },
        computed: Object.assign({
                showBtnMoreAuctions() {
                    return this.useMoreAuctionsBtn && this.load === false && this.auctions.length > 0 && this.nbAuctions <= this.notEmptyObject(this.auctions);
                },
                showBtnAllAuctions() {
                    return this.useMoreAuctionsBtn && this.load === false && this.nbAuctions > this.notEmptyObject(this.auctions) && this.requestUri !== "/all";
                },
                loaded() {
                    return (this.auctions.length && this.auctions.length === this.nbAuctionsRetrieved);
                },
                defineAuctionsClassCss() {
                    let str = this.auctionsClassCss;
                    if (!this.useCarousel) {
                        str += " row";
                    }
                    return str;
                },
                showBlockNoAuctionFound() {
                    return this.useNoAuctionFoundMess && !this.load && this.nbAuctionsRetrieved === 0 && (!this.usePlaceholder || (this.usePlaceholder && this.placeholderRemoved))
                },
            },
            mapGetters("AuctionListSettings", {
                filters: "filters",
                dynamicSort: "sort",
                reload: "loadAuctions",
                loadingStep: "loadingStep",
            }),
            mapGetters("UserDatas", {
                userInfos: "userInfos",
            })),
        watch: {
            dynamicSort(val) {
                if (val !== this.realSort) {
                    this.realSort = val;
                    this.$store.dispatch("AuctionListSettings/changeLoadAuctions");
                }
            },
            loadingStep(val) {
                if (val >= 2) {
                    // Filters and sort are availables - This condition is called once, when loading the page
                    this.requestAuctions();
                }
            },
            auctions() {
                this.$nextTick(() => {
                    this.auctionsReady();
                });
                if (this.upcoming === false) {
                    // Bind auctions
                    initAuctions(this.auctions, this).then(() => {
                        this.load = false;
                    });
                }
            },
        },
        created() {
            this.nbAuctionsIncrement = this.nbAuctionsIncrementDefault;
            this.nbAuctions = this.nbAuctionsDefault;

            if (typeof window.matchMedia !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                if (this.nbAuctionsIncrement === 0) {
                    this.nbAuctionsIncrement = this.$config.get("nbAuctionsIncrement");
                }
                if (this.nbAuctions === 0) {
                    this.nbAuctions = this.$config.get("nbAuctionsIncrement");
                }
            } else {
                if (this.nbAuctionsIncrement === 0) {
                    this.nbAuctionsIncrement = this.$config.get("nbAuctionsIncrementDesktop");
                }
                if (this.nbAuctions === 0) {
                    this.nbAuctions = this.$config.get("nbAuctionsIncrementDesktop");
                }
            }

            this.load = true;
        },
        mounted() {
            this.observerEvent.observer = new IntersectionObserver(
                (entries, observerReference) => {
                    if (entries && entries[0] && entries[0].isIntersecting) {
                        this.requestAuctions();
                        observerReference.unobserve(this.$refs.auctionList);
                    }
                },
                this.observerEvent.options,
            );

            this.observerEvent.observer.observe(this.$refs.auctionList);
        },
        methods: Object.assign({
                auctionCss(auction, index) {
                    return [
                        {
                            inactive: auction.inactive,
                            "visible-xl": this.templatePageType === "fullpage" && index > 7,
                            "col-s-offset-3 col-sm-offset-0": index === 2 && this.nbAuctionsDefault === 3, /* eslint key-spacing: 0 */
                        },
                        this.classCss + " module push-auction auction",
                    ];
                },
                auctionsReady() {
                    // Bind auctions
                    initAuctions(this.auctions, this).then(() => {
                        this.load = false;
                    });
                },
                moreAuctions() {
                    this.nbAuctions += this.nbAuctionsIncrement;
                    this.load = true;
                    this.requestAuctions();
                    ga("send", {
                        hitType: "event",
                        eventCategory: "auctions list",
                        eventAction: "click",
                        eventLabel: "Show more",
                    });
                },
                requestAuctions() {
                    this.urlData = this.urlParams;

                    if (this.useFilters) {
                        Object.keys(this.filters).map((filtersKey, index) => {
                            const filterValue = this.filters[filtersKey];
                            if (typeof filterValue === "object" && filterValue !== null) {
                                this.filters[filtersKey] = $.map(filterValue, value => [value]);
                            } else if (filterValue === "") {
                                delete this.filters[index];
                            }
                            return true;
                        });

                        this.urlData = this.filters;
                    }

                    if (this.clustName) {
                        this.urlData.clustName = this.clustName;
                        this.urlData.geoloc = 1;
                    }

                    if (this.tag) {
                        this.urlData.tag = this.tag;
                    }

                    if (this.searchTerms !== "") {
                        this.urlData.searchTerms = this.searchTerms;
                    }
                    // Order by
                    if (this.useSort || this.realSort) {
                        this.urlData.sort = this.realSort;
                    }
                    const tt = TrackTiming;
                    tt.setters.initialize(
                        "auctionList",
                        "getNewAuctionsAjax",
                        this.nbAuctionsIncrement,
                    );

                    if (this.notEmptyObject(this.auctionsData)) {
                        // Auctions given directly with twig
                        this.addAuctions(this.auctionsData);
                        if (this.upcoming === false) {
                            initAuctions(this.auctions, this);
                        }
                        // Hide loader
                        this.load = false;
                    } else {
                        this.fetchAuctions(tt);
                    }
                },
                fetchAuctions(tt) {
                    api
                        .fetchAuctions(this.url, this.urlData, this.nbAuctions, this.offset !== 0 ? this.offset : null, this.upcoming)
                        .then((response) => {
                            tt.setters.endTime();
                            tt.send();

                            let data = this.successCallback
                                ? window[this.successCallback](response)
                                : response;

                            // Set informations in the store
                            this.setAuctionsLength(data.auctions.length);
                            // Keep the information locally
                            this.nbAuctionsRetrieved = data.auctions.length;

                            if (typeof data.userproductspending !== "undefined") {
                                this.userInfos.userproductspending = data.userproductspending;
                            }
                            // Remove auction in vm.data auctions
                            this.auctions = this.auctions.filter((currentAuction) => {
                                const find = Object.keys(data.auctions).find(keyCurrentData => currentAuction.auction_id === data.auctions[keyCurrentData].auction_id);

                                if (!find) {
                                    assAuction.manager.removeAuction(
                                        "auction_" + currentAuction.uuid,
                                    );
                                }
                                return find;
                            }); /* eslint array-callback-return: 1, no-useless-return: 1 */

                            // Add auction in vm.data auctions
                            if (data.auctions.length) {
                                this.addAuctions(data.auctions);
                                this.sortAuctions();
                            }

                            if (this.successCallbackEnd) {
                                data = window[this.successCallbackEnd](data);
                            }

                            this.load = false;
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                },
                addAuctions(auctions) {
                    Object.keys(auctions).map((key) => {
                        let find = false;
                        const newData = auctions[key];
                        Object.keys(this.auctions).map((keyCurrentData) => {
                            if (this.auctions[keyCurrentData].auction_id === newData.auction_id) {
                                find = true;
                                return false;
                            }
                        });

                        // bid_amount
                        if (!find && this.upcoming === false) {
                            firebaseDbInit((snapshotValue) => {
                                if (snapshotValue) {
                                    newData.bid_amount = snapshotValue.price * 100;
                                    newData.lead = currentUser && snapshotValue.leadHash === currentUser.userHash;
                                }
                            }, {
                                channel: `au/${newData.auctionUuid}/l`,
                            }).then(() => {
                                this.auctions.push(newData);
                            }).catch((error) => {
                                if (this.$root.$options.methods.errsIsDefined()) {
                                    leErrs.meta.Code = error.code;
                                    leErrs.track(new Error("AuctionList addAuctions : " + error.message));
                                }
                            });
                        } else if (this.upcoming) {
                            // Auction upComing
                            this.auctions.push(newData);
                        }
                    });
                },
                patience() {
                    this.textLoader = "Je dis Patience. R2 va arriver et nous délivrer.";
                },
                removePlaceholder() {
                    const placeholder = window.document.getElementById(this.listId).closest('.moduleEnchere').querySelectorAll('.auctions_placeholder .placeholder-block');
                    if (typeof (placeholder)) {
                        for (let i = 0; i < placeholder.length; i++) {
                            placeholder[i].remove();
                        }
                        this.placeholderRemoved = true;
                    }
                },
                sortAuctions() {
                    if (this.useSort) {
                        switch (this.realSort) {
                            case "publicPrice-asc":
                                this.auctions.sort((a, b) => {
                                    if (parseInt(a.product_publicPrice, 10) < parseInt(b.product_publicPrice, 10)) {
                                        return -1;
                                    }
                                    if (parseInt(a.product_publicPrice, 10) > parseInt(b.product_publicPrice, 10)) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                break;
                            case "publicPrice-desc":
                                this.auctions.sort((a, b) => {
                                    if (parseInt(a.product_publicPrice, 10) > parseInt(b.product_publicPrice, 10)) {
                                        return -1;
                                    }
                                    if (parseInt(a.product_publicPrice, 10) < parseInt(b.product_publicPrice, 10)) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                break;
                            case "popularity":
                                this.auctions.sort((a, b) => {
                                    if (a.feedback_score > b.feedback_score) {
                                        return -1;
                                    }
                                    if (a.feedback_score < b.feedback_score) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                break;
                            case "end-desc":
                                this.auctions.sort((a, b) => {
                                    if (assAuction.dateToTimestamp(a.auction_end) > assAuction.dateToTimestamp(b.auction_end)) {
                                        return -1;
                                    }
                                    if (assAuction.dateToTimestamp(a.auction_end) < assAuction.dateToTimestamp(b.auction_end)) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                break;
                            default:
                                this.auctions.sort((a, b) => {
                                    if (assAuction.dateToTimestamp(a.auction_end) < assAuction.dateToTimestamp(b.auction_end)) {
                                        return -1;
                                    }
                                    if (assAuction.dateToTimestamp(a.auction_end) > assAuction.dateToTimestamp(b.auction_end)) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                break;
                        }
                    }
                },
                getAuctionData(uuid) {
                    let result;
                    this.auctions.forEach((auction, index) => {
                        if (auction.auctionUuid === uuid) {
                            result = index;
                            return;
                        }
                    });
                    return result;
                },
            },
            mapActions("AuctionListSettings", [
                'setAuctionsLength',
            ])),
        updated() {
            if (this.usePlaceholder && this.load === false && this.nbAuctionsRetrieved === this.auctions.length) {
                this.removePlaceholder();
            }
        },
    };
</script>
