 <template>
  <div class="lazy-wrapper">
    <lazy-picture
      :sources="sources"
      :title="auction.auction_name"
      :alt="auction.auction_name"
      :fallbackUrl="fallbackUrl"
    />
  </div>
</template>

<script>
  import findIndex from 'lodash/findIndex';
  import { prepareImages, transf } from "../../../function/ass.imageService";

import LazyPicture from "../../Base/LazyPicture.vue";

export default {
  name: "ImageFull",
  components: {
    LazyPicture,
  },
  props: {
    auction: {
      type: Object,
      required: true,
    },
    sourcesEdit: {
      required: false,
      type: Array,
    },
  },
  computed: {
    image() {
      return prepareImages(this.auction.images);
    },
    fallbackUrl() {
      return transf(this.image, "c_fit,w_555,g_north_east");
    },
    sources() {
      const config = [
        {
          media: "(min-width: 1200px)",
          srcset: transf(this.image, "c_fit,w_555,g_north_east"),
        },
        {
          media: "(min-width: 768px)",
          srcset: transf(this.image, "c_fit,w_455,g_north_east") + ', ' + transf(this.image, "c_fit,w_470,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 320px) and (max-width: 767px)",
          srcset: transf(this.image, "c_fit,w_369,g_north_east") + ', ' + transf(this.image, "c_fit,w_735,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 320px)",
          srcset: transf(
            transf(this.image, "c_scale,h_117"),
            "c_crop,w_137,h_117,g_north_east",
          ),
        },
      ];

      if (this.sourcesEdit) {
        // overcrowding imgs source config
        this.sourcesEdit.forEach((edit) => {
          // The element exists in the config
          let srcSet = '';
          // We create the string that will replace the media srcset
          Object.keys(edit.srcset).forEach((item) => {
            if (srcSet !== '') {
              srcSet += ', '
            }
            // Transformation of the image
            srcSet += transf(this.image, item);
            const density = edit.srcset[item];
            if (density !== '') {
              // There is a density, we add it to the string
              srcSet += ' ' + density;
            }
          });

          // Recovering the media to edit
          const configKey = findIndex(config, ['media', edit.media]);
          if (configKey !== -1) {
            // Replacing the srcSet with the new string
            config[configKey].srcset = srcSet;
          } else {
            // Push/splice new config
            config.splice(edit.splice, 0, {
              media: edit.media,
              srcset: srcSet,
            });
          }
        });
      }

      return config;
    },
  },
};
</script>
