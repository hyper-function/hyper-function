import * as React from "react";
import * as ReactDom from "react-dom";

console.log(ReactDom);
import "./index.css";

export default class HFC {
  constructor(props) {}
  connected(container) {
    // container.innerHTML = `<button class="btn">AWA BTN!</button>`;
    ReactDom.render(
      React.createElement("button", { className: "btn" }, "AWA BTN!@!"),
      container
    );
  }
  disconnected() {}
}
