<template>
    <div class="col-xs-12 text-center">
        <img :src="$root.assetCdn + '/assets/gfx/loader.gif?v=20170307'"
             alt="Chargement..."
             :class="{ hide: isHide }"
        >
        <iframe
                :data-src="href"
                :id="id"
                :title="title"
                :frameborder="frameborder"
                :scrolling="scrolling"
                :width="width"
                :height="height"
                :src="src"
                :data-device="device"
        >
        </iframe>
    </div>
</template>

<script>
import includes from 'lodash/includes';

export default {
    name: 'LazyFrame',
    props: {
        href: {
            type: String,
            required: true,
        },
        id: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: false,
        },
        frameborder: {
            type: Number,
            required: false,
            default: 0,
        },
        scrolling: {
            type: String,
            required: false,
            default: "no",
        },
        width: {
            type: String,
            required: false,
        },
        height: {
            type: String,
            required: false,
        },
        device: {
            type: Array,
            required: false,
            default: () => new Array('desktop', 'mobile'),
        },
    },
    data() {
        return {
            distance: 0,
            distTopBottom: 0,
            src: "",
            isHide: false,
        }
    },
    methods: {
        lazyLoad() {
            // don't need to debounce
            if ((includes(this.device, 'mobile') && includes(this.device, 'desktop'))
                || (includes(this.device, 'desktop') && window.innerWidth >= 768)
                || (includes(this.device, 'mobile') && window.innerWidth < 768)) {
                // get the distance from the viewport
                this.distance = (this.$el.getBoundingClientRect().top - this.$el.ownerDocument.defaultView.pageYOffset) - window.document.documentElement.scrollTop;
                this.distTopBottom = window.innerHeight - this.distance;

                if (this.distTopBottom >= 0) {
                    // replace src with href value to display the iframe
                    this.src = this.href;
                    // stop event listener if iframe is displayed
                    window.removeEventListener('scroll', this.lazyLoad);
                    // hide the loader
                    this.isHide = true;
                }
            }
        },
    },
    created() {
        window.addEventListener('scroll', this.lazyLoad);
    },
    mounted() {
        // if the iframe is in the viewport at the page init
        this.lazyLoad();
    },
    destroyed() {
        window.removeEventListener('scroll', this.lazyLoad);
    },
};
</script>
