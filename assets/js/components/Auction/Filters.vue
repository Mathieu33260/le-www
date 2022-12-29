<template>
    <form id="filterForm" v-if="display">
        <div class="title">FILTRER PAR LIEU</div>
        <fieldset>
            <legend>
                <div class="checkbox">
                    <label :for="baseId+'filter_all'">
                        <input type="checkbox" value="all" :id="baseId+'filter_all'" name="filter" @click="selectAll()" v-model="all">
                        Tout voir
                    </label>
                </div>
            </legend>
        </fieldset>

        <template v-if="notEmptyObject(filters) && 'places' in filters && filters.places">
            <span v-for="(filter,index) in filters.places" :key="index">
                <fieldset id="group-france" v-if="filter.name == 'france' || filter.name == 'fr'">
                    <template :is="filter.legend == 1 ? 'legend' : 'span'">
                        <div class="checkbox">
                            <label :for="baseId+'filter_fr'">
                                <input type="checkbox" value="" :id="baseId+'filter_fr'" name="fr" @change="selectAllFrance()" v-model="fr">
                                {{ filter.wording }}
                            </label>
                        </div>
                    </template>
                    <div class="checkbox">
                        <label :for="baseId+'filter_fr_idf'">
                            <input type="checkbox" value="ile-de-france" :id="baseId+'filter_fr_idf'" name="regions" v-model="regions" @change="getCheckedElem()">
                            Ile-de-France
                        </label>
                    </div>
                    <div class="checkbox">
                        <label :for="baseId+'filter_fr_sudouest'">
                            <input type="checkbox" value="sud-ouest" :id="baseId+'filter_fr_sudouest'" name="regions" v-model="regions" @change="getCheckedElem()">
                            Sud-ouest
                        </label>
                    </div>
                    <div class="checkbox">
                        <label :for="baseId+'filter_fr_nordouest'">
                            <input type="checkbox" value="nord-ouest" :id="baseId+'filter_fr_nordouest'" name="regions" v-model="regions" @change="getCheckedElem()">
                            Nord-ouest
                        </label>
                    </div>
                    <div class="checkbox">
                        <label :for="baseId+'filter_fr_sudest'">
                            <input type="checkbox" value="sud-est" :id="baseId+'filter_fr_sudest'" name="regions" v-model="regions" @change="getCheckedElem()">
                            Sud-est
                        </label>
                    </div>
                    <div class="checkbox">
                        <label :for="baseId+'filter_fr_nordest'">
                            <input type="checkbox" value="nord-est" :id="baseId+'filter_fr_nordest'" name="regions" v-model="regions" @change="getCheckedElem()">
                            Nord & Nord-est
                        </label>
                    </div>
                </fieldset>
                <fieldset v-else-if="filter.name == 'other'">
                    <template :is="filter.legend == 1 ? 'legend' : 'span'">
                        <div class="checkbox">
                            <label :for="baseId+'filter_other'">
                                <input type="checkbox" value="etranger" :id="baseId+'filter_other'" name="other" v-model="other" @change="getCheckedElem()">
                                {{ filter.wording }}
                            </label>
                        </div>
                    </template>
                </fieldset>
            </span>
        </template>

        <template v-if="notEmptyObject(filters) && 'nbnight' in filters && filters.nbnight">
            <div class="title">FILTRER PAR ENVIE</div>
            <fieldset>
                <span v-for="(filter,index) in filters.nbnight" :key="index">
                    <template :is="filter.legend == 1 ? 'legend' : 'span'">
                        <div class="checkbox">
                            <label :for="baseId+'filter_nuit_'+filter.value">
                                <input type="checkbox" :value="filter.value" :id="baseId+'filter_nuit_'+filter.value" name="nbNight" v-model="nbNight" @change="getCheckedElem()">
                                {{ filter.wording }}
                            </label>
                        </div>
                    </template>
                </span>
                <template v-if="notEmptyObject(filters) && 'transport' in filters && filters.transport">
                    <span v-for="(filter,index) in filters.transport" :key="index">
                        <template :is="filter.legend == 1 ? 'legend' : 'span'">
                            <div class="checkbox">
                                <label :for="baseId + 'filter_transport_' + filter.value">
                                    <input type="checkbox" :value="filter.value" :id="baseId + 'filter_transport_' + filter.value" name="transport" v-model="transport" @change="getCheckedElem()">
                                    {{ filter.wording }}
                                </label>
                            </div>
                        </template>
                    </span>
                </template>
            </fieldset>
        </template>
        <template v-if="notEmptyObject(filters) && 'nbpersonne' in filters && filters.nbpersonne">
            <div class="title">FILTRER PAR NOMBRE DE PERSONNE</div>
            <fieldset>
                <span v-for="(filter,index) in filters.nbpersonne" :key="index">
                    <template :is="filter.legend == 1 ? 'legend' : 'span'">
                        <div class="checkbox">
                            <label :for="baseId+'filter_person_'+filter.value">
                                <input type="checkbox" :value="filter.value" :id="baseId+'filter_person_'+filter.value" name="person" v-model="person" @change="getCheckedElem()">
                                {{ filter.wording }}
                            </label>
                        </div>
                    </template>
                </span>
            </fieldset>
        </template>

        <div class="pull-right reset" @click="selectAll()"><u>Décocher tous les filtres</u></div>
        <button class="btn btn-primary btn-block pull-right" @click.prevent="sendFilter" :disabled="isDisabled">Appliquer le(s) filtre(s)</button>
        <div class="clearfix"></div>

        <!-- <div class="title hide moreFilters">PLUS DE FILTRES</div>
        <fieldset class="title hide moreFilters">
            <div class="checkbox">
                <input type="text" placeholder="N° département" :id="baseId+'filter_departement'" name="departement" size="15" />
                <input type="submit" value="Go"/>
            </div>
        </fieldset> -->
    </form>
</template>

<script>
import mapValues from 'lodash/mapValues';
import { mapGetters, mapActions } from "vuex";

export default {
    name: "AuctionFilters",
    props: {
        filters: {
            type: Object,
            default: () => ({}),
        },
        activeFilters: {
            type: Object,
            default: () => {
                // Get filters in urls
                const base = {};
                const params = document.location.search.replace("?", '');
                const keysValid = ['regions', 'other', 'nbNight', 'person', 'transport'];

                if (params.length > 0) {
                    const vars = params.split('&');
                    let isValid = 0;
                    const query = {};

                    // q is used by the search bar
                    if (vars.length === 1 && vars[0].indexOf('q=') === 0) {
                      return base;
                    }

                    for (let i = 0; i < vars.length; i++) {
                        const pair = vars[i].split('=');
                        if (keysValid.indexOf(pair[0]) > -1) {
                            isValid = 1;
                            query[pair[0]] = decodeURIComponent(pair[1]).split(',');
                        }
                    }
                    if (isValid) {
                        return query;
                    }
                    return base;
                }
                return base;
            },
        },
        baseId: {
            type: String,
            default: "",
        },
      forScreensUpTo: {
        type: Number,
        required: false,
        default: 0,
      },
      forScreensFrom: {
        type: Number,
        required: false,
        default: 0,
      },
    },
    data() {
        return {
          isDisabled: true,
          selectedFilters: this.activeFilters,
          noFilter: false,
          display: false,
          all: !this.notEmptyObject(this.activeFilters),
          fr: 'regions' in this.activeFilters && this.activeFilters.regions.length === 5,
          regions: 'regions' in this.activeFilters ? this.activeFilters.regions : [],
          other: 'other' in this.activeFilters ? this.activeFilters.other : [],
          nbNight: 'nbNight' in this.activeFilters ? this.activeFilters.nbNight : [],
          transport: 'transport' in this.activeFilters ? this.activeFilters.transport : [],
          person: 'person' in this.activeFilters ? this.activeFilters.person : [],
        }
    },
    mounted() {
      this.doWeDisplay();

      this.getCheckedElem();
      this.isDisabled = true;
      if (!this.notEmptyObject(this.selectedFilters)) {
        // If no filter defined, check filter all
        this.selectedFilters.filter = ['all'];
      }

      if (!this.notEmptyObject(this.checkedFilters)) {
        // Send filters only once
        this.setFilters(this.selectedFilters);
      }

      window.addEventListener('resize', this.handleResize);
    },
    computed: Object.assign({},
    mapGetters('AuctionListSettings', {
        checkedFilters: 'filters',
    })),
    methods: Object.assign({
        doWeDisplay() {
          const currentWidth = getWidth();
          this.display = (currentWidth >= this.forScreensFrom && (this.forScreensUpTo === 0 || (this.forScreensUpTo > currentWidth)));
        },
        handleResize() {
          this.doWeDisplay();
        },
      getCheckedElem() {
        this.selectedFilters = {};
        const noActiveFilters = this.fr === false && this.regions.length === 0 && this.other.length === 0 && this.nbNight.length === 0 && this.person.length === 0 && this.transport.length === 0
        this.all = noActiveFilters;

        delete this.selectedFilters.regions;
        if (this.regions.length) {
          this.selectedFilters.regions = this.regions;
        }

        delete this.selectedFilters.other;
        if (this.other.length) {
          this.selectedFilters.other = this.other;
        }

        delete this.selectedFilters.nbNight;
        if (this.nbNight.length) {
          this.selectedFilters.nbNight = this.nbNight;
        }

        delete this.selectedFilters.transport;
        if (this.transport.length) {
          this.selectedFilters.transport = this.transport;
        }

        delete this.selectedFilters.person;
        if (this.person.length) {
          this.selectedFilters.person = this.person;
        }

        this.isDisabled = false;

        return true;
      },
        resetFilters() {
          this.all = true;
          this.fr = false;
          this.regions = [];
          delete this.selectedFilters.regions;
          this.other = [];
          delete this.selectedFilters.other;
          this.nbNight = [];
          delete this.selectedFilters.nbNight;
          this.transport = [];
          delete this.selectedFilters.transport;
          this.person = [];
          delete this.selectedFilters.person;
          this.getCheckedElem();
        },
        selectAll() {
          this.resetFilters();
          this.selectedFilters.filter = ['all'];
        },
        selectAllFrance() {
          this.regions = ['ile-de-france', 'sud-ouest', 'nord-ouest', 'sud-est', 'nord-est'];
          this.getCheckedElem();
        },
        editUrl() {
            const params = document.location.search;
            let href = document.location.origin + document.location.pathname;

            if (Object.keys(this.selectedFilters).length > 0) {
                if ('filter' in this.selectedFilters) {
                    window.history.pushState(document.title, document.title, href);
                    return;
                }

                if (params.indexOf('?q=') !== -1) {
                    const q = new URL(document.location.href).searchParams.get("q");
                    href += '?q=' + q + '&';
                } else {
                    href += '?';
                }
                let o = 0;
                mapValues(this.selectedFilters, (value, index) => {
                    if (index === 'fr') {
                        return;
                    }
                    if (o > 0) {
                        href += '&';
                    }
                    let i = 0;
                    let values = '';

                    value.map((val) => {
                        if (i > 0) {
                            values += ',';
                        }
                        values += encodeURIComponent(val);
                        i++;
                    });
                    href += index + '=' + values;
                    o++;
                });

                window.history.pushState(document.title, document.title, href);
            }
        },
        sendFilter() {
            this.editUrl();
            this.setFilters(this.selectedFilters);
            this.isDisabled = true;
        },
    },
    mapActions('AuctionListSettings', [
      'setFilters',
    ])),
}
</script>
