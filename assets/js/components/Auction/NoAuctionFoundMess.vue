<template>
    <div id="noAuctionFoundMess" class="row background-blanc">
        <p class="col-xs-12 col-sm-6">Nous n'avons pas trouvé d'enchères correspondant à votre recherche. <br /><br />Trouvez une enchère près de chez-vous ou dans votre destination de prédilection !</p>
        <div class="col-xs-12 col-sm-6">
            <div class="carte row">
                <img class="img-responsive" :src="'//img.loisirsencheres.fr/maps/api/staticmap?center=France&zoom=4&size=320x156&scale=2&maptype=roadmap&&key='+googleConfig.mapApiKey" alt="#" />
                <a href="/carte-aux-encheres" class="btn btn-warning">VOIR LA CARTE</a>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "NoAuctionFoundMess",
        data() {
            return {
                googleConfig: this.$config.get("google.config"),
            }
        },
    }
</script>
