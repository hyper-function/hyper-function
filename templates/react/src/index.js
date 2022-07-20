import props from "hfc-prop-names";
import reactToHfc from "react-to-hfc";
import Component from "./component";

export default reactToHfc(Component, {
  tag: "div",
  props,
  connected(container, props) {},
  disconnected() {},
});
