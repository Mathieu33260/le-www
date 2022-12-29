<template>
    <modal-content>
        <template v-slot:body>
            <iframe src="https://www.youtube.com/embed/7sQvBi8J58c" frameborder="0" width="100%" height="252px" allowfullscreen></iframe>
        </template>
    </modal-content>
</template>

<script>
import ModalContent from '../Content.vue';

export default {
    name: 'CcmVideo',
    components: {
        ModalContent,
    },
}
</script>
