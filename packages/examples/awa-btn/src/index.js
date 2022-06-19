export default class HFC {
  constructor(props) {
    console.log("con");
  }
  connected(container) {
    console.log("conn");
    container.innerHTML = "<button>AWA BTN</button>";
  }
  disconnected() {}
}
