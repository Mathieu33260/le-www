const state = {
  paneActive: "",
};

const getters = {
  paneActive: state => state.paneActive,
};

const mutations = {
  SET_PANE_NAME: (state, name) => {
    state.paneActive = name;
  },
};

const actions = {
  switchTo(context, name) {
    context.commit("SET_PANE_NAME", name);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
