import svelteToHfc from "svelte-to-hfc";
import Component from "./component.svelte";

export default svelteToHfc(Component, {
  tag: "div",
  hfc: process.env.HFC_NAME,
  ver: process.env.HFC_VERSION,
  names: process.env.HFC_PROP_NAMES,
  connected(container, props) {},
  disconnected() {},
});
