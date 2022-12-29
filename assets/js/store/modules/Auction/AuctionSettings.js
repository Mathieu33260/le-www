import { firebaseDbInit } from "../../../firebase"

const state = {
    settings: {},
};

const getters = {
    settings: state => state.settings,
};

const actions = {
    getSettings({ commit }, uuid) {
        return new Promise((resolve, reject) => {
            firebaseDbInit((snapshotValue) => {
                const result = snapshotValue || {};
                commit("SET_SETTINGS", result);
                resolve(true);
            }, {channel: `au/${uuid}/settings`})
            .catch((error) => {
                reject(error)
            })
        });
    },
};

const mutations = {
    SET_SETTINGS: (state, data) => {
        state.settings = data;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
