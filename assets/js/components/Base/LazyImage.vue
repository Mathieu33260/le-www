<template>
    <img
        :data-src="src"
        :alt="alt"
        :title="title"
        :style="style"
    >
</template>

<script>
  import lozad from 'lozad';

  export default {
    name: 'LazyImage',
    props: {
      // background color of the image the time of its loading
      backgroundColor: {
        type: String,
        required: false,
      },
      // Attr title of image
      title: {
        type: String,
        required: false,
      },
      // Alt of image
      alt: {
        type: String,
        required: false,
        default: '#',
      },
      // Url image
      src: {
        type: String,
        required: true,
      },
    },
    computed: {
      // Define image attr style
      style() {
        let style = '';
        if (this.backgroundColor !== '') {
          style += { backgroundColor: this.backgroundColor };
        }
        return style;
      },
    },
    mounted() {
      const observer = lozad(this.$el);
      observer.observe();
    },
};
</script>
