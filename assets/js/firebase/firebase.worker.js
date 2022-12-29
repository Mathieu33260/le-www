import * as Comlink from "comlink";
import authSubscribe from "./_functions/firebaseAuth";
import dbSubscribe from "./_functions/firebaseDatabase";

/* Comlink "exposes" functions that can be used in a transparent way across the app once it has been wraped in the main thread */
Comlink.expose({ dbSubscribe, authSubscribe });
