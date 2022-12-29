/* eslint-disable import/no-mutable-exports */
/* eslint-disable global-require */
let firebaseDbInit;
let setUserInfos;

if (__BUILD__ === "legacy") {
  firebaseDbInit = require("./_bootstrap/firebase.legacy").firebaseDbInit;
  setUserInfos = require("./_bootstrap/firebase.legacy").setUserInfos;
} else {
  firebaseDbInit = require("./_bootstrap/firebase").firebaseDbInit;
  setUserInfos = require("./_bootstrap/firebase").setUserInfos;
}


export { firebaseDbInit, setUserInfos };
