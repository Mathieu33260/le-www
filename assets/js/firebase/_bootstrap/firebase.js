import * as ComLink from "comlink";
import Worker from "../firebase.worker";
import setUserInfosBase from "./setUserInfos";

const worker = new Worker();

self._workerFirebase = worker;

export const firebaseDbInit = (callback, channel) => {
  /* The wrap method extracts the methods exposed in Worker */
  const { dbSubscribe } = ComLink.wrap(worker);

  return new Promise((resolve, reject) => {
    /* We have to use the proxy method from Comlink for the callback to be correctly passed
       See https://github.com/GoogleChromeLabs/comlink#callbacks
    */
    dbSubscribe(ComLink.proxy(callback), channel)
    .then(() => resolve())
    .catch(error => reject(error));
  });
};

function authInit(User) {
  /* The wrap method extracts the methods exposed in Worker */
  const { authSubscribe } = ComLink.wrap(worker);

  /* Since authSubscribe doesn't need a callback, we can avoid the use of the Comlink proxy method */
  return new Promise((resolve, reject) => {
    authSubscribe(User)
    .then(value => resolve(value))
    .catch(error => reject(error));
  });
}

export const setUserInfos = () => setUserInfosBase(authInit);
