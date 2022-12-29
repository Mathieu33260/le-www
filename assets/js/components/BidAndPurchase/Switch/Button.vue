<template>
    <div class="btn-group" data-toggle="buttons">
      <label @click="changePane('bid')" class="btn btn-default btn-sm" :class="{ active: paneActive === 'bid' }">
        <input type="radio" name="options" id="option1" :checked="paneActive === 'bid'"> Enchère
      </label>
      <label @click="changePane('buyNow')" class="btn btn-default btn-sm" :class="{ active: paneActive === 'buyNow' }">
        <input type="radio" name="options" id="option2" :checked="paneActive === 'buyNow'"> Achat
      </label>
    </div>
</template>

<script>
    import { mapActions, mapGetters } from 'vuex';

    export default {
        name: "SwitchButton",
        computed: Object.assign({},
            mapGetters('BidAndPurchase', [
                'paneActive',
            ])),
        methods: Object.assign({
            changePane(paneName) {
                if (!this.disabled) {
                    this.switchTo(paneName);
                }
            },
        },
        mapActions('BidAndPurchase', [
            'switchTo',
        ])),
    }
</script>
