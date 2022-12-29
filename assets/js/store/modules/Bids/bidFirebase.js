import { firebaseDbInit } from "../../../firebase"

const state = {
    bids: [],
    currentBid: {},
    endAuction: {},
};

const getters = {
    bids: state => state.bids,
    currentBid: state => state.currentBid,
    endAuction: state => state.endAuction,
};

const actions = {
    getFormattedBids({ commit, getters }, uuid, limit = 10) {
        firebaseDbInit((snapshotValue) => {
            if (!snapshotValue) return;
            return commit("SET_BIDS", Object.values(snapshotValue));
        }, { channel: `au/${uuid}/bids`, params: { ordering: "amountNegative", limit }})
        .catch((error) => {
            if (typeof _errs !== 'undefined') {
                leErrs.meta.Code = error.code;
                leErrs.track(new Error("bidFirebase getBids : " + error.message));
            }
        });
    },
    getBids({ commit }, uuid, limit = 10) {
        firebaseDbInit((snapshotValue) => {
            let bidsToCommit = [];
            if (snapshotValue) {
                bidsToCommit = $.map(snapshotValue, (value) => {
                    if (typeof value !== 'undefined') {
                        return [value];
                    }
                }).reverse();
            }
            commit("SET_BIDS", bidsToCommit);
        }, { channel: `au/${uuid}/bids`, params: { ordering: "amountNegative", limit }})
        .catch((error) => {
            if (typeof _errs !== 'undefined') {
                leErrs.meta.Code = error.code;
                leErrs.track(new Error("bidFirebase getBids : " + error.message));
            }
        });
    },
    setBidsFromApi({ commit }, bids) {
        commit("SET_BIDS", bids);
    },
    getCurrentBid({ commit }, uuid) {
        return new Promise((resolve) => {
            firebaseDbInit((currentBid) => {
                commit("SET_CURRENT_BID", Object.keys(currentBid).length ? JSON.parse(currentBid) : currentBid);
                resolve(true);
            }, { channel: `au/${uuid}/bids`, params: { ordering: "amountNegative", limit: 1 }, rawSnapshot: true })
            .catch((error) => {
                if (typeof _errs !== 'undefined') {
                    leErrs.meta.Code = error.code;
                    leErrs.track(new Error("bidFirebase getCurrentBid : " + error.message));
                }
            })
        });
    },
    getEndAuction({ commit }, uuid) {
        firebaseDbInit((snapshotValue) => {
            commit("SET_END_AUCTION", snapshotValue);
        }, { channel: `au/${uuid}/endAuction` })
        .catch((error) => {
            if (typeof _errs !== 'undefined') {
                leErrs.meta.Code = error.code;
                leErrs.track(new Error("bidFirebase getEndAuction : " + error.message));
            }
        });
    },
};

const mutations = {
    SET_BIDS: (state, data) => {
        state.bids = data;
    },
    SET_CURRENT_BID: (state, data) => {
        state.currentBid = data;
    },
    SET_END_AUCTION: (state, data) => {
        state.endAuction = data;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
