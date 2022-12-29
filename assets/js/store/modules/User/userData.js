
const state = {
    connected: false,
    error: null,
};

const getters = {
    connected: state => state.connected,
};

const actions = {
    changeConnected({ commit }) {
        commit('SET_CHANGE_CONNECTED')
    },
};

const mutations = {
    SET_CHANGE_CONNECTED: state => {
        state.connected = !state.connected
    },
    SET_ERROR: (state, data) => {
        state.error = data
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
