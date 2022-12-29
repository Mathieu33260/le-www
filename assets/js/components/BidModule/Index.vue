<template>
    <div v-show="showBidModule" id="bidmodule" :class="[{'notRunning': isRunning == false, 'highlight': highlight, 'exceptionalAuction': !userCanBid}]">
        <template v-if="!userCanBid">
            <div v-if="!currentUserHash" class="contener">
                <div class="row">
                    <div class="col-xs-12">
                        <p class="title">Enchère exceptionnelle réservée aux membres Loisirs Enchères !</p>
                        <p>Créez votre compte gratuitement et tentez votre chance sans attendre.</p>
                        <button @click="openRegisterModal" class="btn btn-warning btn-circle btn-block">Accéder au formulaire d'inscription</button>
                        <div class="text-center">ou</div>
                        <a v-if="isApp" href="comloisirsencheres://login" rel="nofollow" class="btn btn-primary btn-circle btn-block">Connexion</a>
                        <button v-else @click="openLoginModal" class="btn btn-primary btn-circle btn-block">Connexion</button>
                    </div>
                </div>
            </div>
            <div v-else-if="!userInfos.hasEmailConfirmed" class="contener">
                <div class="row">
                    <div class="col-xs-12">
                        <p class="title">Enchère exceptionnelle réservée aux membres Loisirs Enchères !</p>
                        <user-register-status
                                :use-phone-validation="false"
                                :show-title="false"
                                :disabled-scroll="true"
                                item-class="col-xs-12"
                                phone-content="Astuce : soyez alerté du début et de la fin de cette enchère unique !"
                        ></user-register-status>
                    </div>
                </div>
            </div>
        </template>
        <div v-show="userCanBid">
            <div v-show="schema.product && !isPlanned" class="text-center productValueContainer">
                <span class="background-gris productValue" itemprop="offers" itemscope itemtype="http://schema.org/Offer">
                    Valeur : <span itemprop="price" :content="product.publicPrice">{{ product.publicPrice | formatAmount }}</span> <span itemprop="priceCurrency" content="EUR">€</span>
                </span>
            </div>
            <!-- Template futur auction -->
            <template v-if="isRunning == false && isFinished == false && isPlanned == false">
                <div class="time text-center">
                    <span v-cloak class="time-status">{{ auction.start | moment('dddd') }} {{ auction.start | moment('HH:mm') }}</span>
                </div>
                <p class="text-center text-muted text-uppercase" v-pre>Soyez prêts !</p>
                <div v-cloak class="row">
                    <div class="col-xs-10 col-xs-offset-1 nopadding-only btns">
                        <btn-redirect
                            :path="seeAllPath"
                        ></btn-redirect>
                    </div>
                </div>
            </template>

            <!-- Sub module for future auction to display and subscribe -->
            <bid-module-future
                    v-else-if="isPlanned"
                    :ea-site="eaSite"
                    :auction="auction"
                    :nbUsersNotificationNextAuction="nbUsersNotificationNextAuction"
            ></bid-module-future>

            <!-- Template current auction -->
            <template v-else-if="isRunning && isFinished == false">
                <div class="contener">
                    <div v-if="disconnect" class="alert alert-warning" id="alertDisconnect" v-cloak>
                        <div class="text-center">Déconnecté, merci de vérifier votre connexion à internet</div>
                    </div>
                    <div v-if="stopAuction" class="time text-center">Enchère annulée</div>
                    <div v-else class="time text-center" :class="{smaller:isPPUEnabled}">
                        <span class="time-countdown">
                            <span class="hours" v-text="hours"></span>:<span class="minutes" v-text="minutes"></span>:<span class="seconds" v-text="seconds"></span>
                        </span>
                        <div class="placeholder-block" v-if="showPlaceholder">
                            <div class="placeholder-container placeholder-bidmodule">
                                <div class="placeholder-animated">
                                    <div class="masker" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                    <div class="masker load" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row" id="currentAmountArea">
                        <div v-cloak class="prix col-xs-6 col-md-5 col-sm-5 nopadding-right-only-sm" :class="{smaller:hasCurrentBid && isPPUEnabled}">
                            <span v-if="hasCurrentBid && currentBid.amount" class="bid-amount" v-text="currentBid.amount/100"></span>
                            <span v-else class="bid-amount" v-text="0"></span> &euro;
                            <span v-if="displayAsterique" class="asterisque">*</span>
                            <div v-if="hasCurrentBid && isPPUEnabled" class="bid-info-ppu">
                                Soit <span class="ppu">{{ pricePerUserOnCurrentBid }} €</span> par personne
                            </div>
                        </div>
                        <div v-cloak class="nom col-xs-6 col-md-7 col-sm-7 nopadding-left-only-sm" id="currentAmountOwnerArea">
                            <div class="row">
                                <div v-if="hasCurrentBid" :class="[currentBid.isAutobid ? 'col-xs-10 nopadding-only' : 'col-xs-12']">
                                <span v-if="hasCurrentBid" :class="{'me': hasCurrentBid && notEmptyObject(userInfos) && userInfos.userHash == currentBid.userHash}" id="currentBidOwner">
                                    <template v-if="!currentBid.isStartPrice">{{ currentBid.firstName | capitalize }} {{ currentBid.lastName | uppercase }}.</template>
                                    <template v-else>{{ currentBid.firstName | capitalize }} <span class="icon-faq" data-container="#bidmodule" data-toggle="popover" data-placement="bottom" data-html="true" :data-content="startPriceText"></span></template>

                                    <template v-if="currentBid.showZipcode && currentBid.zipcode">
                                        ({{ currentBid.zipcode | trim }})
                                    </template>
                                    <span v-if="currentBid.nbAuctionPaid > 0 && currentBid.nbAuctionPaid < 5" class="popup-info-bidder-status" data-value='<b>Enchérisseur novice</b> : ils débutent mais ne vous fiez pas aux apparences'><a href="/c/programme-fidelite"> <img :src="$root.assetCdn+'/assets/gfx/rank1.png'" alt="rank1" /></a></span>
                                    <span v-else-if="currentBid.nbAuctionPaid >= 5 && currentBid.nbAuctionPaid < 10" class="popup-info-bidder-status" data-value="<b>Enchérisseur confirmé</b> : ils ont plus d'une enchère dans leur sac"><a href="/c/programme-fidelite"><img :src="$root.assetCdn+'/assets/gfx/rank2.png'" alt="rank2" /></a></span>
                                    <span v-else-if="currentBid.nbAuctionPaid >= 10 && currentBid.nbAuctionPaid < 20" class="popup-info-bidder-status" data-value='<b>Enchérisseur aguerri</b> : enchérir est devenu pour eux une seconde nature'><a href="/c/programme-fidelite"><img :src="$root.assetCdn+'/assets/gfx/rank3.png'" alt="rank3" /></a></span>
                                    <span v-else-if="currentBid.nbAuctionPaid >= 20 && currentBid.nbAuctionPaid < 50" class="popup-info-bidder-status" data-value='<b>Enchérisseur expert</b> : ils enchérissent plus vite que leur ombre'><a href="/c/programme-fidelite"><img :src="$root.assetCdn+'/assets/gfx/rank4.png'" alt="rank4" /></a></span>
                                    <span v-else-if="currentBid.nbAuctionPaid >= 50" class="popup-info-bidder-status" data-value='<b>Maître Enchérisseur</b> : aucune enchère ne leur résiste'><a href="/c/programme-fidelite"><img :src="$root.assetCdn+'/assets/gfx/rank5.png'" alt="rank5" /></a></span>
                                </span>
                                    <small id="currentBidTime" v-if="currentBid.date">le {{ currentBid.date | moment("DD/MM/YYYY") }}</small>
                                </div>
                                <div v-else-if="notEmptyObject(bids) == 0 && isPlanned === false" class="col-xs-12">
                                    <span id="currentBidOwner" class="noowner" v-pre>Personne n'a encore enchéri,<br class="hidden-xs hidden-sm hidden-md" /> profitez-en !</span>
                                </div>
                                <div v-if="useAutobid && (hasCurrentBid && currentBid.isAutobid)" class="col-xs-2 nopadding-left isAutobid">
                                    <span data-toggle="modal" data-target="#bidisauto" v-pre><i class="icon-faq"></i></span>
                                </div>
                            </div>
                        </div>
                        <div v-if="showPlaceholder" class="placeholder-block col-xs-12">
                            <div class="placeholder-container placeholder-bidmodule">
                                <div class="placeholder-animated">
                                    <div class="masker load" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                    <div class="masker load" aria-hidden="true"></div>
                                </div>
                                <div class="placeholder-animated">
                                    <div class="masker load" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                </div>
                                <div class="placeholder-animated">
                                    <div class="masker load" aria-hidden="true"></div>
                                    <div class="masker" aria-hidden="true"></div>
                                    <div class="masker load" aria-hidden="true"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row frais_de_dossier">
                    <div class="col-xs-10 col-xs-offset-1">
                        <p v-if="stopAuction">La vente de ce produit a été arrêtée.</p>
                        <p v-else class="text-center">
                            <em v-if="auction.cost !== 0">+ <span class="cost" v-text="cost/100"></span>€ de frais de dossier
                                <span v-if="hasCurrentBid || simulatedAmount !== 0">soit un total de
                                <span v-if="hasCurrentBid" class="total" v-text="(cost/100) + (currentBid.amount/100)"></span>
                                <span v-else class="total" v-text="simulatedAmount"></span> &euro;
                            </span>
                            </em>
                            <template v-if="useMiniBid && useMaxBid">
                                <br />La mise suivante doit être comprise entre {{ minBid }} et {{ maxBid }}€
                            </template>
                            <template v-else-if="useMiniBid && (currentBid.amount / 100) > 10">
                                <br />La mise minimum suivante est de {{ minBid }}€
                            </template>
                            <template v-else-if="useMaxBid">
                                <br />La mise maximum suivante est de {{ maxBid }}€
                            </template>
                        </p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="overbid row">
                            <div class="legend">Enchère rapide</div>
                            <div v-if="showPlaceholder" class="placeholder-block col-xs-12">
                                <div class="placeholder-container">
                                    <div class="placeholder-animated">
                                        <div class="masker load" aria-hidden="true"></div>
                                        <div class="masker" aria-hidden="true"></div>
                                        <div class="masker load" aria-hidden="true"></div>
                                        <div class="masker" aria-hidden="true"></div>
                                        <div class="masker load" aria-hidden="true"></div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="overBidVariation == 1" class="btInput col-xs-12" v-cloak>
                                <button v-for="(overBidAmount,index) in overBidAmounts" :key="index" class="btn btn-sm btn-circle btn-warning" data-bidType="overbid" :data-amount="overBidAmount.newAmount" v-text="overBidAmount.newAmount+' €'" v-on:click="onSubmitBid('overbid', overBidAmount.newAmount)"></button>
                            </div>
                            <div v-else-if="overBidVariation == 2" class="btInput col-xs-12" v-cloak>
                                <button v-for="(overBidAmount,index) in overBidAmounts" :key="index" class="btn btn-sm btn-circle btn-warning" data-bidType="overbid" :data-amount="'+'+overBidAmount.overbidAmount" v-text="'+'+overBidAmount.overbidAmount+' €'" v-on:click="onSubmitBid('overbid', '+'+overBidAmount.overbidAmount)"></button>
                            </div>
                        </div>
                    </div>
                    <transition name="fade">
                        <div v-if="errorPrevention.classicBid !== ''" class="col-xs-12">
                            <p class="text-danger col-xs-12"><i class="icon-info"></i> {{ errorPrevention.classicBid }}</p>
                        </div>
                    </transition>
                    <form v-show="useClassicBid" ref="formBid" role="form" class="bid-form form-inline col-xs-12" :class="{'active': bidFormActive}" method="post" id="formBid" :action="'/auction/'+auction.id+'/bid'" data-bidType="formBid" v-on:submit.prevent="onSubmitBid('formBid')">
                        <fieldset>
                            <legend>Enchérir directement</legend>
                            <div class="btInput col-xs-6 col-sm-12 col-md-6 col-lg-6">
                                <div class="input-group input-group-lg">
                                    <input type="hidden" name="abtestarr">
                                    <input v-model.lazy="valueClassicBid" v-debounce="delay" id="bidInput" placeholder="Votre enchère" title="Votre enchère" type="number" class="form-control" :min="minBid" name="bid" :max="auction.useMaxBid ? maxBid : ''">
                                    <span class="input-group-addon">€</span>
                                </div>
                            </div>
                            <div class="bt-encherir col-xs-6 col-sm-12 col-md-6 col-lg-6 nopadding-left-only-xs">
                                <button type="submit" class="btn btn-block btn-warning bid-btn" :class="btnClassicBidCssClass" v-bind:disabled="btnClassicBidDisabled">
                                    <img v-show="bidInProgress" :src="$root.assetCdn+'/assets/gfx/loader.gif?v=20170307'" width="20">
                                    <template v-if="!bidInProgress">J'enchéris !</template>
                                </button>
                            </div>
                        </fieldset>
                    </form>
                    <transition name="fade">
                        <div v-if="errorPrevention.autoBid !== ''" class="col-xs-12">
                            <p class="text-danger col-xs-12"><i class="icon-info"></i> {{ errorPrevention.autoBid }}</p>
                        </div>
                    </transition>
                    <form v-if="useAutobid" role="form" class="bid-form form-inline col-xs-12" :class="{'active': bidAutoFormActive}" method="post" id="formAutoBid" :action="'/auction/'+auction.id+'/bid'" data-bidType="formAutoBid" v-on:submit.prevent="onSubmitBid('formAutoBid')">
                        <fieldset>
                            <legend>Enchérir automatiquement <span><span class="text-nowrap" data-toggle="modal" data-target="#whatisautoauction">en savoir +</span></span></legend>
                            <div class="btInput col-xs-6 col-sm-12 col-md-6 col-lg-6">
                                <div class="input-group input-group-lg">
                                    <input type="hidden" name="abtestarr">
                                    <input v-model.lazy="valueAutoBid" v-debounce="delay" id="bidInputAuto" placeholder="Votre enchère" title="Votre enchère automatique" type="number" class="form-control" :min="minAuto" name="bid">
                                    <span class="input-group-addon">€</span>
                                </div>
                            </div>
                            <div class="bt-encherir col-xs-6 col-sm-12 col-md-6 col-lg-6 nopadding-left-only-xs">
                                <button type="submit" href="#" class="btn btn-block btn-primary autobid-btn" v-bind:disabled="bidAutoInProgress || errorPrevention.autoBid !== ''">
                                    <img v-show="bidAutoInProgress" :src="$root.assetCdn+'/assets/gfx/loader.gif?v=20170307'" width="20">
                                    <template v-if="!bidAutoInProgress">Enchère auto</template>
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </div>
                <div v-if="useAutobid && userAutoBids.length" class="row" id="autobiddefined">
                    <div class="col-xs-10 col-xs-offset-1 nopadding-only">
                        <div class="alert alert-success no-radius" role="alert">
                            <p class="small">Vous avez programmé une enchère automatique à hauteur de <span class="amount" v-if="userAutoBids.length" v-text="userAutoBids[0]['amount']/100"></span>€ sur cette enchère.<i class='icon-faq' data-toggle="tooltip" data-placement="bottom" title="Cette information est visible uniquement par vous"></i></p>
                        </div>
                    </div>
                </div>
                <div v-if="isBannerDisplayed" v-cloak>
                    <img src="//img.loisirsencheres.fr/loisirs/image/upload/v1536770704/banner/block_promo-vacance-hotel_3x.png" alt="Du 13 au 16 septembre -20% avec le code TRIP2018" class="img-responsive" />
                </div>
            </template>
            <!-- Template ended auction -->
            <template v-else-if="isFinished && isRunning == false">
                <div class="time text-center" v-pre>
                    <span class="time-status">Terminé</span>
                </div>
                <p class="text-center" v-pre>L'enchère est terminée.</p>
                <div v-if="!finalizationInProgress" v-cloak class="row">
                    <div class="winner col-xs-offset-1 col-xs-10 nopadding-only" v-if="notEmptyObject(winner)">
                        <p class="text-center" v-if="userIsLoser"><span class="name">{{ winner.name | capitalize }}</span> est le meilleur enchérisseur, bravo !<span class="userbider" v-if="currentUserHash && winner.userHash && winner.userHash != currentUserHash"> Vous n'avez pas remporté cette enchère.</span></p>
                        <p class="text-center current-user" v-else-if="hasReservePrice && reservePricePassed == false">Malheureusement, le prix de réserve n'a pas été atteint. Vous aurez plus de chance la prochaine fois !</p>
                        <p class="text-center current-user" v-else-if="currentUserHash && winner.userHash == currentUserHash && ((hasReservePrice && reservePricePassed == true) || !hasReservePrice)">Adjugé, l'enchère est à vous !</p>
                        <div>
                            <div class="background-bleu">
                                <img :src="$root.assetCdn+'/assets/gfx/pictos/auction-ended-winner.jpg?v=20170529'" alt="#" />
                                <span><b class="price" v-text="winner.price ? winner.price / 100 + ' €' : winner.auction.amount / 100 + ' €'"></b> | <b class="name">{{ winner.name | capitalize }}</b><br />
                                <small>le <span class='date'>{{ winner.date ? winner.date : winner.winningBidDate | moment("DD/MM/YYYY") }}</span> à <span class='heure'>{{ winner.date ? winner.date : winner.winningBidDate | moment("HH:mm:ss") }}</span></small>
                            </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="finalizationInProgress && notEmptyObject(winnerData)" class="row">
                    <p class="col-xs-8 col-xs-offset-2 nopadding-only text-center">Récupération des données...</p>
                </div>
                <div v-else-if="finalizationInProgress" class="row" >
                    <p class="col-xs-8 col-xs-offset-2 nopadding-only text-center">Finalisation de la vente...</p>
                </div>
                <div class="contener" v-if="newProductId != '' && newProductId != product.id">
                    <div class="time text-center">
                        <span class="newOffer">Cette vente a été renouvelée</span>
                    </div>
                </div>
                <div v-if="!finalizationInProgress" v-cloak class="row">
                    <div class="col-xs-10 col-xs-offset-1 nopadding-only btns">
                        <template v-if="showBtnPayment()">
                            <a v-if="currentPaymentData.link" :href="currentPaymentData.link" id="goPaiement" class="btn btn-primary btn-block text-center no-radius with-icon">
                                <span>Accéder au paiement</span>
                                <i class="icon-flash-right hidden-sm"></i>
                            </a>
                        </template>
                        <template v-else>
                            <a v-if="hasNextAuction" class="btn btn-warning btn-block with-icon" id="goNextAuction" :href="'/product/'+product.id">
                                <span>Remporterez-vous la prochaine ?</span>
                                <i class="icon-flash-right hidden-sm" v-pre></i>
                            </a>
                            <a v-else-if="newProductId != '' && newProductId != auction.product" class="btn btn-warning btn-block text-center no-radius with-icon" id="showAllAuctions" :href="newProductId != '' ? '/product/'+newProductId : seeAllPath">
                                <span>Découvrir la nouvelle offre</span>
                                <i class="icon-flash-right hidden-sm" v-pre></i>
                            </a>
                            <btn-redirect
                                v-else
                                :path="seeAllPath"
                            ></btn-redirect>
                        </template>
                    </div>
                </div>
            </template>
            <div v-if="isBannerDisplayed" v-cloak>
                <img src="//img.loisirsencheres.fr/loisirs/image/upload/v1540556481/banner/bid-module-26-oct.png" alt="-15% avec le code FLY2018" class="img-responsive" />
            </div>
            <encart-bid-module
                    :encart="encartBidmodule"
                    :is-app="isApp"
                    :ea-site="eaSite"
            />
            <template>
                <bid-history-list v-if="version === 'chat'" :auction-date="auction.start"></bid-history-list>
                <bid-history v-else-if="notEmptyObject(bids) && notEmptyObject(bids) > 1" :startPriceText="startPriceText"></bid-history>
            </template>
            <template v-if="isRunning && isFinished == false">
                <div :class="reservePriceStatusClass" id="reservePriceStatus">
                    <div class="col-xs-10 col-xs-offset-1 nopadding-only-lg">
                        <div class="text-center" id="reservePriceFees">
                            <template v-if="auction.cost !== 0">
                                Les frais de dossier sur cette enchère s'élèvent à {{ auction.cost/100 }}€.
                                <br v-if="hasReservePrice && reservePricePassed === false">
                            </template>
                            <span id="reservePrice" v-if="hasReservePrice && reservePricePassed === false">
                                <span class="asterisque" v-if="notEmptyObject(userInfos) && hasCurrentBid && userInfos.userHash === currentBid.userHash">*</span>
                                Un prix de réserve est appliqué sur cette enchère. <span data-toggle="modal" data-target="#reservicepriceModal" class="icon-info">
                            </span>
                        </span>
                        </div>
                    </div>
                    <div class="col-xs-12 placeholder-block" v-if="showPlaceholder">
                        <div class="placeholder-container placeholder-bidmodule">
                            <div class="placeholder-animated">
                                <div class="masker" aria-hidden="true"></div>
                                <div class="masker load" aria-hidden="true"></div>
                                <div class="masker" aria-hidden="true"></div>
                            </div>
                            <div class="placeholder-animated">
                                <div class="masker" aria-hidden="true"></div>
                                <div class="masker load" aria-hidden="true"></div>
                                <div class="masker" aria-hidden="true"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <bid-module-serious-level
                    v-if="seriousLevel"
                    :activate-the-flow="activeTheSeriousFlow"
                    @closeModal="closeSeriousFlow"
                    @openedModal="openSeriousFlow"
                    @flowComplete="completeSeriousFlow"
            ></bid-module-serious-level>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { mapGetters, mapActions } from "vuex"
    import VModal from 'vue-js-modal';
    import debounce from 'v-debounce';
    import http from '../../services/http';
    import UserRegisterStatus from '../User/UserRegisterStatus.vue';
    import BidModuleSeriousLevel from '../Auction/BidModuleSeriousLevel.vue';
    import { winModal, leelooModal, bindAuction } from "../../function/ass.auctionManager";
    import 'url-search-params-polyfill';
    import EncartBidModule from '../Auction/EncartBidModule.vue';
    import BidModuleFuture from "./Future/Index.vue";
    import BtnRedirect from "./BtnRedirect.vue";
    import BidHistoryList from './BidHistory/V3.vue';
    import BidHistory from './BidHistory/V2.vue';

    Vue.use(VModal);

    const moment = require('moment')
    require('moment/locale/fr')

    export default {
        name: "BidModule",
        components: {
            BidModuleSeriousLevel,
            UserRegisterStatus,
            EncartBidModule,
            BidModuleFuture,
            BidHistoryList,
            BidHistory,
            BtnRedirect,
        },
        props: {
            version: {
                type: String,
                required: false,
                default: '',
            },
            abTestVariation: {
                type: String,
                required: false,
                default: "",
            },
            schema: Object,
            product: Object,
            auction: {
                type: Object,
                required: true,
                default() {
                    return {};
                },
            },
            /** Number of users subscribed to the auction notification. Current logged user is not taken into the count */
            nbUsersNotificationNextAuction: {
                type: Number,
                default: 0,
            },
            running: Boolean,
            finished: Boolean,
            /** Boolean to tell if there is a next auction when none are running */
            planned: Boolean,
            week: Array,
            hours: String,
            minutes: String,
            seconds: String,
            cost: Number,
            overBidVariation: Number, // 1 (Valeur direct) or 2 (Surenchère)
            overBidDefault: {
                type: Array,
                required: false,
                default() {
                    return new Array();
                },
            },
            classicBid: {
                type: Boolean,
                required: false,
                default: true,
            },
            userAutoBidsInit: {
                type: Array,
                required: false,
                default() {
                    return new Array();
                },
            },
            isBannerDisplayed: {
                type: Boolean,
                required: false,
                default: false,
            },
            winnerData: {
                type: Object,
                required: false,
                default() {
                    return {};
                },
            },
            paymentData: {
                type: Object,
                required: false,
                default() {
                    return {};
                },
            },
            isApp: {
                type: Boolean,
                required: true,
                default: false,
            },
            hasNextAuction: {
                type: Boolean,
                required: false,
                default: false,
            },
            newProductId: {
                type: String,
                required: false,
                default: '',
            },
            bidsHistory: {
                type: Array,
                required: false,
                default() {
                    return new Array();
                },
            },
            userCanBeAlerted: {
                type: Boolean,
                required: false,
                default: false,
            },
            phoneMandatory: {
                type: Boolean,
                required: true,
            },
            reservePricePassedStatus: {
                type: Boolean,
                required: true,
            },
            finalizationInProgressStatus: {
                type: Boolean,
                required: false,
                default: false,
            },
            userHash: String,
            activeSeriousFlow: {
                type: Boolean,
                required: false,
                default: false,
            },
            requiredConfirmation: {
                type: Boolean,
                required: false,
                default: false,
            },
            bypassConfirmFeeDefault: {
                type: Boolean,
                required: false,
                default: false,
            },
            encartBidmodule: {
                type: [Object, Boolean],
                required: false,
                default: () => false,
            },
            // Eulerian site key (default if omitted is prod value)
            eaSite: {
                type: String,
                require: false,
                default: 'loisirs-encheres-com',
            },
            // Path href for btn 'Voir toute les enchères'
            seeAllPath: {
                type: String,
                require: true,
            },
        },
        data() {
            /**
             * We use auction.useMiniBid only to initialize the component because it's
             * a props and it's more accurate to use a data. Also, auction.useMiniBid isn't
             * up-to-date with firebase data.
             */
            return {
                useAutobid: this.auction.useAutobid,
                useMiniBid: this.auction.useMiniBid,
                useMaxBid: this.auction.useMaxBid,
                hasReservePrice: this.auction.hasReservePrice,
                stopAuction: false,
                minBid: this.auction.useMiniBid ? parseInt(this.auction.miniBidIncr, 10) : 1,
                minAuto: this.auction.useMiniBid ? parseInt(this.auction.miniBidIncr, 10) + 1 : 1,
                maxBid: this.auction.useMaxBid ? this.auction.maxBidIncr : null,
                minBidDelta: this.auction.miniBidIncr !== '' ? this.auction.miniBidIncr : 1,
                maxBidDelta: this.auction.maxBidIncr !== '' ? this.auction.maxBidIncr : null,
                showPlaceholder: true,
                disconnect: false,
                userIsLoser: false,
                highlight: false,
                isPlanned: this.planned,
                winner: this.winnerData,
                bidInProgress: false,
                bidAutoInProgress: false,
                bidFormActive: false,
                bidAutoFormActive: false,
                valueClassicBid: null, // Used by want cookie
                valueAutoBid: null, // Used by want cookie
                reservePricePassed: this.reservePricePassedStatus,
                userAutoBids: this.userAutoBidsInit,
                currentUserHash: this.userHash,
                currentPaymentData: this.paymentData,
                finalizationInProgress: this.finalizationInProgressStatus,
                seriousLevel: this.activeSeriousFlow,
                activeTheSeriousFlow: false,
                userIsSerious: false,
                useClassicBid: this.classicBid,
                overBidAmounts: this.overBidDefault,
                userMustBeConfirmed: this.requiredConfirmation,
                bypassConfirmFee: this.bypassConfirmFeeDefault,
                simulatedAmount: 0,
                hasCurrentBid: false,
                miniBidUntil: this.auction.miniBidUntil,
                maxBidUntil: this.auction.maxBidUntil,
                errorPrevention: {
                    classicBid: '',
                    autoBid: '',
                },
                delay: 500, // used by debounce
                displayPriceRangeDetails: false,
                lessThan2MinutesRemaining: false,
            }
        },
        computed: Object.assign({
                userHasFullInfos() {
                    return typeof this.userInfos.hasPhoneConfirmed !== 'undefined' && typeof this.userInfos.hasCreditCardConfirmed !== 'undefined';
                },
                startPriceText() {
                    return "<div style='min-width: 200px;'><h4>Nouveauté :</h4>Ce prix de départ a été évalué pour optimiser vos chances de gagner. À vous de jouer !<br/><br>"
                        + "<a href='/faq/encherir-sur-une-offre-115001067509'>En savoir plus ...</a></div>";
                },
                userCanBid() {
                    return !this.userMustBeConfirmed || (
                        this.isRunning === false && this.isFinished === false) || (
                        this.isFinished && this.isRunning === false) || this.userInfos.hasEmailConfirmed;
                },
                btnClassicBidDisabled() {
                    return this.bidInProgress || this.errorPrevention.classicBid !== '';
                },
                btnClassicBidCssClass() {
                    const isDisable = this.btnClassicBidDisabled;
                    return {
                        'animationRipple': !isDisable && this.highlight === false,
                        'animationBuzz': !isDisable && this.highlight,
                    };
                },
                displayAsterique() {
                    return this.hasCurrentBid && this.notEmptyObject(this.userInfos) && this.settings.reservePricePassed === false && this.userInfos.userHash === this.currentBid.userHash;
                },
                isPPUEnabled() {
                    return ('nbPassenger' in this.product && this.product.nbPassenger > 1);
                },
                pricePerUserOnCurrentBid() {
                    return this.pricePerUser();
                },
                isPriceRangeBlockVisible() {
                    return this.isRunning
                        && this.auction.priceRange !== null
                        && !this.reservePricePassed
                        && this.lessThan2MinutesRemaining
                        && this.isAuctionInUserCurrentAuctions()
                        && this.userInfos.auCurrent[this.auction.uuid].hasBid === "1";
                },
                reservePriceStatusClass() {
                    let baseClass = "row";
                    if (Array.isArray(this.bids)) {
                        baseClass += " border-reservce-price"
                    }
                    return baseClass;
                },
                priceRangeContainerClasses() {
                    return 'btn-price-range ' + (this.displayPriceRangeDetails ? 'btn btn-primary btn-block btn-circle with-icon' : 'btn btn-default btn-block btn-circle');
                },
                showBidModule() {
                    return true;
                    // return this.paneActive === 'bid' || (!this.product.buyNow && this.paneActive === '');
                },
            },
            mapGetters('BidAndPurchase', [
                'paneActive',
            ]),
            mapGetters('BidModule', {
                'isFinished': 'isFinished',
                'isRunning': 'isRunning',
            }),
            mapGetters('BidsDatas', {
                bids: 'bids',
                currentBid: 'currentBid',
                endAuction: 'endAuction',
            }),
            mapGetters('UserDatas', {
                userInfos: 'userInfos',
            }),
            mapGetters('User', {
                connected: 'connected',
            }),
            mapGetters('Auction', {
                settings: 'settings',
            })),
        watch: {
            bids() {
                this.$nextTick(() => {
                    if (this.bids.some(bid => bid.isStartPrice)) {
                        // we need to rescan popover on each bids, because vue.js rebuild the dom
                        $('#bidmodule').find('[data-toggle="popover"]').popover();
                    }
                });
            },
            isPriceRangeBlockVisible(newVal, oldVal) {
                if (newVal && !oldVal) {
                    this.auctionTracking({
                        "auctionId": this.auction.id,
                        "key": "presentInTheLast2Minutes",
                        "value": "sawPriceRange",
                    });
                }
            },
            lessThan2MinutesRemaining(newVal, oldVal) {
                if (newVal && !oldVal) {
                    this.trackPresentInTheLast2Minutes();
                }
            },
            currentBid(val) {
                const amount = val.amount / 100;

                if (this.notEmptyObject(val)) {
                    this.hasCurrentBid = true;
                    $('.popup-info-bidder-status').each(function() {
                        bindPopUpStatus(this);
                    });
                }
                if (amount >= 1) {
                    this.calcMinBid(amount);
                    this.calcMaxBid(amount);
                }

                this.showPlaceholder = false;
            },
            endAuction(val) {
                if (this.notEmptyObject(this.winnerData)) {
                    val = { ...this.winnerData, ...val }; // The secondary argument is priority
                }
                if (val) {
                    if (val.stopAuction) {
                        this.stopAuction = val.stopAuction;
                    }

                    // Force Update - Useful if a user arrives during the finalization of the auction
                    this.setFinished(true);
                    this.setRunning(false);

                    let toTrack = null;
                    if (!val.stopAuction) {
                        if (parseInt(userId, 10) !== 0 && parseInt(userId, 10) === val.user.id) { // This user is the winner
                            this.userIsLoser = false;
                            toTrack = "winner";
                            this.userWinner(val);
                        } else { // This user is not winner
                            toTrack = (val.looser && val.looser.id === parseInt(userId, 10)) ? "lealoo" : "looser";
                            this.userIsLoser = true;
                            this.userLoser(val);
                        }
                    }
                    if (this.currentUserHash && toTrack !== null) {
                        this.auctionTracking({
                            "auctionId": this.auction.id,
                            "key": "sawEndAuction",
                            "value": toTrack,
                        });
                    }
                }
            },
            stopAuction(val) {
                if (val === true) {
                    // Change value in store
                    this.setFinished(true);
                    this.setRunning(false);
                }
            },
            settings(val) {
                if (this.notEmptyObject(val)) {
                    this.reservePricePassed = val.reservePricePassed;
                    this.useAutobid = val.useAutobid;
                    this.seriousLevel = val.needCreditCard && val.needPhoneValidation;
                    this.useClassicBid = !val.hiddenBidInput;
                    this.overBidAmounts = val.quickOverbidData;
                    this.userMustBeConfirmed = val.needMailValidation;
                    this.bypassConfirmFee = val.bypassConfirmFee;
                    this.miniBidUntil = val.miniBidUntil;
                    this.maxBidUntil = val.maxBidUntil;
                    // Update maxBid
                    this.useMaxBid = val.useMaxBid;
                    this.maxBidDelta = val.useMaxBid ? val.maxBidIncr : null;
                    this.calcMaxBid(this.hasCurrentBid ? this.currentBid.amount / 100 : 0);
                    // Update minBid
                    this.useMiniBid = val.useMiniBid;
                    const minBidDefault = this.hasCurrentBid ? this.currentBid.amount / 100 : 1;
                    if (val.useMiniBid) {
                        this.minBidDelta = val.miniBidIncr;
                        this.calcMinBid(minBidDefault);
                    } else {
                        this.minBidDelta = minBidDefault;
                        this.calcMinBid(1);
                    }
                }
            },
            valueClassicBid(val) {
                this.setErrorPrevention('classicBid', val);
                this.calculateBidAndCost(val);
            },
            valueAutoBid(val) {
                this.setErrorPrevention('autoBid', val);
                this.calculateBidAndCost(val);
            },
            userInfos() {
                this.wantBid();
            },
        },
        directives: {
            debounce,
        },
        created() {
            this.setSchema(this.schema);
        },
        mounted() {
            // Set data to store
            this.$store.dispatch("Auction/getSettings", this.auction.uuid);
            this.$store.dispatch("BidsDatas/getEndAuction", this.auction.uuid);
            this.setFinished(this.finished);
            this.setRunning(this.running);

            // Get current bid
            if (!this.isFinished) {
                this.getCurrentBid();
            }

            // Get bidsschema
            if (!this.isFinished) {
                this.getBids();
            } else {
                this.$store.dispatch("BidsDatas/setBidsFromApi", this.bidsHistory);
            }
        },
        filters: {
            formatAmount(str) {
                return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(parseInt(str, 10))
            },
        },
        methods: Object.assign({
                trackPresentInTheLast2Minutes() {
                    if (this.notEmptyObject(this.userInfos)) {
                        if (this.isPriceRangeBlockVisible) {
                            this.auctionTracking({
                                "auctionId": this.auction.id,
                                "key": "presentInTheLast2Minutes",
                                "value": "sawPriceRange",
                            });
                        } else {
                            this.auctionTracking({
                                "auctionId": this.auction.id,
                                "key": "presentInTheLast2Minutes",
                                "value": "sawNothing",
                            });
                        }
                    } else {
                        // Firebase isn't init, wait.
                        const self = this;
                        setTimeout(() => {
                            self.trackPresentInTheLast2Minutes();
                        }, 1000);
                    }
                },
                userWinner(data) {
                    this.reservePricePassed = data.reservePricePassed;
                    this.currentPaymentData.link = this.isApp ? data.paymentLinkMobile : '/' + data.paymentLink;
                    data.auction.cost = this.cost; /* eslint no-param-reassign: 0 */

                    this.winner = {
                        price: data.auction.amount,
                        date: getDateFromString(data.winningBidDate),
                        userHash: data.user.userHash,
                        auction: {
                            status: this.notEmptyObject(this.winnerData) ? this.winnerData.auction.status : 'pending',
                        },
                    };

                    let name = data.user.name; /* eslint prefer-destructuring: 0 */
                    if (getWidth() >= 1200 && name.length > 17) {
                        name = ucFirst(name.slice(0, 14) + '...');
                    } else if (getWidth() >= 992 && name.length > 12) {
                        name = ucFirst(name.slice(0, 9) + '...');
                    } else if (getWidth() < 992 && window.innerWidth > 768 && name.length > 6) {
                        name = ucFirst(name.slice(0, 3) + '...');
                    }

                    this.winner.name = name; /* eslint prefer-destructuring: 1 */

                    if (data.auction.payment) {
                        http.get(urls['payment.page'].replace('paymentId', data.auction.payment) + '?nxcbEligibilite=1').then((response) => {
                            const result = response.data;

                            this.finalizationInProgress = false;

                            if (result.status === 'pending') {
                                winModal(result, data.auction, this.product.publicPrice, data.user.name, this.currentPaymentData.link);
                            }
                        }).catch((error) => {
                            console.log(error);
                        });
                    } else {
                        this.finalizationInProgress = false;
                    }
                },
                userLoser (data) {
                    const self = this;
                    const leeloo = !!(data.looser && data.looser.id === parseInt(userId, 10));

                    if (leeloo) {
                        // User is Leeloo
                        this.userIsLoser = false;
                    }

                    if (typeof data.looser !== 'undefined' || data.user.id !== '') {
                        this.winner = {
                            price: data.auction.amount,
                            name: typeof data.looser !== 'undefined' ? data.looser.name : data.user.name,
                            date: getDateFromString(data.winningBidDate),
                        };
                        this.winner.userHash = data.user.userHash;
                    }

                    // Check if product has an new auction
                    http.get('/product/' + self.auction.product + '?data=hasCurrentBid').then((response) => {
                        const result = response.data;

                        self.hasNextAuction = result.result;
                        self.finalizationInProgress = false;

                        if (leeloo) {
                            leelooModal(result);
                        }
                    }).catch((error) => {
                        // handle error
                        console.log(error);
                    });

                    ga('send', 'event', 'auction_details', 'lost', '', { 'nonInteraction': 1 });
                },
                showBtnPayment () {
                    // Test payment status
                    const firstTest = this.notEmptyObject(this.winner) && (this.winner.auction && this.winner.auction.status !== 'complete' && this.winner.auction.status !== 'failed');
                    // Test if user is the winner
                    const secondTest = this.currentUserHash && this.winner && this.winner.userHash === this.currentUserHash && this.notEmptyObject(this.currentPaymentData);
                    return firstTest && secondTest;
                },
                getBids() {
                    if (this.version === 'chat') {
                        this.$store.dispatch("BidsDatas/getFormattedBids", this.auction.uuid);
                    } else {
                        this.$store.dispatch('BidsDatas/getBids', this.auction.uuid);
                    }
                    return this;
                },
                configBidConfirm(newBid) {
                    const modal = $('#confirmBid');
                    this.showGeneralLoader();
                    // Init modal
                    if (this.hasReservePrice) {
                        $(modal).find('.reservePrice').addClass('hide');
                    }
                    if ($(modal).find('.confirm').hasClass('hide') === false) {
                        $(modal).find('.confirm').addClass('hide');
                    }
                    if ($(modal).find('.form').hasClass('hide')) {
                        $(modal).find('.form').removeClass('hide');
                    }

                    $(modal).find('.newbid').html(newBid);
                    if (this.isPPUEnabled) {
                        const price = this.pricePerUser(newBid * 100)
                        $(modal).find('.pricePerUser').html(price + "€");
                    }
                    this.calculateBidAndCost(newBid);
                    $(modal).find('.totalBidCost').html(this.simulatedAmount);
                    showOrHidePhoneNumber($('#sendsms'));

                    if (this.bypassConfirmFee) {
                        // Force submit form bid without show confirm modal
                        $('#engagement').prop('checked', 1);
                        Vue.nextTick().then(() => {
                            $('#confirmBidSteps > button').click();
                        });
                    } else {
                        this.hideGeneralLoader();
                        showBidConfirm(modal);
                    }
                },
                getCurrentBid() {
                    const self = this;
                    this.$store.dispatch("BidsDatas/getCurrentBid", this.auction.uuid).then(() => {
                        bindAuction(this.auction, this, 0);
                    });
                },
                getDateFromString(str) {
                    return getDateFromString(str);
                },
                calculateBidAndCost(val) {
                    let bet = val || 0;
                    if (bet === 0) {
                        if (this.valueClassicBid !== '') {
                            bet = this.valueClassicBid;
                        } else if (this.valueAutoBid !== '') {
                            bet = this.valueAutoBid;
                        }
                    }
                    this.simulatedAmount = bet === null ? 0 : parseInt(bet, 10) + parseInt(this.cost / 100, 10);
                },
                overBid(amountStr) {
                    // Action button overbid
                    const addAmount = parseInt(amountStr, 10);
                    const amount = this.overBid === 1 ? addAmount : (this.hasCurrentBid ? this.currentBid.amount / 100 : 0) + addAmount;
                    this.valueClassicBid = amount;
                    this.submitFormBid('overbid');
                },
                submitFormBid(bidType) {
                    // classic bid
                    this.bidFormActive = true;
                    this.bidAutoFormActive = false;
                    this.bid({
                        'formId': '#formBid',
                        'amount': this.valueClassicBid,
                    }, bidType);
                },
                submitFormAutoBid(bidType) {
                    // auto bid
                    this.bidAutoFormActive = true;
                    this.bidFormActive = false;
                    this.bid({
                        'formId': '#formAutoBid',
                        'amount': this.valueAutoBid,
                    }, bidType);
                },
                onSubmitBid(bidType, amount) {
                    if (this.isAllowedToActiveSeriousFlow(amount)) {
                        this.activeTheSeriousFlow = true;
                    } else {
                        // bid actions
                        if (bidType === 'overbid') {
                            this.overBid(amount)
                        } else if (bidType === 'formBid') {
                            this.submitFormBid('formBid');
                        } else if (bidType === 'formAutoBid') {
                            this.submitFormAutoBid('formAutoBid');
                        } else {
                            leErrs.meta.bidType = bidType;
                            leErrs.track(new Error("Not found 'bidType' " + bidType + " on bidModule onSubmitBid"));
                        }
                    }
                },
                isAllowedToActiveSeriousFlow(amount) {
                    return this.seriousLevel
                        && this.notEmptyObject(this.userInfos)
                        && !this.userIsSerious
                        && this.userHasFullInfos
                        && (this.settings.amountSeriousLevel && amount > this.settings.amountSeriousLevel);
                },
                preBid(event) {
                    // Send bid for validation
                    const newBid = parseInt(event.amount, 10);
                    this.showGeneralLoader();
                    abtestarr.screenHeight = screen.height;
                    abtestarr.screenWidth = window.innerWidth;
                    this.configBidConfirm(newBid);
                },
                bid: function bid(event, bidType) {
                    const form = event.formId;
                    const actualBid = this.hasCurrentBid ? this.currentBid.amount / 100 : 0;
                    const newBid = parseInt(event.amount, 10);

                    if (newBid > actualBid && this.isRunning) {
                        const remainingHours = parseInt($($('.partieDroite .time-countdown span')[0]).text(), 10);
                        const remainingMinutes = parseInt($($('.partieDroite .time-countdown span')[1]).text(), 10);
                        if ((remainingHours === 0 && remainingMinutes < 5) || !this.userCanBeAlerted) {
                            $('#confirmBid').find('.formConfirmBid .sendsms').addClass('hide');
                        }
                        if (remainingHours === 0 && remainingMinutes < 10) {
                            this.setAutomaticallyShowModal(false);
                        }

                        if (this.notEmptyObject(this.userInfos)) { // Wantbid also needs the data of the user
                            if (event.formId === '#formAutoBid') {
                                this.bidAutoInProgress = true;
                            } else {
                                this.bidInProgress = true;
                            }

                            if (this.useAutobid) {
                                if (event.formId === '#formAutoBid') {
                                    this.showGeneralLoader();
                                    // Check if user has valide phone number
                                    http.get(urls['user.profile'], {
                                        params: { phoneValidate: 1 },
                                    }).then((response) => {
                                        const data = response.data;
                                        if (!this.isApp && abtestarr.cookieBid === 1) {
                                            let firstName = this.userInfos.firstName;
                                            firstName = firstName[0].toUpperCase() + firstName.slice(1);
                                            $('#confirmBid').find('.modal-title').text("Bienvenue " + firstName + ', à vous de jouer !');
                                            $('#confirmBid').find('.icon-faq').addClass('text-warning').removeClass('text-info');
                                        } else {
                                            $('#confirmBid').find('.modal-title').text("Confirmez votre enchère automatique");
                                        }
                                        $('#confirmBid').find('.moment').text("maximum");
                                        this.hideGeneralLoader();
                                        if (data.isValide) {
                                            this.configBidConfirm(newBid);
                                        } else {
                                            $('#confirmBidAuto').find('.amount').text(newBid);
                                            showModal('#confirmBidAuto');
                                        }
                                    }).catch((response) => {
                                        console.log('Error Check if user has valide phone number', response);
                                        $.each(response, (index, value) => {
                                            leErrs.meta[index] = value;
                                        });
                                        leErrs.track(new Error("Can't phoneValidate"));
                                        alert("Désolé, une erreur est survenue, vous pouvez tenter d'enchérir normalement.\nSi le problème persiste merci de nous contacter");
                                        this.hideGeneralLoader();
                                    });
                                } else {
                                    if (!this.isApp) {
                                        this.showGeneralLoader();
                                        let firstName = this.userInfos.firstName;
                                        firstName = firstName[0].toUpperCase() + firstName.slice(1);
                                        $('#confirmBid').find('.modal-title').text("Bienvenue " + firstName + ', à vous de jouer !');
                                        $('#confirmBid').find('.modal-content').removeClass('background-bleu-claire');
                                        $('#confirmBid').find('.modal-body b').addClass('text-warning');
                                        $('#confirmBid').find('.btn-primary').addClass('btn-warning').removeClass('btn-primary');
                                        $('#confirmBid').find('.icon-faq').addClass('text-warning').removeClass('text-info');
                                        $('#confirmBid').find('.moment').text("actuelle");
                                        this.hideGeneralLoader();
                                    } else {
                                        $('#confirmBid').find('.modal-title').text("Confirmez votre enchère");
                                        $('#confirmBid').find('.moment').text("actuelle");
                                    }
                                    this.preBid(event);
                                }
                            } else {
                                if (!this.isApp && abtestarr.cookieBid === 1) {
                                    let firstName = this.userInfos.firstName;
                                    firstName = firstName[0].toUpperCase() + firstName.slice(1);
                                    $('#confirmBid').find('.modal-title').text("Bienvenue " + firstName + ', à vous de jouer !');
                                    $('#confirmBid').find('.modal-content').removeClass('background-bleu-claire');
                                    $('#confirmBid').find('.modal-body b').addClass('text-warning');
                                    $('#confirmBid').find('.btn-primary').addClass('btn-warning').removeClass('btn-primary');
                                    $('#confirmBid').find('.icon-faq').addClass('text-warning').removeClass('text-info');
                                } else {
                                    $('#confirmBid').find('.modal-title').text("Confirmez votre enchère");
                                }
                                $('#confirmBid').find('.moment').text("actuelle");
                                this.preBid(event);
                            }

                            if (event.formId === '#formAutoBid') {
                                this.bidAutoInProgress = false;
                            } else {
                                this.bidInProgress = false;
                            }
                        } else if (bidType !== 'wantBid') {
                            const inThreeMinutes = new Date(new Date().getTime() + 3 * 60 * 1000); // 3 minutes
                            Cookies.set('want-bid-' + this.auction.id, newBid, { expires: inThreeMinutes });
                            Cookies.set('want-form-' + this.auction.id, form, { expires: inThreeMinutes });
                            Cookies.set('want-product-' + this.auction.product, this.auction.id, { expires: inThreeMinutes });
                            this.openLoginOrRegisterModal(bidType);
                        }
                    } else {
                        errorModal(this.minBid);
                    }

                    if (this.phoneMandatory) {
                        $('#labelPhone').removeClass('hide');
                        $('#sendsms').prop('checked', true);
                    }
                },
                wantBid() {
                    const makeProductAuctionId = Cookies.get('want-product-' + this.auction.product);
                    if (makeProductAuctionId) {
                        const self = this;
                        setTimeout(() => {
                            const makeBidAmount = Cookies.get('want-bid-' + self.auction.id);
                            const makeFormType = Cookies.get('want-form-' + self.auction.id);
                            Cookies.remove('want-bid-' + self.auction.id);
                            Cookies.remove('want-form-' + self.auction.id);
                            Cookies.remove('want-product-' + self.auction.product);
                            if (parseInt(makeProductAuctionId, 10) === self.auction.id) {
                                abtestarr.cookieBid = 1;
                                if (makeFormType === '#formBid') {
                                    self.valueClassicBid = makeBidAmount;
                                    self.submitFormBid('wantBid');
                                } else if (makeFormType === '#formAutoBid') {
                                    self.valueAutoBid = makeBidAmount;
                                    self.submitFormAutoBid('formAutoBid');
                                }
                            } else {
                                $('#theAuctionEnded').modal('show');
                            }
                        }, 800);
                    }
                },
                closeSeriousFlow() {
                    // The serious flow has closed by the user
                    this.activeTheSeriousFlow = false;
                },
                openSeriousFlow() {
                    // Change the active status when a modal is opened
                    this.activeTheSeriousFlow = true;
                },
                completeSeriousFlow() {
                    // The serious flow is complete
                    this.userIsSerious = true;
                    this.activeTheSeriousFlow = false;
                },
                calcMaxBid(amount) {
                    if (this.useMaxBid) {
                        this.maxBid = amount + parseInt(this.maxBidDelta, 10);
                    } else {
                        this.maxBid = null;
                    }
                },
                calcMinBid(amount) {
                    if (amount !== '') {
                        this.minBid = amount === 1 ? parseInt(this.minBidDelta, 10) : amount + parseInt(this.minBidDelta, 10);
                        this.minAuto = this.hasCurrentBid ? this.minBid + 1 : this.minBid;
                    }
                },
                setErrorPrevention(formType, bidAmount) {
                    // minimum
                    let minError = '';
                    if (formType === 'classicBid' && bidAmount !== '' && bidAmount < this.minBid) {
                        minError = "Votre mise minimum doit-être de " + this.minBid + "€";
                    }
                    if (formType === 'autoBid' && bidAmount !== '' && bidAmount < this.minAuto) {
                        minError = "Votre mise minimum doit-être de " + this.minAuto + "€";
                    }
                    this.errorPrevention[formType] = minError;

                    if (minError === '' && this.useMaxBid) {
                        // maximum
                        let maxError = '';
                        if (formType === 'classicBid' && bidAmount !== '' && bidAmount > this.maxBid) {
                            maxError = "Votre mise maximum doit-être de " + this.maxBid + "€";
                        }
                        this.errorPrevention[formType] = maxError;
                    }
                },
                openLoginOrRegisterModal(bidType) {
                    if (this.isApp) {
                        this.openLoginModal();
                    } else {
                        this.openRegisterModal(bidType);
                    }
                },
                isAbtest(version) {
                    return (this.abTestVariation !== "" && this.abTestVariation === version);
                },
                isAuctionInUserCurrentAuctions() {
                    return this.userInfos
                        && "auCurrent" in this.userInfos
                        && this.auction.uuid in this.userInfos.auCurrent
                        && "hasBid" in this.userInfos.auCurrent[this.auction.uuid]
                },
                showPriceRangeDetailsToggle() {
                    if (!this.displayPriceRangeDetails) {
                        this.displayPriceRangeDetails = !this.displayPriceRangeDetails;
                        this.auctionTracking({
                            "auctionId": this.auction.id,
                            "key": "clickedPriceRangeBtn",
                            "value": "1",
                        });
                    } else {
                        this.$modal.show('priceRangeInfos');
                    }
                },
                pricePerUser(price) {
                    const amount = (typeof price === "undefined") ? this.currentBid.amount : price;

                    if (this.product.nbPassenger > 0) {
                        const ppp = amount / (this.product.nbPassenger * 100);
                        if (this.isInteger(ppp)) {
                            return ppp;
                        }
                        // if price per user is a float, we round to two digits.
                        return ppp.toFixed(2);
                    }
                    return amount;
                },
                isInteger(str) {
                    if (typeof Number.isInteger === 'function') {
                        return Number.isInteger(str);
                    }
                    return typeof str === "number" && isFinite(str) && Math.floor(str) === str;
                },
                goNextAuction(val) {
                    const href = '/product/' + this.product.id;
                    ga('send', 'event', 'Auction', 'click', 'go next auction', val, {
                        hitCallback: hitCallbackWithTimeout(() => {
                            document.location = href;
                        }),
                    });
                },
            },
            mapActions("AuthentificationAction", [
                "openRegisterModal",
                "openLoginModal",
            ]),
            mapActions("Availabilities", [
                "setAutomaticallyShowModal",
            ]),
            mapActions("BidModule", [
                "auctionTracking",
                "defineVariation",
                "setSchema",
                "setFinished",
                "setRunning",
            ])),
    };
</script>
