/* eslint no-shadow: 0 */
/* eslint no-param-reassign: 0 */
const state = {
  openPubModal: false,
};

const getters = {
  openPubModal: state => state.openPubModal,
};

const actions = {
  openPubModal({ commit }) {
    commit('SET_OPEN_PUB_MODAL')
  },
};

const mutations = {
  SET_OPEN_PUB_MODAL: (state) => {
    state.openPubModal = !state.openPubModal
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
