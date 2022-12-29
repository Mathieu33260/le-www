/* eslint no-shadow: 0 */
/* eslint no-param-reassign: 0 */
const state = {
    openLoginModal: false,
    openRegisterModal: false,
    openLostPasswordModal: false,
    openMissingEmailmodal: false,
    formName: '',
    facebookToken: '',
    missingEmailComplete: {},
    register2Step: false,
    data2Step: {},
    registerError: {},
    loginError: {},
};

const getters = {
    openLoginModal: state => state.openLoginModal,
    openRegisterModal: state => state.openRegisterModal,
    openLostPasswordModal: state => state.openLostPasswordModal,
    openMissingEmailmodal: state => state.openMissingEmailmodal,
    facebookToken: state => state.facebookToken,
    missingEmailComplete: state => state.missingEmailComplete,
    register2Step: state => state.register2Step,
    data2Step: state => state.data2Step,
    registerError: state => state.registerError,
    loginError: state => state.loginError,
};

const actions = {
    openLoginModal({ commit }) {
        commit('SET_OPEN_LOGIN_MODAL')
    },
    facebookToken({ commit }, data) {
        commit('SET_FACEBOOK_TOKEN', data)
    },
    missingEmailComplete({ commit }, data) {
        commit('SET_MISSING_EMAIL_COMPLETE', data)
    },
    openMissingEmailmodal({ commit }) {
        commit('SET_OPEN_MISSING_EMAIL_MODAL')
    },
    openLostPasswordModal({ commit }) {
        commit('SET_OPEN_LOST_PASSWORD_MODAL')
    },
    register2Step({ commit }, data) {
        commit('REGISTER_2_STEP', data)
    },
    setData2Step({ commit }, data) {
        commit('SET_DATA_2_STEP', data)
    },
    setError({ commit }, obj) {
        if (obj.message === 'popup_blocked_by_browser') {
            obj.message = "Votre navigateur bloque l'ouverture de la fenêtre d'inscription";
        }

        let errors = {};
        const authType = obj.authType;
        if (authType === 'login') {
            errors = state.loginError;
        }
        if (authType === 'register') {
            errors = state.registerError;
        }

        commit('SET_ERROR', {
            ...errors,
            ...obj,
        });
    },
    openRegisterModal({ commit }, data) {
        if (!state.openRegisterModal) {
            // the modal is going to open
            state.formName = typeof data === 'string' ? data : '';
        }

        let step = 'step';
        if (state.formName !== '') {
            step += ' - ' + state.formName;
        }

        if (!state.openRegisterModal) {
            ga('send', 'event', 'subscription', step + ' - start');
        } else {
            ga('send', 'event', 'subscription', step + ' - closed');
        }
        commit('SET_OPEN_REGISTER_MODAL')
    },
};

const mutations = {
    SET_OPEN_LOGIN_MODAL: (state) => {
        state.openLoginModal = !state.openLoginModal
    },
    SET_OPEN_MISSING_EMAIL_MODAL: (state) => {
        state.openMissingEmailmodal = !state.openMissingEmailmodal
    },
    SET_OPEN_LOST_PASSWORD_MODAL: (state) => {
        state.openLostPasswordModal = !state.openLostPasswordModal
    },
    SET_OPEN_REGISTER_MODAL: (state) => {
        state.openRegisterModal = !state.openRegisterModal
    },
    SET_FACEBOOK_TOKEN: (state, data) => {
        state.facebookToken = data
    },
    SET_MISSING_EMAIL_COMPLETE: (state, data) => {
        state.missingEmailComplete = data
    },
    REGISTER_2_STEP: (state, data) => {
        state.register2Step = data
    },
    SET_DATA_2_STEP: (state, data) => {
        state.data2Step = data
    },
    SET_ERROR: (state, data) => {
        const authType = data.authType;
        delete data.authType;

        if (authType === 'login') {
            state.loginError = data;
        }
        if (authType === 'register') {
            state.registerError = data;
        }
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
