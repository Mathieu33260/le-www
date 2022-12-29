<template>
  <picture
    :title="title"
    :data-iesrc="fallbackUrl"
    :data-alt="alt"
    :class="pictureClass"
  >
    <source
      v-for="source in sources"
      :key="source.media"
      :media="source.media"
      :srcset="source.srcset"
    >
  </picture>
</template>

<script>
import lozad from 'lozad';

/**
 * Load img in picture balise, on scroll
 */
export default {
  name: 'LazyPicture',
  props: {
    // Liste of images source by screen size
    sources: {
      type: Array,
      required: true,
    },
    // Title of image
    title: {
      type: String,
      required: true,
    },
    // Image fallback
    fallbackUrl: {
      type: String,
      required: true,
    },
    // image alt text
    alt: {
      type: String,
      required: false,
      default: '#',
    },
    // css class for picture
    classCss: {
      type: String,
      required: false,
      default: '',
    },
  },
  computed: {
    pictureClass() {
      let str = 'lazy-wrapper__picture';
      if (this.classCss !== '') {
        str += ' ' + this.classCss;
      }
      return str;
    },
  },
  mounted() {
    const observer = lozad(this.$el, {
      rootMargin: '30px 0px', // start loading 30px before visible
    });

    /* Observe images with lozad for intersection to lazy-load sources */
    observer.observe();
  },
};
</script>
