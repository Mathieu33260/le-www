<template>
    <a class="btn btn-warning btn-block text-center no-radius with-icon" id="hasNextAuction" :href="path">
        <span>Voir toutes les enchères</span>
        <i class="icon-flash-right hidden-sm"></i>
    </a>
</template>

<script>
    export default {
        name: "BtnRedirect",
        props: {
            // Path href
            path: {
                type: String,
                require: true,
            },
        },
    }
</script>
