import "./index.css";

const HFC = (container, props) => {
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

  return { changed(props) {}, disconnected() {} };
};

HFC.tag = "div";
HFC.hfc = process.env.HFC_NAME;
HFC.ver = process.env.HFC_VERSION;
HFC.names = process.env.HFC_PROP_NAMES;

export default HFC;
