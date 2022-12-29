const state = {
    filters: {},
    loadAuctions: false,
    sort: "",
    error: null,
    reloadFavorite: false,
    auctionsLength: 0,
    loadingStep: 0,
};

const getters = {
    filters: state => state.filters,
    loadAuctions: state => state.loadAuctions,
    sort: state => state.sort,
    reloadFavorite: state => state.reloadFavorite,
    auctionsLength: state => state.auctionsLength,
    loadingStep: state => state.loadingStep,
};

const actions = {
    setFilters({ commit }, filters) {
        commit("SET_FILTERS", filters);
        commit("CHANGE_LOAD_AUCTIONS");
        commit("CHANGE_LOADING_STEP");
    },
    setSort({ commit }, sort) {
        commit("SET_SORT", sort);
        commit("CHANGE_LOADING_STEP");
    },
    setAuctionsLength({ commit }, nbAuctions) {
        commit("SET_AUCTIONS_LENGTH", nbAuctions);
    },
    changeLoadAuctions({ commit }) {
        commit("CHANGE_LOAD_AUCTIONS");
    },
    changeReloadFavorite({ commit }) {
        commit("CHANGE_RELOAD_FAVORITE");
    },
};

const mutations = {
    SET_FILTERS: (state, data) => {
        state.filters = data;
    },
    SET_SORT: (state, data) => {
        state.sort = data;
    },
    SET_ERROR: (state, data) => {
        state.error = data;
    },
    SET_AUCTIONS_LENGTH: (state, data) => {
        state.auctionsLength = data;
    },
    CHANGE_LOAD_AUCTIONS: (state) => {
        state.loadAuctions = !state.loadAuctions;
    },
    CHANGE_RELOAD_FAVORITE: (state) => {
        state.reloadFavorite = !state.reloadFavorite;
    },
    CHANGE_LOADING_STEP: (state) => {
        state.loadingStep += 1;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
