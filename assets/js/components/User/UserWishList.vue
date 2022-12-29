<template>
<div id="userProductsContainer">
    <div v-if="products && products.length > 0" class="row" key="favorites">
        <div v-for="(product,index) in products" :key="index" class="item col-xs-12 col-sm-6 col-md-4">
            <div class="content">
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
                        :class="[product.checkOnlineAuction == false?'not-active' : '']"
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
            <a
                :href="product.product_id | link"
                class="no-opacity btn btn-primary right"
            >J'OFFRE CE CADEAU</a>
        </div>
    </div>
    <div v-else class="background-gris text-center jumbotron" key="jumbotron">
        <img :src="$root.assetCdn+'/assets/img/profile/favorites-grey.png'" alt="#">
        <div class="row auctions" data-list="favorites">
            <p class="col-lg-8 col-lg-offset-2">OH ! {{ queryUser.firstName|capitalize }} n'a pas encore rempli sa liste. Montrez lui l'exemple en créant la vôtre</p>
        </div>
        <a href="/user/mes-favoris" class="btn btn-christmas">CRÉER MA WISHLIST !</a>
    </div>
</div>
</template>

<script>
  import { imgForList } from "../../function/ass.imageService";
  import http from "../../services/http";

export default {
    name: "UserWishList",
    props: {
        cryptdata: String,
        queryUser: Object,
    },
    data() {
        return {
            products: {},
        }
    },
    filters: {
        imgForList: $images => imgForList($images),
        link: productId => "/product/" + productId,
    },
    mounted() {
        this.getUserProduct();
    },
    methods: {
        getUserProduct() {
            http.get("/wishlist/" + this.cryptdata, {
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
};
</script>
