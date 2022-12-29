<template>
    <picture :title="title">
        <source
                media="(min-width: 1200px)"
                srcset="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_273/c_crop,w_446,h_273/v1517479904/ressource/thumbnail-default.png"
        >
        <source
                media="(min-width: 1024px)"
                srcset="//img.loisirsencheres.fr/loisirs/image/upload/c_fit,w_526,h_324/v1517479904/ressource/thumbnail-default.png"
        >
        <source
                media="(min-width: 768px)"
                srcset="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_146/c_crop,w_238,h_146/v1517479904/ressource/thumbnail-default.png"
        >
        <source
                v-if="templatePageType === 'fullpage'"
                media="(min-width: 375px)"
                srcset="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_338/c_crop,w_555,h_338/v1517479904/ressource/thumbnail-default.png"
        >
        <source
                media="(min-width: 320px)"
                srcset="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_117/c_crop,w_137,h_117/v1517479904/ressource/thumbnail-default.png"
        >
        <img
                v-if="templatePageType === 'fullpage'"
                :alt="alt"
                src="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_273/c_crop,w_290,h_178/v1517479904/ressource/thumbnail-default.png"
                class="img-responsive"
        >
        <img
                v-else
                :alt="alt"
                src="//img.loisirsencheres.fr/loisirs/image/upload/c_scale,h_273/c_crop,w_446,h_273/v1517479904/ressource/thumbnail-default.png"
                class="img-responsive"
        >
    </picture>
</template>

<script>
    export default {
        name: "NoImage",
        props: {
            auction: {
                type: Object,
                required: true,
            },
        },
    };
</script>
