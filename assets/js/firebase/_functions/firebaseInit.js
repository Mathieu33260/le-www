import Firebase from "firebase/app";
import Config from "../../config";

/* Firebase bootstrap */
const config = {
  apiKey: Config.get("firebase.config").apiKey,
  authDomain: Config.get("firebase.config").authDomain,
  databaseURL: Config.get("firebase.config").baseuri,
  projectId: Config.get("firebase.config").projectId,
};

const firebaseApp = Firebase.initializeApp(config);

export default firebaseApp;
