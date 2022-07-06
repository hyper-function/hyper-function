import "./index.css";

export default class HFC {
  static tag = "div";
  constructor(container, props) {
    console.log(props);
    const btn = document.createElement("button");
    btn.classList.add("btn");
    btn.innerText = "AWA BTN!";
    btn.onclick = function () {
      props.events.click();
    };
    container.appendChild(btn);
  }
  changed(props) {
    console.log(props);
  }
  disconnected() {}
}
