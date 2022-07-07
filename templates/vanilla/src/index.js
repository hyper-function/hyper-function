import "./index.css";

class AwesomeHfc {
  constructor(container, props) {
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
  changed(props) {}
  disconnected() {}
}

AwesomeHfc.tag = "div";

export default AwesomeHfc;
