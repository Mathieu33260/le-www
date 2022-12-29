<template>
    <modal
        name="modal-global"
        :id="modalId"
        :adaptive="true"
        :scrollable="true"
        width="90%"
        height="auto"
        :max-width="480"
        @closed="resetModal"
    >
      <!-- Dynamic template -->
      <component :is="modalTarget"></component>
    </modal>
</template>

<script>
    import Vue from 'vue';
    import { mapGetters, mapActions } from "vuex";
    import VModal from 'vue-js-modal';

    Vue.use(VModal);

    const CcmVideo = () => import(/* webpackChunkNalme: "CcmVideo" */ './Template/CcmVideo.vue');

    export default {
        name: "ModalContainer",
        props: {
            // Boolean open modal
            openModal: {
                type: Boolean,
                require: true,
            },
        },
        components: {
            CcmVideo,
        },
        computed: {
            ...mapGetters('Modal', {
                'modalTarget': 'getModalTarget',
                'modalId': 'getModalId',
            }),
        },
        methods: {
            ...mapActions('Modal', [
                'displayModal',
                'resetModal',
            ]),
        },
        watch: {
            openModal(val) {
                if (val) {
                    return this.$modal.show('modal-global');
                }
                return this.$modal.hide('modal-global');
            },
        },
    }
</script>
