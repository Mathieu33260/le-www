<template>
    <div class="gifted_card">
        <div class="gifted_card_inner">
            <vue-glide
                v-if="notEmptyObject(giftedcards)"
                type="slider"
                :autoplay="0"
                :breakpoints="carouselBreakpoints"
                :rewind="false"
                :gap="20"
                :bullet="true"
            >
                <vue-glide-slide v-for="giftedcard in giftedcards" :key="giftedcard.id">
                    <div class="card">
                        <header>
                            <div class="left">code : <span class="text-info">{{ giftedcard.code }}</span></div>
                            <div class="right">{{ giftedcard.original_amount / 100 }} €</div>
                        </header>
                        <div v-if="giftedcard['send_to'] !== null" class="small">Envoyé à : {{ giftedcard['send_to'] }}</div>
                        <div class="small">
                            Statut : <template v-if="giftedcard.owner === null">Cette carte n'a pas encoré été reclamée.</template><template v-else>L'utilisateur à qui vous avez envoyé la carte l'a associé à son compte.</template>
                        </div>
                        <a :href="'/user/mes-cartes-cadeaux/' + giftedcard['id']" class="btn btn-link nopadding-left-only with-icon" target="_blank">Télécharger <i class="icon-download"></i></a>
                        <a v-if="giftedcard['send_to'] !== null" @click="sendGiftCard(giftedcard)" href="#" class="btn btn-link with-icon">Envoyer <i class="icon-paper-plane"></i></a>
                        <footer>
                            <span class="left small">Achetée le : {{ giftedcard.created | moment('DD-MM-YYYY') }}</span>
                            <span class="right small">Expire le : {{ giftedcard.expire_date | moment('DD-MM-YYYY') }}</span>
                        </footer>
                    </div>
                </vue-glide-slide>
            </vue-glide>
            <div v-else class="alert alert-muted text-center" role="alert">
                <b>Vous n'avez pas encore acheté de carte cadeau, <a href="/carte-cadeau">cliquez ici</a> pour en acheter une.</b>
            </div>
        </div>
        <modal name="giftcardSendTo" :adaptive="true" width="90%" height="auto" :max-width="480">
            <div class="modal-content">
                <div class="text-right close" @click="$modal.hide('giftcardSendTo')">&times;</div>
                <div class="modal-header">
                    Envoyer une carte cadeau
                </div>
                <div class="modal-body">
                    <form class="form-horizontal" method="post" name="giftcardSend">
                        <input v-model="giftcardId" type="hidden" value="" name="giftcardId" id="giftcardIdInput">
                        <div class="form-group ">
                            <label class="control-label col-lg-4 col-md-4 required" for="emailGiftcardSend">
                                Email
                            </label>
                            <div class="col-lg-8 col-md-8">
                                <input v-model="giftcardEmail" type="email" id="emailGiftcardSend" name="email" required="required" class="form-control" title="email" />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-default" data-dismiss="modal">Fermer</button>
                            <input type="submit" class="btn btn-default btn-primary">
                        </div>
                    </form>
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
  import Vue from 'vue';
  import VModal from 'vue-js-modal';
  import { Glide, GlideSlide } from 'vue-glide-js'
  // import "vue-glide-js/dist/vue-glide.css";   /* Moved CSS import to Less pipeline, in main.less */

  Vue.use(VModal);

  const moment = require('moment')
  require('moment/locale/fr')

  export default {
    name: "UserPurchases",
    components: {
      [Glide.name]: Glide,
      [GlideSlide.name]: GlideSlide,
    },
    props: {
      giftedcards: {
        type: Array,
        require: true,
      },
    },
    data() {
      return {
        carouselBreakpoints: {
          767: { perView: 1 },
          5000: { perView: 2 },
        },
        giftcardId: '',
        giftcardEmail: '',
      }
    },
    methods: {
      sendGiftCard (giftedcard) {
        const giftcardId = giftedcard.id;
        const defaultMail = giftedcard.send_to;

        this.giftcardId = giftcardId;
        this.giftcardEmail = defaultMail;
        this.$modal.show('giftcardSendTo');
      },
    },
  }
</script>
