import "./index.css";
import { vueToHfc } from "vue-to-hfc";
import Component from "./component.vue";

export default vueToHfc(Component, {
  tag: "div",
  hfc: process.env.HFC_NAME,
  ver: process.env.HFC_VERSION,
  names: process.env.HFC_PROP_NAMES,
  connected: (container, props) => {},
  disconnected: () => {},
});
