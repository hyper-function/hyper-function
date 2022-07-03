import "./index.css";

export default class AwesomeHfc {
  constructor(props) {
    console.log("get props: " + props);
  }
  connected(container) {
    container.innerHTML = `
      <h1>
        <div>THIS COMPONENT</div>
        <div>CAN BE USED IN</div>
        <div class="brand">
          <ul>
            <li>REACT</li>
            <li>VUE</li>
            <li>HFZ</li>
            <li>ANGULAR</li>
            <li>SVELTE</li>
          </ul>
        </div>
      </h1>`;
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
