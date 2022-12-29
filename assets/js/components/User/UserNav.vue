<template>
    <ul class="nav nav-pills nav-stacked" id="usernav">
        <li><a href="/user/profile" :class="{ active: 'user.profile' === currentRoute }"><i class="icon-mon-profil"></i> <span>Mon profil</span></a></li>
        <li><a href="/user/mot-de-passe" :class="{ active: 'user.changePassword' === currentRoute }"><i class="icon-change-password"></i> <span>Mon mot de passe</span></a></li>
        <li>
            <a href="/user/auctions" :class="{ active: 'user.auctions' === currentRoute }">
                <i class="icon-mes-encheres"></i>
                <span>Mes enchères
                    <user-informations-payment-alert></user-informations-payment-alert>
                </span>
            </a>
        </li>
        <li><a href="/user/purchase" :class="{ active: 'user.purchase' === currentRoute }"><i class="icon-mes-achats"></i> <span>Mes achats</span></a></li>
        <li><a href="/user/mes-favoris" :class="{ active: 'user.favorites' === currentRoute }"><i class="icon-mes-favoris"></i> <span>Mes favoris</span></a></li>
        <li><a href="/user/parrainage" :class="{ active: 'user.parrainage' === currentRoute }"><i class="icon-parrainage"></i> <span>Parrainer mes ami(e)s</span></a></li>
        <li><a href="/user/mes-cartes-cadeaux" :class="{ active: 'user.giftcard' === currentRoute }"><i class="icon-cartes-cadeaux"></i> <span>Mes cartes cadeaux</span></a></li>
        <li><a href="/user/mes-avantages" :class="{ active: 'user.avantages' === currentRoute }"><i class="icon-mes-avantage"></i> <span>Mes avantages</span></a></li>
    </ul>
</template>

<script>
import Vue from 'vue';
import UserInformationsPaymentAlert from "./UserInformationsPaymentAlert.vue";

Vue.component("UserInformationsPaymentAlert", UserInformationsPaymentAlert);

export default {
    name: "UserNav",
    props: {
        currentRoute: String,
    },
    components: {
        UserInformationsPaymentAlert,
    },
}
</script>
