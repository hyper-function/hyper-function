import "./index.css";
import { vueToHfc } from "vue-to-hfc";
import Component from "./component.vue";

export default vueToHfc(Component, {
  tag: "div",
  // @ts-ignore
  hfc: process.env.HFC_NAME,
  // @ts-ignore
  ver: process.env.HFC_VERSION,
  // @ts-ignore
  names: process.env.HFC_PROP_NAMES,
  connected: (container, props) => {},
  disconnected: () => {},
});
