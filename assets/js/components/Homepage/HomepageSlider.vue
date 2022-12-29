<template>
    <vue-glide
          type="carousel"
          :autoplay="4000"
          :per-view="1"
          :rewind="true"
          :gap="0"
          :bullet="true"
          :drag-threshold="false"
          v-model="currentSlideIndex"
    >
            <vue-glide-slide v-if="notEmptyObject(slides) === false">
                <div class="item item-default template4" data-name="Enchérissez, remportez et profitez !">
                    <a href="/all" class="content" target="_blank">
                        <div class="content-inner">
                            <div class="catch-phrase">
                                <span>Enchérissez, remportez et profitez !</span>
                            </div>
                            <button href="/all" title="Découvrir" class="btn btn-warning with-icon" target="_blank">
                                <i class="icon-arrow-right-full"></i>
                                Voir les enchères
                            </button>
                        </div>
                    </a>
                    <div class="filter" style="background: rgba(0,0,0,0.1)"></div>
                </div>
            </vue-glide-slide>
            <vue-glide-slide v-else v-for="slide in slides" :key="slide.id">
                <div :class="itemClass(slide)" :data-name="slide.name" :data-position="slide.position">
                    <a v-if="slide.template === 'fullpage'" :href="slide.url" @click.prevent="hrefAction(slide)" class="content" :target="target(slide)">
                        <button v-if="slide.textLink !== ''" :title="slide.textLink" :class="'btn btn-' + slide.styleLink + ' with-icon'">
                            {{ slide.textLink }} <i class="icon-arrow-right-full"></i>
                        </button>
                    </a>
                    <a v-else :href="slide.url" @click.prevent="hrefAction(slide)" class="content" :target="target(slide)">
                        <div class="content-inner">
                            <div class="catch-phrase">
                                <span v-if="slide.template === 'template3'">
                                    {{ slide.secondaryText }}
                                    <template v-if="showTerms(slide.terms)">*</template>
                                </span>
                                <span class="first-child" :class="{ 'hidden-xs': hasMainTextMobile(slide) }">
                                    {{ slide.name }}
                                    <template v-if="showTerms(slide.terms) && slide.template === 'template4'">*</template>
                                </span>
                                <span v-if="hasMainTextMobile(slide)" class="first-child visible-xs">
                                    {{ slide.mainTextMobile }}
                                    <template v-if="showTerms(slide.terms) && slide.template === 'template4'">*</template>
                                </span>
                                <span v-if="['template1', 'template2'].indexOf(slide.template) !== -1">
                                    {{ slide.secondaryText }}
                                    <template v-if="showTerms(slide.terms)">*</template>
                                </span>
                            </div>
                            <button :title="slide.textLink" :class="'btn btn-' + slide.styleLink + ' with-icon'">
                                {{ slide.textLink }} <i class="icon-arrow-right-full"></i>
                            </button>
                        </div>
                        <span v-if="showTerms(slide.terms) " class="terms small text-center">{{ slide.terms }}</span>
                    </a>
                    <div class="filter" :style="'background: rgba(0, 0, 0, ' + slide.opacity + ')'"></div>
                </div>
            </vue-glide-slide>
        </vue-glide>
</template>

<script>
    import { mapActions } from "vuex"
    import { Glide, GlideSlide } from 'vue-glide-js'

    const moment = require('moment')
    require('moment/locale/fr')

    export default {
        name: "HomepageSlider",
        components: {
            [Glide.name]: Glide,
            [GlideSlide.name]: GlideSlide,
        },
        props: {
            /**
             * List of slides
             */
            slides: {
                type: Array,
                require: true,
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
                currentSlideIndex: 0,
            }
        },
        methods: Object.assign({
            hrefAction(slide) {
                if (slide.url.indexOf('#') === 0) {
                    // An # is defined in url
                    if (slide.url === '#pub') {
                        // Open modal pub TV
                        this.openPubModal();
                    }
                } else {
                    let goto = false;
                    setTimeout(() => {
                        if (!goto) {
                            goto = true;
                            window.location.href = slide.url;
                        }
                    }, 500);
                }
                this.action(slide);
            },
            itemClass(slide) {
                return 'item ' + slide.template + ' slide-' + slide.id;
            },
            target(slide) {
                return slide.url.indexOf("http://") !== -1 || slide.url.indexOf('https://') !== -1 ? '_blank' : null;
            },
            hasMainTextMobile(slide) {
                return slide.mainTextMobile !== null && slide.mainTextMobile !== '';
            },
            showTerms(terms) {
                return terms !== '' && terms !== null;
            },
            action(slide) {
                // Tracking
                ga('send', 'event', {
                    transport: 'beacon', // beacon transport allows data to be sent asynchronously to a server, even after a page was closed.
                    eventCategory: 'merchandising website',
                    eventAction: 'slider',
                    eventLabel: slide.name,
                    eventValue: slide.position,
                });
                // Tracking click merchandising Eulerian
                this.eaClick(slide);
            },
            eaPrinting(index) {
                if (typeof EA_tpviewprd !== 'undefined'
                    && typeof EA_dyntpview !== 'undefined'
                    && index < this.slides.length) {
                    const slide = this.slides[index];
                    EA_tpviewprd(slide.name, slide.position);
                    EA_dyntpview(this.eaSite, 'slider-' + slide.name.replace(/[\s]/g, '-') + '_' + moment(slide.active_begin).format("YYYY-MM-DD"), 'slider', this.eaSite, 'generic');
                }
            },
            eaClick(slide) {
                if (typeof EA_tpclickposition !== 'undefined'
                    && typeof EA_dyntpclick !== 'undefined'
                    && typeof EA_tpclickproduct !== 'undefined') {
                    EA_tpclickproduct(slide.id);
                    EA_dyntpclick(this.eaSite, 'slider-' + slide.name.replace(/[\s]/g, '-') + '_' + moment(slide.active_begin).format("Y-MM-DD"), 'slider', this.eaSite, 'generic');
                }
            },
        },
        mapActions("GeneralAction", [
            "openPubModal",
        ])),
        watch: {
            currentSlideIndex(index) {
                this.eaPrinting(index);
            },
        },
        mounted() {
            this.eaPrinting(this.currentSlideIndex);
        },
    }
</script>
