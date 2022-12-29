import dbSubscribe from "../_functions/firebaseDatabase";
import authSubscribe from "../_functions/firebaseAuth";
import setUserInfosBase from "./setUserInfos";

/* In case of legacy bundle, we don't use a worker, but instead just export functions with the same name and signature
   to use them transparently once the firebase service has been mounted.
*/
export function firebaseDbInit(callback, channel) {
  return new Promise((resolve, reject) => {
    dbSubscribe(callback, channel)
    .then(() => resolve())
    .catch(error => reject(error));
  })
}

function authInit(User) {
  return new Promise((resolve, reject) => {
    authSubscribe(User)
    .then(value => resolve(value))
    .catch(error => reject(error));
  });
}

export const setUserInfos = () => setUserInfosBase(authInit);
