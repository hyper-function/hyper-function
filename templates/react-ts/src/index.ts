import reactToHfc from "react-to-hfc";
import Component from "./component";

export default reactToHfc(Component, {
  tag: "div",
  connected(container, props) {},
  disconnected() {},
});
