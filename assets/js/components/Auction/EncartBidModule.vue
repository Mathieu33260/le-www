<template>
<div
  v-if="encart"
  class="bid-encart-banner"
>
  <lazy-picture
    v-if="this.encart.url === null && this.encart.urlWeb === null"
    :sources="sources"
    :title="encart.altText"
    :alt="encart.altText"
    :fallback-url="fallbackUrl"
  />
  <a
    v-else
    :href="link"
    @click.prevent="trackingSend"
  >
    <lazy-picture
      :sources="sources"
      :title="encart.altText"
      :alt="encart.altText"
      :fallback-url="fallbackUrl"
    />
  </a>
</div>
</template>

<script>
    import LazyPicture from "../Base/LazyPicture.vue";

    const moment = require('moment')
    require('moment/locale/fr')

    export default {
      name: "EncartBidModule",
      components: {
        LazyPicture,
      },
      props: {
        encart: {
          type: [Object, Boolean],
          required: true,
          default: () => false,
        },
        isApp: {
          type: Boolean,
          required: true,
          default: () => false,
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
          fallbackUrl: this.encart.imageDesktop,
          sources: [
            {
              media: "(min-width: 768px)",
              srcset: this.encart.imageDesktop,
            },
            {
              media: "(min-width: 320px)",
              srcset: this.encart.imageMobile ? this.encart.imageMobile : this.encart.imageDesktop,
            },
          ],
          isGoToLink: false,
        };
      },
      computed: {
        link() {
          if (!this.encart.urlWeb || (this.isApp && this.encart.urlWeb)) {
            return this.encart.url;
          }
          return this.encart.urlWeb;
        },
        title() {
          if (this.isApp) {
            return this.encart.altTextMobile;
          }
          return this.encart.altText;
        },
        eaCampaignName() {
          return 'bidmodule-' + this.encart.altText.replace(/[\s]/g, '-') + '_' + moment(this.encart.activeBegin).format("YYYY-MM-DD");
        },
      },
      methods: {
        trackingSend() {
          setTimeout(this.goToLink, 1000);
          this.eaClick();

          ga('send', 'event', 'merchandising website', 'banner bidmodule', this.encart.tag, {
            hitCallback: this.goToLink(),
          });
        },
        goToLink() {
          if (!this.isGoToLink) {
            this.isGoToLink = true;
            window.location.href = this.link;
          }
        },
        eaPrinting() {
          if (this.encart && typeof EA_dyntpview !== 'undefined') {
            EA_dyntpview(this.eaSite, this.eaCampaignName, 'encart bidmodule', this.eaSite, 'generic');
          }
        },
        eaClick() {
          if (this.encart && typeof EA_dyntpclick !== 'undefined') {
            EA_dyntpclick(this.eaSite, this.eaCampaignName, 'encart bidmodule', this.eaSite, 'generic');
          }
          return false;
        },
      },
      mounted() {
        this.eaPrinting();
      },
    }
</script>
