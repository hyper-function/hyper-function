import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import Document from "./views/Document.vue";

import "./main.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Document,
    },
  ],
});

createApp(App).use(router).mount("#app");
