import "./index.css";
import vueToHfc from "vue-to-hfc";
import Component from "./component.vue";

export default vueToHfc(Component, {
  tag: "div",
  connected: (container, props) => {},
  disconnected: () => {},
});
