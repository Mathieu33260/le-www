import http from "../../services/http";

const setUserInfosBase = authInit => new Promise((resolve, reject) => {
  http.get('/user/appdata').then((response) => {
    if (Object.keys(response.data).length === 0) {
      reject(new Error("User not logged"));
    }

    authInit(response.data).then((value) => {
      resolve({
        url: value,
        data: response.data,
      });
    }).catch(error => reject(error))
  });
});

export default setUserInfosBase;
