import { toHFC } from "preact-to-hfc";
import Component from "./component";

export default toHFC(Component, {
  tag: "div",
  // @ts-ignore
  hfc: process.env.HFC_NAME,
  // @ts-ignore
  ver: process.env.HFC_VERSION,
  // @ts-ignore
  names: process.env.HFC_PROP_NAMES,
  connected(container) {},
  disconnected() {},
});
