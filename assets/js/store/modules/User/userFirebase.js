import { setUserInfos, firebaseDbInit } from "../../../firebase"

const state = {
    userInfos: {},
    error: null,
};

const getters = {
    userInfos: state => state.userInfos,
    error: state => state.error,
};

const actions = {
    initialize({ commit }) {
        setUserInfos()
        /* eslint-disable arrow-parens */
            .then(userInfos => {
                firebaseDbInit(snapshotValue => {
                    const userAuctions = snapshotValue || {
                        nbPyAwaiting: 0,
                        nbPyPending: 0,
                    };
                    commit("SET_USER_INFOS", Object.assign(userAuctions, userInfos.data));
                }, { channel: userInfos.url })
                .catch(error => {
                    if (typeof _errs !== 'undefined') {
                        leErrs.meta.Code = error.code;
                        leErrs.track(new Error("userFirebase initialize : " + error.message));
                    }
                });
            })
            .catch((error) => {
                commit("SET_ERROR", error.message);
                if (typeof error.user !== 'undefined') {
                    commit("SET_USER_INFOS", error.user);
                }
            });
    },
};

const mutations = {
    SET_USER_INFOS: (state, data) => {
        state.userInfos = data;
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
