import { fetchMeta } from "./meta.js";

async function init() {
  updateHfcDoc = updateHfcDoc.bind(this);

  await fetchMeta(true);
  listenEvents();
}
window.init = init;

function listenEvents() {
  const eventSource = new EventSource("/sse");
  eventSource.addEventListener("error", (error) => {
    console.error("connect to dev server failed");
    console.error(error);
  });

  eventSource.addEventListener("event", (event) => {
    const data = JSON.parse(event.data);
    if (data.action === "update-hfc-markdown") {
      updateHfcDoc();
    }

    if (data.action === "rebuild-complete") {
      location.reload();
    }
  });
}

async function updateHfcDoc() {
  const html = await fetch(`/doc/index.html`).then((res) => res.text());

  this.$refs.content.style.minHeight = this.$refs.content.clientHeight + "px";
  this.showMdHtml = false;
  this.mdHtml = "";

  setTimeout(() => {
    this.mdHtml = html;

    updateHfcMdImgs();
    updatePreview();
    highlitCodeBlock();
    setTimeout(() => {
      this.showMdHtml = true;
    }, 100);
  }, 0);
}
window.updateHfcDoc = updateHfcDoc;

function packTypes(obj, level, types) {
  return Object.keys(obj).map((name) => {
    const item = obj[name];

    if (typeof item.t === "string") {
      if (item.t[0] === "#") {
        item.type = {
          "#s": "String",
          "#i": "Int",
          "#f": "Float",
          "#b": "Boolean",
          "#a": "Any",
        }[item.t];
      } else {
        item.isObject = true;
        const type = types[item.t];
        item.type = `${item.t} (${Object.keys(type.t).length})`;
      }
    } else {
      item.isObject = true;
      item.type = `Object (${Object.keys(item.t).length})`;
    }

    item.types = types;
    item.level = level || 0;
    item.name = name;
    return item;
  });
}

async function updatePropTypes() {
  const meta = await fetchMeta();
  const propTypes = await fetch(
    `/${meta.name}@${meta.version}/hfc.props.json`
  ).then((res) => res.json());

  this.attrs = packTypes(propTypes.attrs, 0, propTypes.types);

  this.events = Object.keys(propTypes.events).map((name) => {
    const event = propTypes.events[name];
    return {
      name,
      desc: propTypes.desc.events[name] || "",
      t: event,
      type: `Function (${Object.keys(event).length})`,
      types: propTypes.types,
      isObject: true,
      level: 0,
    };
  });

  this.slots = Object.keys(propTypes.slots).map((name) => {
    const slot = propTypes.slots[name];
    return {
      name,
      desc: propTypes.desc.slots[name] || "",
      t: slot,
      type: `Slot (${Object.keys(slot).length})`,
      types: propTypes.types,
      isObject: true,
      level: 0,
    };
  });
}
window.updatePropTypes = updatePropTypes;

async function showSubType(arr, item, index) {
  if (!item.isObject) return;
  if (item.expanded) return;

  let items = [];
  if (
    item.type.startsWith("Object") ||
    item.type.startsWith("Function") ||
    item.type.startsWith("Slot")
  ) {
    items = packTypes(item.t, item.level + 1, item.types);
  } else {
    const type = item.types[item.t];
    items = packTypes(type.t, item.level + 1, item.types);
  }

  if (items.length) {
    arr.splice(index + 1, 0, ...items);
  }

  item.expanded = true;
}
window.showSubType = showSubType;

function highlitCodeBlock() {
  Promise.resolve().then(() => {
    window.Prism.highlightAll();
  });
}

async function updateHfcMdImgs() {
  const meta = await fetchMeta();
  Promise.resolve().then(() => {
    document.querySelectorAll("#hfc-doc img").forEach((imgElem) => {
      if (imgElem.dataset.src) {
        imgElem.src = `/doc/imgs/${imgElem.dataset.src}`;
      }
    });
  });
}

const hfcJsSrc = document.getElementById("hfz-script").src;
function updatePreview() {
  Promise.resolve().then(() => {
    document.querySelectorAll("[data-hfz]").forEach(async (container) => {
      container.classList = ["preview-container"];

      let code = container.dataset.hfz;
      container.setAttribute("data-hfz", "");

      const meta = await fetchMeta();
      const origin = location.origin;

      const preview = new hfcPreview.HfcPreview(container);
      preview.onLoad(() => {
        preview.eval(`
window["$HFC_CDN_REWRITE_${meta.name}@${meta.version}"] = "${origin}";

(function () {
  var container = document.getElementById("app");
  container.innerHTML = decodeURIComponent("${code}");

  function appendScript(script) {
    document.head.appendChild(script);
    document.head.removeChild(script);
  }

  container.querySelectorAll("script").forEach(item => {
    var script = document.createElement("script");
    script.innerHTML = item.innerHTML;
    appendScript(script);
  });

  var script = document.createElement("script");
  script.src = "${hfcJsSrc}";
  appendScript(script);
})();`);
      });
    });
  });
}
