import Vue from "vue";

import Router from "vue-router";
Vue.use(Router);

const routes = [
  { path: "/", redirect: "/canvas" },

  {
    path: "/canvas",
    name: "canvas",
    component: () => import("views/ai-canvas/canvas/index.vue"),
  },
];

const router = new Router({
  routes,
});

export default router;
