// https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingTiming
const state = {
    category: '',
    variable: '',
    label: '',
    startTime: '',
    endTime: '',
};

const setters = {
    initialize(category, variable, opt_label) {
        state.category = category;
        state.variable = variable;
        state.label = opt_label ? opt_label : undefined;
        state.startTime = new Date().getTime();
        return this;
    },
    endTime() {
        state.endTime = new Date().getTime();
        return this;
    }
};

const send = function() {
    let timeSpent = state.endTime - state.startTime;
    if(typeof ga !== 'undefined') {
        ga('send', 'timing', this.category, this.variable, timeSpent, this.label);
    }
    return this;
};

export default {state, setters, send}