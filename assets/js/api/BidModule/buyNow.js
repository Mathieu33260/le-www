import http from "../../services/http";

export const postCheckout = params => new Promise((resolve) => {
  http
    .post("/paiement/createCheckout", params)
    .then((response) => {
      resolve(response)
    });
});
