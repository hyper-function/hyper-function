import { toHFC } from "preact-to-hfc";
import Component from "./component";

export default toHFC(Component, {
  tag: "div",
  hfc: process.env.HFC_NAME,
  ver: process.env.HFC_VERSION,
  names: process.env.HFC_PROP_NAMES,
  connected(container) {},
  disconnected() {},
});
