import { toHFC, toHFCReact } from "react-to-hfc";
import Component from "./component";

const opts = {
  tag: "div",
  hfc: process.env.HFC_NAME,
  ver: process.env.HFC_VERSION,
  names: process.env.HFC_PROP_NAMES,
  connected(container) {},
  disconnected() {},
};

export default toHFC(Component, opts);
export let ReactHFC = toHFCReact(Component, opts);
