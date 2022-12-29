import Vue from "vue";
import moment from "moment";

import { noprotocol, imgForList, transf } from "./function/ass.imageService";

Vue.filter("noprotocol", url => noprotocol(url));
Vue.filter("transf", (url, cloudinaryTransString) => transf(url, cloudinaryTransString));
Vue.filter("trim", str => (str ? str.trim() : ""));
Vue.filter("toLowerCase", str => (str ? str.toLowerCase() : ""));
Vue.filter("uppercase", str => (str ? str.toUpperCase() : ""));
Vue.filter("capitalize", str => (str ? str[0].toUpperCase() + str.slice(1) : ""));
Vue.filter("imgForList", images => imgForList(images));
Vue.filter("moment", (value, format) => moment(value).format(format))
