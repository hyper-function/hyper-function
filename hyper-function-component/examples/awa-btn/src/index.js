import "./index.css";
import add from "./add";
import logo from "./jser-logo.png";
import propNames from "hfc-prop-names";
import svg from "./heart.svg";

export default class HFC {
  static tag = "div";
  static propNames = propNames;
  constructor(container, props) {
    const btn = document.createElement("button");
    btn.classList.add("btn");
    btn.innerText = "AWA BTN!!!";
    btn.onclick = function () {
      props.events.click();
    };

    const img = document.createElement("img");
    img.src = logo;
    container.appendChild(btn);
    container.appendChild(img);
  }
  changed(props) {
    console.log(props);
  }
  disconnected() {}
}
