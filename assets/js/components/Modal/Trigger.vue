<template>
    <button @click="triggerModal" type="button">
        <slot></slot>
    </button>
</template>

<script>
import { mapActions } from 'vuex'

export default {
    name: "ModalTrigger",
    props: {
        // Modal template called
        modalTarget: {
            type: String,
            required: true,
            default: null,
        },
        // ID on modal container
        modalId: {
            type: String,
            required: false,
            default: null,
        },
    },
    methods: {
        ...mapActions('Modal', [
            'displayModal',
        ]),
        /**
         * @vuese
         * Used to display modal
         */
        triggerModal() {
            this.displayModal({
                target: this.modalTarget,
                id: this.modalId,
            });
        },
    },
}
</script>
