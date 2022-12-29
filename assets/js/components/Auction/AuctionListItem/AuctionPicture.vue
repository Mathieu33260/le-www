<template>
    <component :is="imageComponent" :auction="auction" :sources-edit="sourcesEdit" />
</template>

<script>
    import ImageDefault from "./ImageDefault.vue";
    import ImageFull from "./ImageFull.vue";
    import ImageNoSidebar from "./ImageNoSidebar.vue";
    import NoImage from "./NoImage.vue";

    export default {
        name: "AuctionPicture",
        components: {
            ImageDefault,
            ImageFull,
            ImageNoSidebar,
            NoImage,
        },
        props: {
            auction: {
                type: Object,
                required: true,
            },
            sourcesEdit: {
                required: false,
                type: Array,
                default() {
                    return [];
                },
            },
            templatePageType: {
                type: String,
                required: false,
                default: "default",
            },
        },
        computed: {
            imageComponent() {
                if (this.auction.images.length === 0) {
                    return NoImage;
                }
                switch (this.templatePageType) {
                    case "fullpage":
                        return ImageFull;
                    case "nosidebar":
                        return ImageNoSidebar;
                    default:
                        return ImageDefault;
                }
            },
        },
    };
</script>
