export default class AwesomeHfc {
  constructor(props) {
    console.log("get props: " + props);
  }
  connected(container) {
    container.innerHTML = "<h1>awesome hfc</h1>";
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
