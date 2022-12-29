import "firebase/auth";
import firebaseApp from "./firebaseInit";

const auth = firebaseApp.auth();

/********** AUTH ***********/

const fireAuth = User => new Promise((resolve, reject) => {
  if (User.firebaseToken) {
    if (auth.currentUser === null || parseInt(User.num, 10) !== parseInt(auth.currentUser.uid, 10)) {
      auth
      .signInWithCustomToken(User.firebaseToken)
      .then(() => {
        /* eslint no-param-reassign: 0 */
        User.firebaseToken = null;
        /* eslint no-param-reassign: 1 */
        resolve(true);
      })
      .catch((error) => {
        if (typeof _errs !== 'undefined') {
          leErrs.meta.firebaseToken = User.firebaseToken;
          leErrs.meta["User num"] = User.num;
          leErrs.meta.Code = error.code;
          leErrs.track(new Error("Firebase signInWithCustomToken : " + error.message));
        }
        reject(new Error(error.message));
      });
    } else {
      resolve(true);
    }
  } else {
    reject();
  }
});

function authSubscribe(User) {
  return new Promise((resolve, reject) => {
    if (User) {
      fireAuth(User).then((value) => {
        if (value) {
          auth.onAuthStateChanged((user) => {
            if (user && parseInt(User.num, 10) === parseInt(auth.currentUser.uid, 10)) {
              resolve("users/" + User.num);
            }
          });
        }
      }, (error) => {
        if (error) {
          reject(new Error(error));
        }
      });
    }
  })
};

export default authSubscribe;
