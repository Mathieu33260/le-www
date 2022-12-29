import http from '../../../services/http';

export const fetchAuctions = (urlAuctions, urlData, nbAuctions, offsetAuctions, upcoming) => new Promise((resolve, reject) => {
  let url = `${urlAuctions}?limit=${nbAuctions}`;
  if (offsetAuctions) {
    url += `&offset=${offsetAuctions}`;
  }
  if (upcoming) {
    url += `&upcoming=${upcoming}`;
  }
  http.get(url, {
    params: urlData,
  })
  .then((response) => {
    resolve(response.data);
  })
  .catch((error) => {
    reject(error);
  });
});
