import propNames from "hfc-prop-names";
import "./index.css";

export default class AwesomeHfc {
  static tag = "div";
  static propNames = propNames;
  constructor(container: HTMLElement, props: HfcProps) {
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
  changed(props: HfcProps) {}
  disconnected() {}
}
