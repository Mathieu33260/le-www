import http from '../../services/http';

const state = {
    lastTracked: null,
    schema: {},
    isFinished: null,
    isRunning: null,
};

const getters = {
    lastTracked: state => state.lastTracked,
    schema: state => state.schema,
    isFinished: state => state.isFinished,
    isRunning: state => state.isRunning,
};

const actions = {
    setFinished({ commit }, val) {
        commit('CHANGE_FINISHED', val)
    },
    setRunning({ commit }, val) {
        commit('CHANGE_RUNNING', val)
    },
    setSchema({ commit }, data) {
        commit('SET_SCHEMA', data)
    },
    lastTracked({ commit }, params) {
        commit('SET_LAST_TRACKED', params)
    },
    defineVariation({ commit }, abtestName) {
        const possibleAbTest = ['priceRange', 'buyNow'];
        if (possibleAbTest.indexOf(abtestName) === -1) {
            throw new Error("Invalid ab test");
        }
        http.get('/user/abtestvariation/' + abtestName).then((response) => {
            switch (abtestName) {
                case "priceRange":
                    commit("SET_ABTESTVARIATION_PRICE_RANGE", parseInt(response.data, 10));
                    break;
                case "buyNow":
                    commit("SET_ABTESTVARIATION_BUY_NOW", response.data);
                    break;
                default:
                    break;
            }
        }).catch((error) => {
            // handle error
            leErrs.track(error);
        });
    },
    auctionTracking({ commit }, params) {
        if (state.lastTracked !== null
            && params.auctionId === state.lastTracked.auctionId
            && params.key === state.lastTracked.key
            && params.value === state.lastTracked.value
        ) {
            return;
        }
        const data = new FormData();
        data.append('auction', params.auctionId);
        data.append('key', params.key);
        data.append('value', params.value);
        commit("SET_LAST_TRACKED", params);
        http.post("/user/auctiontracking", data);
    },
};

const mutations = {
    CHANGE_FINISHED: (state, val) => {
        state.isFinished = val
    },
    CHANGE_RUNNING: (state, val) => {
        state.isRunning = val
    },
    SET_LAST_TRACKED: (state, params) => {
        state.lastTracked = params
    },
    SET_SCHEMA: (state, data) => {
        state.schema = data
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
