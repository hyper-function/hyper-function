import "./index.css";
import add from "./add";
import logo from "./jser-logo.png";
import propNames from "hfc-prop-names";
import svg from "./heart.svg";

export default class HFC {
  static tag = "div";
  static propNames = propNames;
  constructor(container, props) {
    console.log(props);
    const btn = document.createElement("button");
    btn.classList.add("btn");
    btn.innerText = "AWA BTN!!!";
    btn.onclick = function () {
      props.events.click();
    };
    const c = add(1, 2);
    console.log(c);

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
