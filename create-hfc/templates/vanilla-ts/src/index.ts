import "./index.css";

const HFC: HyperFunctionComponent = (container, props) => {
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

  return { changed(props: HfcProps) {}, disconnected() {} };
};

HFC.tag = "div";
// @ts-ignore
HFC.hfc = process.env.HFC_NAME;
// @ts-ignore
HFC.ver = process.env.HFC_VERSION;
// @ts-ignore
HFC.names = process.env.HFC_PROP_NAMES;

export default HFC;
