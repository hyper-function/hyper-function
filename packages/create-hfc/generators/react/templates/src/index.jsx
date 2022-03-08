import React from "react";
import reactToHfc from "react-to-hfc";

function Component() {
  return <div>Hyper Function Component By React</div>;
}

export default reactToHfc(Component, {
  connected(container, props) {},
  disconnected() {},
});
