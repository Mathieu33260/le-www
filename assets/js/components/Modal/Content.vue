<template>
    <div class="modal-content">
        <!-- Modal header -->
        <slot name="header">
            <!-- <div class="modal-header">Some content</div> -->
        </slot>
        <div class="modal-body">
            <button @click="closeModal" class="close text-right hidden-xs" type="button" aria-label="Fermer la fenêtre de dialogue">
                <span aria-hidden="true">×</span>
            </button>
            <button @click="closeModal" class="close visible-xs left" type="button">
                <i class="icon-close"></i> <small>Fermer</small>
            </button>
            <!-- Modal body -->
            <slot name="body">
                <!-- Some content -->
            </slot>
        </div>
        <!-- Modal footer -->
        <slot name="footer">
            <!-- <div class="modal-footer">Some content</div> -->
        </slot>
    </div>
</template>

<script>
    import { mapActions } from "vuex";

    export default {
        name: "ModalContent",
        methods: {
            ...mapActions('Modal', [
                'resetModal',
            ]),
            /**
             * @vuese
             * Close modal
             */
            closeModal() {
                return this.resetModal();
            },
        },
    }
</script>
