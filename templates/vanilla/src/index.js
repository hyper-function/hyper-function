export default class AwesomeHfc {
  constructor(props) {
    console.log("get props: " + props);
  }
  connected(container) {
    container.innerHTML =
      "<marquee>This component can be used in React, Vue, Angular, Svelte, Solid ...</marquee>";
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
