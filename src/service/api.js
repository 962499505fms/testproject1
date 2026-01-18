import axiosService from "./axios-service";
const commonUrl = "/visualization";
export default {
  getThemesAPI() {
    return axiosService.get(`${commonUrl}/themes`);
  },
};
