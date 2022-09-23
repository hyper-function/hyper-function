import "./index.css";

const HFC: HyperFunctionComponent = (container, props) => {
  container.innerHTML = `
      <h1>
        <div>THIS COMPONENT</div>
        <div>CAN BE USED IN</div>
        <div class="brand">
          <ul>
            <li>React</li>
            <li>Vue</li>
            <li>Hfz</li>
            <li>Angular</li>
            <li>WebComponents</li>
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
