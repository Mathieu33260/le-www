import http from "../../../services/http";

const moment = require('moment');

const errsIsDefined = typeof _errs !== 'undefined';
/**
 * unique can be used to return unique values of an array with filter
 * Usage: myArray.filter(unique)
 * @param {*} value
 * @param {*} index
 * @param {*} self
 */
const unique = (value, index, self) => self.indexOf(value) === index;
const filterByString = (array, key, str) => str ? array.filter(item => item[key] === str) : array;
const filterByMonth = (array, key, str) => str ? array.filter(item => moment(item.travelInfos[key]).format('MMMM') === str) : array;
/*
* unwindBy([{a:1, b:[1,2,3]}, {a:2, b:[3,4,5]}], 'b');
* => [{a:1, b:1}, {a:1, b:2}, {a:1, b:3}, {a:2, b:3}, {a:2, b:4}, {a:2, b:5}]
 */
const unwindBy = (arr, key) => arr.reduce((acc, val) => acc.concat(val[key].map(item => ({ ...val, [key]: item }))), []);

const state = {
  allAvailabilities: [],
  selectedCity: '',
  selectedMonth: '',
  productId: '',
  auctionId: '',
  auctionUuId: '',
  openModal: false,
  error: null,
  backupInProgress: false,
  lengthOfDay: 0,
  lengthOfNight: 0,
  automaticallyShowModal: true,
};

const getters = {
  cities: state => filterByMonth(state.allAvailabilities, 'dateTrip', state.selectedMonth).map(availability => availability.city).filter(unique),
  months: state => filterByString(state.allAvailabilities, 'city', state.selectedCity).map(availability => moment(availability.travelInfos.dateTrip).format('MMMM')).filter(unique),
  choices: state => {
    let result = filterByString(state.allAvailabilities, 'city', state.selectedCity);
    result = filterByMonth(result, 'dateTrip', state.selectedMonth);
    return result;
  },
  openModal: state => state.openModal,
  getError: state => state.error,
  selectedCity: (state, getters, commit) => {
    if (state.selectedCity !== '') {
      return state.selectedCity;
    }
    if (getters.availability) {
      const city = getters.availability.city;
      state.selectedCity = city;
      return city;
    }
    return '';
  },
  selectedMonth: (state, getters, commit) => {
    if (state.selectedMonth !== '') {
      return state.selectedMonth;
    }
    if (getters.availability && getters.availability.travelInfos) {
      const month = moment(getters.availability.travelInfos.dateTrip).format('MMMM');
      state.selectedMonth = month;
      return month;
    }
  },
  userAuction: (state, getters, rootGetters) => rootGetters.UserDatas.userInfos.auCurrent,
  userBider: (state, getters) => {
    const auCurrent = getters.userAuction;
    if (auCurrent && auCurrent[state.auctionUuid]) {
      return auCurrent[state.auctionUuid].hasBid === '1';
    }
    return false;
  },
  userBookingOption: (state, getters, rootGetters) => rootGetters.UserDatas.userInfos.bookingOption,
  backupInProgress: state => state.backupInProgress,
  availability: (state, getters) => {
    if (state.allAvailabilities.length === 0 || getters.userBookingOption === undefined || getters.userBookingOption[state.productId] === undefined) {
      return {};
    }
    const result = state.allAvailabilities.filter(availability => availability.travelInfos.id === getters.userBookingOption[state.productId].availabilityId)[0];
    if (result === undefined) {
      return {};
    }
    const days = state.lengthOfDay !== 0 ? state.lengthOfDay : state.lengthOfNight
    result.travelInfos.returnDate = moment(result.travelInfos.dateTrip).add(days, 'days');
    state.backupInProgress = false;
    return result;
  },
  allAvailabilities: state => state.allAvailabilities,
  length: state => {
    // String of length of stay
    let str = '';
    if (state.lengthOfDay !== 0) {
      str = state.lengthOfDay + ' jours'
    }
    if (state.lengthOfNight !== 0) {
      if (state.lengthOfDay === 0) {
        const days = state.lengthOfNight + 1;
        str = days + ' jours';
      }
      str += ' / ' + state.lengthOfNight + ' nuits'
    }

    return str;
  },
  automaticallyShowModal: state => state.automaticallyShowModal,
};

const actions = {
  saveOption({ commit, state, getters }, data) {
    state.backupInProgress = true;
    const params = new FormData();
    const bookingOptionId = getters.userBookingOption && getters.userBookingOption[state.productId] ? getters.userBookingOption[state.productId].bookingOptionId : null;
    params.append('auctionId', state.auctionId);
    params.append('availabilityId', data.availabilityId);
    if (bookingOptionId) {
      params.append('bookingOptionId', bookingOptionId);
      if (data.cancel) {
        params.append('cancel', true);
      }
    }

    http.post("/reservation/option", params).catch((error) => {
      if (this.$root.$options.methods.errsIsDefined()) {
          leErrs.meta.Code = error.code;
          leErrs.track(new Error("chooseDate store saveOption : " + error.message));
      }
      this.error = error.response.data.message;
      state.backupInProgress = false;
    });
  },
  recoversAvailability({ commit }, paramsObj) {
    if (state.productId === null) {
      if (errsIsDefined) {
        const pathName = window.location.pathname;
        leErrs.track(new Error("State 'productId' is null in availabilities store for " + pathName));
      }
      state.error = 'productId is null';
    } else if (state.auctionId === null) {
      if (errsIsDefined) {
        const pathName = window.location.pathname;
        leErrs.track(new Error("State 'auctionId' is null in availabilities store for " + pathName));
      }
      state.error = 'auctionId is null';
    } else {
      if (paramsObj === undefined) {
        paramsObj = {};
      }
      http.get("/product/" + state.productId, {
        params: Object.assign(paramsObj, {
          data: 'availabilities',
          auction: state.auctionId,
          relativeToNbDay: true,
        }),
      }).then((response) => {
        const result = unwindBy(response.data.departureCities, "availabilities").map(item => {
          const renamedItem = {...item, travelInfos: item.availabilities };
          delete renamedItem.availabilities;
          return renamedItem;
        });
        commit('SET_DEPARTURE_CITIES', result);
      }).catch((error) => {
        // handle error
        state.error = "Error while retrieving availability";
        if (errsIsDefined) {
          leErrs.meta.Code = error.code;
          leErrs.track(new Error("Error in actions 'recoversAvailability': " + error.response.statusText + " productId: " + state.productId + ", auctionId: " + state.auctionId));
        }
      });
    }
  },
  setProductId({ commit }, id) {
    commit("SET_PRODUCT_ID", id);
  },
  setAuctionId({ commit }, id) {
    commit("SET_AUCTION_ID", id);
  },
  setAuctionUuid({ commit }, id) {
    commit("SET_AUCTION_UUID", id);
  },
  setSelectedCity({ commit }, city) {
    commit("SET_SELECTED_CITY", city);
  },
  setSelectedMonth({ commit }, city) {
    commit("SET_SELECTED_MONTH", city);
  },
  setLengthOfDay({ commit }, day) {
    commit("SET_LENGTH_OF_DAY", day);
  },
  setLengthOfNight({ commit }, day) {
    commit("SET_LENGTH_OF_NIGHT", day);
  },
  openModal({ commit }) {
    commit("OPEN_MODAL");
  },
  setAutomaticallyShowModal({ commit }, val) {
    commit("SET_AUTOMATICALLY_SHOW_MODAL", val);
  },
};

const mutations = {
  SET_PRODUCT_ID: (state, id) => {
    state.productId = id;
  },
  SET_AUCTION_ID: (state, id) => {
    state.auctionId = id;
  },
  SET_AUCTION_UUID: (state, id) => {
    state.auctionUuid = id;
  },
  SET_DEPARTURE_CITIES: (state, data) => {
    state.allAvailabilities = data;
  },
  OPEN_MODAL: (state) => {
    state.openModal = !state.openModal;
  },
  SET_SELECTED_CITY: (state, city) => {
    state.selectedCity = city;
  },
  SET_SELECTED_MONTH: (state, month) => {
    state.selectedMonth = month;
  },
  SET_LENGTH_OF_DAY: (state, day) => {
    state.lengthOfDay = day;
  },
  SET_LENGTH_OF_NIGHT: (state, day) => {
    state.lengthOfNight = day;
  },
  SET_AUTOMATICALLY_SHOW_MODAL: (state, val) => {
    state.automaticallyShowModal = val;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
