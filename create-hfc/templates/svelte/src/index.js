import svelteToHfc from "svelte-to-hfc";
import Component from "./component.svelte";

export default svelteToHfc(Component, {
  tag: "div",
  connected(container, props) {},
  disconnected() {},
});
