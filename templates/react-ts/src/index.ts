import reactToHfc from "react-to-hfc";
import Component from "./component";

export default reactToHfc(Component, {
  connected(container, props) {},
  disconnected() {},
});
