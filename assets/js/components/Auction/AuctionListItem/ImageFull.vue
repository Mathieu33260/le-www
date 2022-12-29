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
  },
  computed: {
    image() {
      return prepareImages(this.auction.images);
    },
    fallbackUrl() {
      return transf(
        transf(this.image, "c_scale,h_273"),
        "c_crop,w_290,h_178,g_north_east",
      );
    },
    sources() {
      return [
        {
          media: "(min-width: 1200px)",
          srcset: transf(transf(this.image, "c_scale,h_176"),
            "c_crop,w_288,h_176,g_north_east") + ', ' + transf(transf(this.image, "c_scale,h_273"),
            "c_crop,w_446,h_273,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 768px)",
          srcset: transf(
            transf(this.image, "c_scale,h_146"),
            "c_crop,w_266,h_146,g_north_east",
          ),
        },
        {
          media: "(min-width: 375px)",
          srcset: transf(transf(this.image, "c_scale,h_216"),
            "c_crop,w_354,h_216,g_north_east") + ', ' + transf(transf(this.image, "c_scale,h_338"),
            "c_crop,w_555,h_338,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 320px)",
          srcset: transf(
            transf(this.image, "c_scale,h_111"),
            "c_crop,w_137,h_111,g_north_east",
          ),
        },
      ];
    },
  },
};
</script>
