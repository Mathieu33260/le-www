<template>
    <div class="btn-group dropdown">
        <button v-if="!forMobile" id="sortBtn" type="button" class="btn btn-link hidden-sm hidden-xs" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Trier par <span class="caret"></span></button>
        <ul class="dropdown-menu dropdown-menu-right" aria-labelledby="dLabel">
            <li :class="{active: itemClass('publicPrice-asc')}"><a :href="currentPath+'?sort=publicPrice-asc'" @click.prevent="changeSort('publicPrice-asc')">Prix public croissant</a></li>
            <li :class="{active: itemClass('publicPrice-desc')}"><a :href="currentPath+'?sort=publicPrice-desc'" @click.prevent="changeSort('publicPrice-desc')">Prix public décroissant</a></li>
            <li :class="{active: itemClass('popularity')}"><a :href="currentPath+'?sort=popularity'" @click.prevent="changeSort('popularity')">Popularité</a></li>
            <li :class="{active: itemClass('end-desc')}"><a :href="currentPath+'?sort=end-desc'" @click.prevent="changeSort('end-desc')">Compte à rebours décroissant</a></li>
            <li :class="{active: itemClass('end-asc')}"><a :href="currentPath+'?sort=end-asc'" @click.prevent="changeSort('end-asc')">Compte à rebours croissant</a></li>
        </ul>
    </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "AuctionSort",
  props: {
    sort: {
      type: String,
      default: "end-asc",
      required: true,
    },
    forMobile: {
      type: Boolean,
      default: false,
    },
    noSort: {
      type: Boolean,
      default: false,
    },
    currentPath: {
      type: String,
      default: document.location.origin + document.location.pathname,
    },
  },
  data() {
    return {
      href: document.location.origin + document.location.pathname,
      show: false,
    }
  },
  mounted() {
    if (this.saveSort !== '') {
      // Send sort data only once
      this.setSort(this.sort);
    }
  },
  computed: Object.assign({},
    mapGetters('AuctionListSettings', {
      saveSort: 'sort',
    })),
  methods: Object.assign({
      changeSort(sort) {
        this.setSort(sort);

        window.history.pushState(document.title, document.title, this.href);

        if (sort !== 'end-asc') {
          window.history.pushState(document.title, document.title, this.href + '?sort=' + sort);
        }
      },
      itemClass(sort) {
        return this.saveSort.length > 0 && this.saveSort === sort;
      },
    },
    mapActions('AuctionListSettings', [
      'setSort',
    ])),
}
</script>
