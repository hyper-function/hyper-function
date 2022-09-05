import deep from "lodash.defaultsdeep";
import "./index.css";
import add from "./add";
import logo from "./jser-logo.png";
import props from "hfc-prop-names";
import svg from "./heart.svg";

export default class HFC {
  static tag = "div";
  static props = props;
  constructor(container, props) {
    console.log(props);
    const btn = document.createElement("button");
    btn.classList.add("btn");
    btn.innerText = "AWA BTN!";
    btn.onclick = function () {
      console.log("dispatching click");
      setTimeout(() => {
        props.events.click();
      }, 50);
    };

    const img = document.createElement("img");
    img.src = logo;
    container.appendChild(btn);
    container.appendChild(img);

    if (props.slots.default) {
      const div = document.createElement("div");
      container.appendChild(div);
      props.slots.default(div);
    }
  }
  changed(props) {
    console.log(props);
  }
  disconnected() {}
}
