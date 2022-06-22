import "./index.css";

export default class HFC {
  constructor(props) {}
  connected(container) {
    container.innerHTML = `<button class="btn">AWA BTN!</button>`;
  }
  disconnected() {}
}
