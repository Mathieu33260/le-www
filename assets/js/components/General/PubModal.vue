<template>
    <modal
        id="pubModal"
        name="pubModal"
        :adaptive="true"
        width="90%"
        height="auto"
        :max-width="480"
        @before-open="beforeOpen"
        @closed="openPubModal"
        :scrollable="true"
    >
        <div class="modal-content">
            <div class="modal-body">
                <div class="text-right close" @click="$modal.hide('pubModal')">&times;</div>
                    <div class="iframe__container--pub-modal">
                        <iframe class="iframe__video--pub-modal"
                                :src="src"
                                width="478"
                                height="284"
                                frameborder="0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>
        </div>
    </modal>
</template>

<script>
  import Vue from 'vue';
  import { mapActions, mapGetters } from "vuex"
  import VModal from 'vue-js-modal';

  Vue.use(VModal);

  export default {
    name: "pubModal",
    data() {
      return {
        src: '',
      }
    },
    computed: Object.assign({},
      mapGetters('GeneralAction', {
        openModal: 'openPubModal',
      })),
    watch: {
      openModal(val) {
        if (val) {
          this.$modal.show('pubModal');
        }
      },
    },
    methods: Object.assign({
      onOpen() {
        ga('send', 'event', "pub tv - juin 2019", 'open modal', 'default');
      },
      beforeOpen() {
        this.src = "https://www.youtube.com/embed/Jq3-XUUA2-Y";
      },
      open() {
        this.$modal.show('pubModal');
      },
    },
      mapActions("GeneralAction", [
        "openPubModal",
      ])),
    mounted() {
      if (this.openModal) {
        this.open();
      }
    },
  }
</script>
