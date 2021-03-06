import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import Preview from "./views/Preview.vue";

import "../css/style.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Preview,
    },
  ],
});

createApp(App).use(router).mount("#app");
