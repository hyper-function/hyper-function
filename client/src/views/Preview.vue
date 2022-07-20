<template>
  <div class="main">
    <div class="nav">
      <ul class="list">
        <li v-for="item in ['Readme', 'PropTypes']" @click="activeTab = item">
          <div :class="{ tab: true, active: item === activeTab }">
            {{ item }}
          </div>
        </li>
      </ul>
    </div>
    <div class="container">
      <div v-show="activeTab === 'Readme'" class="content">
        <div id="hfc-doc" class="docs markdown-body" ref="docContainer"></div>
      </div>
      <div v-show="activeTab === 'PropTypes'" class="content">
        <Transition name="fade">
          <div class="prop-types">
            <PropTypes />
          </div>
        </Transition>
      </div>

      <div class="side-bar">
        <Sidebar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, watch, ref } from "vue";
import { iframeResize } from "iframe-resizer";
import Sidebar from "../components/Sidebar.vue";
import PropTypes from "../components/PropTypes.vue";

const meta = inject<any>("meta")!;
const docHtml = inject<any>("docHtml")!;
const docContainer = ref<HTMLDivElement | null>(null);
const activeTab = ref("Readme");

watch(() => docHtml, renderHfcDoc, { deep: true });

function renderHfcDoc() {
  document.title = meta.value.name;
  const elem = docContainer.value;
  if (!elem) return;

  // prevent page flashing when reloading
  elem.style.minHeight = elem.clientHeight + "px";

  elem.innerHTML = docHtml.value.text;
  renderHfcDocImgs();
  renderCodeBlock();
  renderHfcPreview();

  setTimeout(() => {
    elem.style.minHeight = "auto";
  }, 500);
}

function renderHfcDocImgs() {
  document
    .querySelectorAll<HTMLImageElement>("#hfc-doc img")
    .forEach((imgElem) => {
      if (imgElem.dataset.src) {
        imgElem.src = `/doc/imgs/${imgElem.dataset.src}`;
      }
    });
}

function renderCodeBlock() {
  const Prism = (window as any).Prism;
  if (Prism) Prism.highlightAll();
}

let sandboxes: HTMLIFrameElement[] = [];
function renderHfcPreview() {
  if (sandboxes.length) {
    sandboxes.forEach((sandbox) => {
      sandbox.remove();
    });
    sandboxes = [];
  }

  const containers = document.querySelectorAll<HTMLDivElement>("[data-hfz]");
  containers.forEach((container) => {
    const id = container.dataset.hfzId;

    let code = container.dataset.hfz;
    container.setAttribute("data-hfz", "");
    container.classList.add("hfz-preview");

    const sandbox = document.createElement("iframe");
    sandboxes.push(sandbox);
    sandbox.setAttribute(
      "sandbox",
      [
        "allow-same-origin",
        "allow-popups",
        "allow-modals",
        "allow-forms",
        "allow-pointer-lock",
        "allow-scripts",
        "allow-top-navigation-by-user-activation",
      ].join(" ")
    );

    sandbox.src = "/render/" + id;
    container.appendChild(sandbox);

    const actions = document.createElement("div");
    actions.style.position = "relative";

    actions.style.visibility = "hidden";
    actions.classList.add("hfz-preview-actions");

    const openBtn = document.createElement("button");
    openBtn.innerText = "OPEN";
    openBtn.addEventListener("click", () => {
      window.open("/render/" + id, "_blank");
    });

    const refreshBtn = document.createElement("button");
    refreshBtn.innerText = "REFRESH";
    refreshBtn.addEventListener("click", () => {
      (<any>sandbox).iFrameResizer.sendMessage({ action: "refresh" });
    });

    actions.appendChild(openBtn);
    actions.appendChild(refreshBtn);

    container.appendChild(actions);
    container.addEventListener("mouseenter", () => {
      actions.style.visibility = "visible";
    });
    container.addEventListener("mouseleave", () => {
      actions.style.visibility = "hidden";
    });

    iframeResize(
      {
        log: false,
        sizeHeight: false,
        checkOrigin: false,
        heightCalculationMethod: "grow",
        onInit() {},
        onResized(res: any) {
          if (res.height <= 16) return;
          sandbox.style.height = res.height + "px";
        },
      },
      sandbox
    );
  });
}
</script>
