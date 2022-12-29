<template>
    <div class="container">
        <mugen-scroll
            :handler="fetchData"
            :should-handle="!scrolled"
        />
        <ul v-if="scrolled">
            <li v-for="(item, index) in items" :key="index">
                <figure>
                    <a href="/content/presse-tv-recompenses" :title="item.title" rel="nofollow">
                        <img :src="buildImage(item.img)" :alt="item.alt" />
                    </a>
                </figure>
            </li>
        </ul>
    </div>
</template>

<script>
  import MugenScroll from 'vue-mugen-scroll'

  export default {
    name: "PressList",
    components: {
      MugenScroll,
    },
    data() {
      return {
        // Scrolled state
        scrolled: false,
        // Liste of press item
        items: [
          {
            'title': 'Récompense Start-up de l\'année',
            'img': 'latribune',
            'alt': 'Logo la tribune, start-up de l\'année 2015',
          },
          {
            'title': 'Reportage sur M6',
            'img': 'm6',
            'alt': 'Logo M6',
          },
          {
            'title': 'Récompense palme du site e-commerce',
            'img': 'lapalme',
            'alt': 'Logo laureat de la palme du site de e-commerce 2014',
          },
          {
            'title': 'Reportage sur France 2',
            'img': 'france2',
            'alt': 'Logo France 2',
          },
          {
            'title': 'Reportage sur France 3',
            'img': 'france3',
            'alt': 'Logo France 3',
          },
          {
            'title': 'Reportage sur TF1',
            'img': 'tf1',
            'alt': 'Logo TF1',
          },
          {
            'title': 'Article Sur Sud-Ouest',
            'img': 'sudouest',
            'alt': 'Logo Sud-Ouest',
          },
          {
            'title': 'Article sur Le figaro',
            'img': 'figaro',
            'alt': 'Logo Le figaro',
          },
          {
            'title': 'Récompense de CCIP Paris',
            'img': 'cci',
            'alt': 'Logo CCIPP',
          },
        ],
      }
    },
    methods: {
      fetchData() {
        this.scrolled = true;
      },
      // Build the uri of the image
      buildImage(imgName) {
        const extension = this.$root.useWebp ? '.webp' : '.png';
        return '//img.loisirsencheres.fr/loisirs/image/upload/v1558949095/presse/logo-' + imgName + extension;
      },
    },
  }
</script>
