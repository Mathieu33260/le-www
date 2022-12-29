<template>
    <div class="row item">
        <div v-for="(auction, index) in auctions" class="col-xs-12 col-sm-10 col-sm-offset-1 nopadding-only-sm nopadding-only-md nopadding-only-lg background-blanc" :key="auction.auction_id" :index="index">
            <p class="hidden-xs">{{ auction.name }}</p>
            <div class="content">
                <div class="row">
                    <div class="col-xs-5">
                        <img v-if="auction.product_image" :src="auction.product_image" :alt="auction.name" class="img-responsive" />
                        <img v-else src="//img.loisirsencheres.fr/loisirs/image/upload/v1517479904/ressource/thumbnail-default.png" :alt="auction.name" class="img-responsive" />
                    </div>
                    <div class="col-xs-7 nopadding-left">
                        <p class="visible-xs">{{ auction.name }}</p>
                        <div class="hidden-xs">
                            <b>Contenu :</b>
                            <div class="descripion more-hide">
                                <div v-if="auction.text_included_product" v-html="auction.text_included_product"></div>
                                <div v-else v-html="auction.description"></div>
                            </div>
                            <p class="text-info"><a :href="'/auction/'+auction.auctionId" target="_blank">Voir l'offre</a></p>
                        </div>
                        <div class="row">
                            <div class="col-xs-12 col-sm-7 nopadding-right-only">
                                <p class="nomargin-bottom">
                                    <span class="hidden-xs date"><small><em class="text-muted">Remporté le {{ auction.payment_created | dateYearMonthDay }}</em></small><br /></span>
                                    <span class="price">{{ auction.amount/100 }} €</span><small><em class="text-muted">au lieu de {{ auction.shortPrice }}</em></small>
                                </p>
                            </div>
                            <div class="hidden-xs col-sm-5">
                                <a class="btn btn-block btn-warning text-uppercase" :href="'/paiement/'+auction.id+'?token='+auction.verification_token" v-if="auction.status == 'pending'">Régler</a>
                                <a class="btn btn-block btn-primary text-uppercase" :href="'/paiement/'+auction.id+'?token='+auction.verification_token" v-else-if="auction.status == 'awaiting'">En Attente</a>
                                <span v-else-if="auction.status == 'processing' || auction.status == 'awaiting-bank'">Paiement en cours de traitement...</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-xs-12 visible-xs">
                        <a class="btn btn-block btn-warning text-uppercase" :href="'/paiement/'+auction.id+'?token='+auction.verification_token" v-if="auction.status == 'pending'">Régler</a>
                        <a class="btn btn-block btn-primary text-uppercase" :href="'/paiement/'+auction.id+'?token='+auction.verification_token" v-else-if="auction.status == 'awaiting'">En Attente</a>
                        <span v-else-if="auction.status == 'processing' || auction.status == 'awaiting-bank'">Paiement en cours de traitement...</span>
                    </div>
                    <div class="col-xs-12" v-if="auction.status == 'awaiting'">
                        <em class="text-muted">Votre chèque ou virement est en attente de validation, vous pouvez cependant changer de moyen de paiement en cliquant sur le bouton "EN ATTENTE"</em>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: "AuctionsPending",
        props: ['auctions'],
        filters: {
            dateYearMonthDay: (date) => {
                const paymentCreated = getDateFromString(date);
                return ('0' + paymentCreated.getDate()).slice(-2) + "/" + ('0' + (paymentCreated.getMonth() + 1)).slice(-2) + "/" + paymentCreated.getFullYear();
            },
        },
        computed: Object.assign({},
            mapGetters('UserDatas', {
                userInfos: 'userInfos',
            })),
    };
</script>
