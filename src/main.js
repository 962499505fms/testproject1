import Vue from "vue"; import PUI from "pUI";
import * as echarts from "echarts";
import i18n from "@/locale"; import router from "@/router";
import store from "@/store"; import App from "@/App.vue";
import HTTP from "@/service/apis";
import Utils from "@/libs/utils";
import { registerwidgets } from '@/libs/widgetlist';

const isDev = process.env.NODE_ENV === "development";
if (isDev) {
    registerWidgets(Vue);
}
Vue.use(PUI, {
    i18n: function (path, options) {
        return i18n.t(path, options)

    }
})

window.isDev = isDev;
const prefixKey = "PLAT unified prefix";

Vue.prototype.$Http = HTTP;
Vue.prototype.$echarts = echarts;
Vue.prototype.$utils = Utils;
Vue.prototype.$theme = window.localstorage["themeId"] || "star";
Vue.prototype.$lang = window.localstorage["language"] || "zh";
Vue.prototype.$publicPath = window.localstorage[prefixKey] || '';

new Vue({
    router,
    i18n,
    store,
    render: h => h(App),
    beforecreate() {
        Vue.prototype.$bus = this;
    }
}).$mount("#app");