import "./index.css";
import add from "./add";
import logo from "./jser-logo.png";
import { createApp } from "vue";
import * as React from "react";
import * as ReactDom from "react-dom";
import svg from "./heart.svg";

console.log(createApp);
console.log(React);
console.log(ReactDom);

const HFC = function (container, props) {
  console.log(props);
  const btn = document.createElement("button");
  btn.classList.add("btn");
  btn.innerText = "AWA BTN!!!";
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

  return {
    changed(props) {
      console.log(props);
    },
    disconnected() {},
  };
};

HFC.tag = "div";
HFC.hfc = process.env.HFC_NAME;
HFC.ver = process.env.HFC_VERSION;
HFC.names = process.env.HFC_PROP_NAMES;

export default HFC;
