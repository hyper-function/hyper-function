import { reactToHfc } from "react-to-hfc";
import Component from "./component";

export default reactToHfc(Component, {
  tag: "div",
  hfc: process.env.HFC_NAME!,
  ver: process.env.HFC_VERSION!,
  names: process.env.HFC_PROP_NAMES as any,
  connected(container, props) {},
  disconnected() {},
});
