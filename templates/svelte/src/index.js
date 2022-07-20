import props from "hfc-prop-names";
import svelteToHfc from "svelte-to-hfc";
import Component from "./component.svelte";

export default svelteToHfc(Component, {
  tag: "div",
  props,
  connected(container, props) {},
  disconnected() {},
});
