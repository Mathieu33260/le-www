<template>
    <div class="homeblock__item">
        <div class="homeblock__filter img-rounded" :style="filterStyle">&nbsp;</div>
        <lazy-picture
            :sources="sources"
            :title="advert.title"
            :alt="advert.title"
            :fallbackUrl="fallbackUrl"
            class-css="homeblock__picture"
        />
        <a class="homeblock__link" @click="eaClick" :href="advert.urlWeb" :data-ga-label="advert.title">
            <div class="homeblock__content">
                <span class="homeblock__title">{{ advert.title }}</span>
                <p class="homeblock__catchphrase">{{ advert.catchphrase }}</p>
                <button class="btn btn-warning">{{ advert.linkText }}</button>
            </div>
        </a>
    </div>
</template>

<script>
    import lozad from 'lozad';
    import { noprotocol, transf } from '../../function/ass.imageService';
    import LazyPicture from "../Base/LazyPicture.vue";

    const moment = require('moment')
    require('moment/locale/fr')

    /**
     * Block promotion
     */
    export default {
        name: "BlockPromotion",
        components: {
            LazyPicture,
        },
        props: {
            /**
             * Vuese
             * Adverts list
             */
            advert: {
                type: Object,
                required: true,
            },
            /**
             * Eulerian site key
             */
            eaSite: {
                type: String,
                require: false,
                default: 'loisirs-encheres-com',
            },
        },
        data() {
            return {
                'fallbackUrl': '//img.loisirsencheres.fr/loisirs/image/upload/h_176,q_70/v1536053451/integration/grey-bg-5x5.jpg',
            }
        },
        computed: {
            imageDesktop() {
                return noprotocol(this.advert.imageDesktop);
            },
            imageMobile() {
                return this.advert.imageMobile !== '' ? noprotocol(this.advert.imageMobile) : noprotocol(this.advert.imageDesktop);
            },
            filterStyle() {
                return 'background: rgba(0,0,0,' + this.advert.opacity + ');';
            },
            sources() {
                return [
                    {
                        media: "(min-width: 1170px)",
                        srcset: transf(this.imageDesktop, "c_scale,w_930,q_70"),
                    },
                    {
                        media: "(min-width: 992px)",
                        srcset: transf(this.imageDesktop, "c_scale,w_555,h_189,q_70"),
                    },
                    {
                        media: "(min-width: 768px)",
                        srcset: transf(this.imageDesktop, "c_scale,w_465,q_70"),
                    },
                    {
                        media: "(min-width: 640px)",
                        srcset: transf(this.imageMobile, "c_scale,w_737,q_70"),
                    },
                    {
                        media: "(min-width: 415px)",
                        srcset: transf(this.imageMobile, "c_scale,w_610,h_209,q_70"),
                    },
                    {
                        media: "(min-width: 320px)",
                        srcset: transf(this.imageMobile, "c_scale,h_209,q_70"),
                    },
                ];
            },
            eaCampaignName() {
                const advertNumber = this.advert.advertType.replace('HOME_0', '');
                return 'home-' + advertNumber + '-' + this.advert.altText.replace(/[\s]/g, '-') + '_' + moment(this.advert.beginDate).format("YYYY-MM-DD");
            },
        },
        methods: {
            eaPrinting() {
                if (typeof EA_dyntpview !== 'undefined') {
                    EA_dyntpview(this.eaSite, this.eaCampaignName, 'home', this.eaSite, 'generic');
                }
            },
            eaClick() {
                if (typeof EA_dyntpclick !== 'undefined') {
                    EA_dyntpclick(this.eaSite, this.eaCampaignName, 'home', this.eaSite, 'generic');
                }
                return false;
            },
        },
        created() {
            if (this.$root.isIe) {
                this.fallbackUrl = transf(this.imageDesktop, "c_scale,w_930,q_70");
            }
        },
        mounted() {
            const observer = lozad(this.$el, {
                rootMargin: '30px 0px', // start loading 30px before visible
            });

            /* Observe images with lozad for intersection to lazy-load sources */
            observer.observe();

            // Eulerian merchandising printing tracking
            this.eaPrinting();
        },
    }
</script>
