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
import { prepareImages, transf } from '../../../function/ass.imageService';

import LazyPicture from '../../Base/LazyPicture.vue';

export default {
  name: 'ImageDefault',
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
      return transf(this.image, "c_fit,w_470,g_north_east");
    },
    sources() {
      return [
        {
          media: "(min-width: 1200px)",
          srcset: transf(transf(this.image, "c_scale,h_249"),
                  "c_crop,w_409,h_249,g_north_east") + ', ' + transf(transf(this.image, "c_scale,h_273"),
                  "c_crop,w_446,h_273,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 768px)",
          srcset: transf(this.image, "c_fit,w_345,g_north_east") + ', ' + transf(this.image, "c_fit,w_470,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 320px) and (max-width: 767px)",
          srcset: transf(this.image, "c_fit,w_354,g_north_east") + ', ' + transf(this.image, "c_fit,w_735,g_north_east") + ' 2x',
        },
        {
          media: "(min-width: 320px)",
          srcset: transf(
            transf(this.image, "c_scale,h_117"),
            "c_crop,w_137,h_117,g_north_east",
          ),
        },
      ];
    },
  },
};
</script>
