import "firebase/database";
import firebaseApp from "./firebaseInit";
import Config from "../../config";

const database = firebaseApp.database();

// We can have many env that use the same firebaseDB, so we put them in sub directories.
// But the default env (local or prod for example) doesn't use sub directories
const path = Config.get("firebase.config").path ? Config.get("firebase.config").path + '/' : '';

/********** DATABASE **********/

function dbSubscribe(callback, { channel, params, rawSnapshot = false }) {
  return new Promise((resolve, reject) => {
    let ref;
    const channelWithPath = path + channel;
    if (params) {
      ref = database.ref(channelWithPath).orderByChild(params.ordering).limitToFirst(params.limit);
    } else {
      ref = database.ref(channelWithPath);
    }

    if (rawSnapshot) {
      let currentBid = {};
      ref.on("value", (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            currentBid = JSON.stringify(childSnapshot);
          });
          resolve(callback(currentBid));
        },
        (errorObject) => {
          reject(errorObject);
        });
    } else {
      ref.on("value", (snapshot) => {
          resolve(callback(snapshot.val()))
        },
        (errorObject) => {
          reject(errorObject);
        });
    }
  })
}

export default dbSubscribe;
