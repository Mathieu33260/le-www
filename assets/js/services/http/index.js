import axios from "axios";

// Force header XMLHttpRequest
axios.defaults.headers.common['x-requested-with'] = 'XMLHttpRequest';

const http = axios.create({
  /* To be replaced with ENV params */
});

export default http;
