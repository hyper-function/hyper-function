import "./index.css";
import vueToHfc from "vue-to-hfc";
import props from "hfc-prop-names";
import Component from "./component.vue";

export default vueToHfc(Component, {
  tag: "div",
  props,
  connected: (container, props) => {},
  disconnected: () => {},
});
