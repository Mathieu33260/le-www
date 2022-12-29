const state = {
    modal: {
        displayed: false,
        target: null,
        id: null,
    },
};

const getters = {
    getModalDisplay: state => state.modal.displayed,
    getModalTarget: state => state.modal.target,
    getModalId: state => state.modal.id,
};

const actions = {
    displayModal: ({ commit, state }, payload) => {
        commit('DISPLAY_MODAL', true);
        commit('SET_MODAL_TARGET', payload.target);
        if (payload.id) {
            commit('SET_MODAL_ID', payload.id);
        }
    },
    resetModal: ({ commit }) => {
        commit('DISPLAY_MODAL', false);
        commit('SET_MODAL_TARGET', null);
        commit('SET_MODAL_ID', null);
    },
};

const mutations = {
    DISPLAY_MODAL: (state, value) => state.modal.displayed = value,
    SET_MODAL_TARGET: (state, value) => state.modal.target = value,
    SET_MODAL_ID: (state, value) => state.modal.id = value,
};


export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}
