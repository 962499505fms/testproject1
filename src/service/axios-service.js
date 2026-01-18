import axios from "axios";
const prefixKey = "pLAT_unified_prefix";
const basePath = localStorage.getItem(prefixKey);
const isDev = process.env.NODE_ENV === "development";
let publicPath = basePath && !isDev ? basePath : "";
// if (isDev) {
//   require("@/libs/getCookieByAuto__dev/autoCookie.js");
// }

const axiosInstanse = axios.create({
  baseURL: publicPath,
});

axiosInstanse.interceptors.request.use(
  (res) => {
    return res;
  },
  (err) => {
    return Promise.rejecterr;
  },
);

axiosInstanse.interceptors.response.use(
  (rep) => {
    return rep.data;
  },
  (err) => {
    const res = err.response;
    if (res.status === 401) {
      window.location.href = `${publicPath}/central/resNoPermission.html`;
      return;
    }
    err.response.data.message && optMsg.fail(err.response.data.message);
    return Promise.reject(err);
  },
);

export default axiosInstanse;
