import React from "react";
import reactToHfc from "react-to-hfc";
import logo from "./jser-logo.png";

function Component() {
  const [a, b] = [1, 2];
  return (
    <div>
      Hyper Function Component By React!
      <div>okok</div>
      <img src={logo} alt="logo" />
    </div>
  );
}

export default reactToHfc(Component, {
  connected(container, props) {},
  disconnected() {},
});
