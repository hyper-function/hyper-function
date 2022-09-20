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
import { inject, watch, ref, compile } from "vue";
import { iframeResize } from "iframe-resizer";
import Sidebar from "../components/Sidebar.vue";
import PropTypes from "../components/PropTypes.vue";
import { debounce } from "../utils";

const meta = inject<any>("meta")!;
const docHtml = inject<any>("docHtml")!;
const hfcRebuildInfo = inject<any>("hfcRebuildInfo");
const docContainer = ref<HTMLDivElement | null>(null);
const activeTab = ref("Readme");

watch(() => docHtml.value, renderHfcDoc);
watch(() => hfcRebuildInfo.value, reloadHfcPreview);

function showEditor(
  container: HTMLDivElement,
  code: string,
  onChange: Function
) {
  const editor = document.createElement("iframe");
  editor.setAttribute(
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

  editor.src = "https://code.hyper.fun/embed-editor";
  container.appendChild(editor);

  iframeResize(
    {
      log: false,
      sizeHeight: false,
      checkOrigin: false,
      heightCalculationMethod: "grow",
      onInit() {
        (editor as any).iFrameResizer.sendMessage({
          action: "init",
          data: {
            code: code,
          },
        });
      },
      onResized(res: any) {
        if (res.height <= 16) return;
        editor.style.height = res.height + "px";
      },
      onMessage(res: any) {
        if (res.message.action === "editorReady") {
        }

        if (res.message.action === "change") {
          onChange(res.message.code);
        }
      },
    },
    editor
  );
}

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
function reloadHfcPreview() {
  sandboxes.forEach((sandbox) => {
    (sandbox as any).iFrameResizer.sendMessage({ action: "reload" });
  });
}

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

    let code = decodeURIComponent(container.dataset.hfz!);
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

    iframeResize(
      {
        log: false,
        sizeHeight: false,
        checkOrigin: false,
        heightCalculationMethod: "grow",
        onInit() {
          (sandbox as any).iFrameResizer.sendMessage({
            action: "render",
            data: {
              code: code,
              name: meta.value.name,
              version: meta.value.version,
            },
          });
        },
        onResized(res: any) {
          if (res.height <= 16) return;
          sandbox.style.height = res.height + "px";
        },
      },
      sandbox
    );

    const actions = document.createElement("div");
    actions.classList.add("hfz-preview-actions");

    const openBtn = document.createElement("button");
    openBtn.title = "Open in new tab";
    openBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/>
      </svg>
      <span>OPEN</span>
    `;
    openBtn.addEventListener("click", () => {
      window.open("/render/" + id, "_blank");
    });

    const editBtn = document.createElement("button");
    editBtn.title = "Edit code";
    editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"  fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="7 8 3 12 7 16" />
        <polyline points="17 8 21 12 17 16" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
      <span>EDIT</span>
    `;

    let editorContainer: HTMLDivElement | null = null;
    editBtn.addEventListener("click", () => {
      if (editorContainer) {
        container.removeChild(editorContainer);
        editorContainer = null;
        return;
      }

      editorContainer = document.createElement("div");
      editorContainer.className = "hfz-code-preview-editor";
      container.appendChild(editorContainer);
      showEditor(
        editorContainer,
        code!,
        debounce((newCode: string) => {
          if (newCode === code) {
            return;
          }

          code = newCode;
          (sandbox as any).iFrameResizer.sendMessage({ action: "reload" });
        }, 250)
      );
    });

    const reloadBtn = document.createElement("button");
    reloadBtn.title = "Reload";
    reloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.65 6.35c-1.63-1.63-3.94-2.57-6.48-2.31-3.67.37-6.69 3.35-7.1 7.02C3.52 15.91 7.27 20 12 20c3.19 0 5.93-1.87 7.21-4.56.32-.67-.16-1.44-.9-1.44-.37 0-.72.2-.88.53-1.13 2.43-3.84 3.97-6.8 3.31-2.22-.49-4.01-2.3-4.48-4.52C5.31 9.44 8.26 6 12 6c1.66 0 3.14.69 4.22 1.78l-1.51 1.51c-.63.63-.19 1.71.7 1.71H19c.55 0 1-.45 1-1V6.41c0-.89-1.08-1.34-1.71-.71l-.64.65z"/>
      </svg>
      <span>RELOAD</span>
    `;

    reloadBtn.addEventListener("click", () => {
      (sandbox as any).iFrameResizer.sendMessage({ action: "reload" });
    });

    actions.appendChild(openBtn);
    actions.appendChild(editBtn);
    actions.appendChild(reloadBtn);

    container.appendChild(actions);
  });
}
</script>
