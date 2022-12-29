// Parse the yaml and transform it in json through the json-loader using the @filepath
let parameters = require("json-loader!yaml-loader!@/../../app/config/config.yml");
function get(key) {
  return parameters[key];
}
export default { get };
