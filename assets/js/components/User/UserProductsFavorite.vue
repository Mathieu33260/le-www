<template>
<div id="userProductsContainer">
    <div class="row">
        <div v-for="(product,index) in products" :key="index" class="item col-xs-12 col-s-6">
            <div class="content">
                <span class="remove gly-spin-hover" @click="removeElement(index, product.product_id)">
                    <i class="icon-close gly-spin"></i> Supprimer
                </span>
                <div class="alllinks">
                    <a :href="product.product_id | link" class="no-opacity">
                        <picture v-if="product.images.length > 0" :title="product.product.name">
                            <source
                                media="(min-width: 768px)"
                                :srcset="product.images | imgForList | noprotocol | transf('c_thumb,h_165,w_409')"
                            >
                            <source
                                media="(max-width: 767px)"
                                :srcset="product.images | imgForList | noprotocol | transf('c_thumb,h_248')"
                            >
                            <img
                                :alt="product.product.name"
                                :src="product.images | imgForList | noprotocol | transf('c_thumb,h_248')"
                                class="img-responsive"
                            >
                        </picture>
                        <img
                            v-else
                            :alt="product.product.name"
                            :title="product.product.name"
                            src="//img.loisirsencheres.fr/loisirs/image/upload/c_thumb,h_165,w_409/v1517479904/ressource/thumbnail-default.png"
                        >
                    </a>
                    <a
                        :href="product.product_id | link"
                        class="legend"
                        :class="[product.checkOnlineAuction == false ? 'not-active' : '']"
                    >
                        <div>
                            <div>
                                <span class="title" v-text="product.product.name"></span>
                                <i class="icon-arrow-right" v-if="product.checkOnlineAuction"></i>
                                <span
                                    class="not-available"
                                    v-else
                                >Cette enchère n'est malheureusement plus disponible actuellement ! Mais elle pourrait revenir très vte !</span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import http from "../../services/http";

export default {
    name: "UserProductsFavorite",
    data() {
        return {
            products: {},
        }
    },
    filters: {
        link: productId => "/product/" + productId,
    },
    mounted() {
        this.getUserProduct();
    },
    computed: mapGetters('AuctionListSettings', [
        'reloadFavorite',
    ]),
    methods: Object.assign({
        removeElement(index, pid) {
            const params = new URLSearchParams();
            params.append('pid', pid);
            params.append('action', 'unlike');

            // Remove item in db
            http.post("/user/mes-favoris", params)
            .then(() => {
                this.products.splice(index, 1);
            })
            .catch((error) => {
                console.log(error.response.statusText);
            });
            ga("send", "event", "Auction", "unlike", "favorite", pid);
        },
        getUserProduct() {
            http.get("/user/mes-favoris", {
                params: {
                    userproduct: 1,
                },
                responseType: "json",
            })
            .then((response) => {
                this.products = response.data.products;
            })
            .catch((error) => {
                console.log(error.response.statusText);
            });
        },
    },
    mapActions('AuctionListSettings', [
        'changeReloadFavorite',
    ])),
    watch: {
        reloadFavorite(val) {
            if (val) {
                this.getUserProduct();
                this.changeReloadFavorite();
            }
        },
    },
};
</script>
