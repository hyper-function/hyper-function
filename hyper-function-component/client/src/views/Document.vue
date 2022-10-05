<template>
  <div class="my-4 lg:my-8 mx-auto max-w-[1164px]">
    <div class="flex flex-col mx-4 lg:mx-8 lg:flex-row">
      <div id="content" class="flex-1 shrink">
        <HeaderInfo
          :tabs="tabs"
          :active-tab="activeTab"
          @change="activeTab = $event.name"
        />
        <div
          id="hfc-doc"
          class="prose prose-slate max-w-none"
          ref="docContainer"
          v-show="activeTab === 'Readme'"
        ></div>
        <div v-if="activeTab === 'PropTypes'">
          <PropTypes />
        </div>
        <div v-if="activeTab === 'CssVars'">
          <CssVars />
        </div>
      </div>

      <Sidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, watch, ref } from "vue";
import { iframeResize } from "iframe-resizer";
import Sidebar from "../components/Sidebar.vue";
import PropTypes from "../components/PropTypes.vue";
import { debounce } from "../utils";
import HeaderInfo from "../components/Header.vue";
import CssVars from "../components/CssVars.vue";

const manifest = inject<any>("manifest")!;
const docHtml = inject<any>("docHtml")!;
const hfcRebuildInfo = inject<any>("hfcRebuildInfo");
const docContainer = ref<HTMLDivElement | null>(null);
const activeTab = ref("Readme");

const tabs = ref<{ name: string }[]>([
  { name: "Readme" },
  { name: "PropTypes" },
  { name: "CssVars" },
]);

watch(() => docHtml.value, renderHfcDoc);
watch(() => hfcRebuildInfo.value, reloadHfcPreview);

function showEditor(
  container: HTMLDivElement,
  code: string,
  onChange: Function,
  onInit: Function
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

  editor.className = "rounded";
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
        onInit();
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
  document.title = manifest.value.name;
  const elem = docContainer.value;
  if (!elem) return;

  elem.style.width = "auto";
  // prevent page flashing when reloading
  elem.style.minHeight = elem.clientHeight + "px";

  elem.innerHTML = docHtml.value.text;
  renderHfcPreview();
  renderCodeCollapse();

  setTimeout(() => {
    elem.style.minHeight = "auto";
  }, 500);
}

function renderCodeCollapse() {
  const codeBlocks = document.querySelectorAll<HTMLPreElement>(".shiki");
  codeBlocks.forEach((elem) => {
    const isHfzBlock = elem.hasAttribute("data-hfz");
    if (!isHfzBlock) return;

    const height = getComputedStyle(elem).height;
    if (height !== "200px") return;

    const collapse = document.createElement("template");
    collapse.innerHTML = `
      <div
        class="absolute bottom-0 left-0 right-0 flex flex-col"
      >
        <div id="mask" style="height: 90px; background: linear-gradient(transparent, var(--tw-prose-pre-bg))" ></div>
        <div
          id="btn"
          style="background-color: var(--tw-prose-pre-bg)"
          class="flex justify-center items-center h-9 text-gray-400 hover:text-gray-200 cursor-pointer select-none"
        >
        </div>
      </div>
    `;

    const mask = collapse.content.getElementById("mask")!;
    mask.removeAttribute("id");

    const openSvg = `<svg width="24" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="currentColor" d="M16.59 8.59L12 13.17L7.41 8.59L6 10l6 6l6-6z"/></svg></span>`;
    const closeSvg = `<svg width="24" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="currentColor" d="m12 8l-6 6l1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>`;
    const btn = collapse.content.getElementById("btn")!;
    btn.removeAttribute("id");
    btn.innerHTML = openSvg;

    let isOpen = false;
    btn.addEventListener("click", () => {
      isOpen = !isOpen;
      elem.style.maxHeight = isOpen ? "none" : "200px";
      mask.style.display = isOpen ? "none" : "block";
      btn.innerHTML = isOpen ? closeSvg : openSvg;
    });

    elem.appendChild(collapse.content);
  });
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

  const hfzSnippets = document.querySelectorAll<HTMLDivElement>("[data-hfz]");
  hfzSnippets.forEach((snippet) => {
    snippet.style.marginTop = "0";

    const container = document.createElement("div");
    snippet.before(container);

    const id = snippet.dataset.hfzId;
    let code = decodeURIComponent(snippet.dataset.hfz!);
    snippet.setAttribute("data-hfz", "");
    container.classList.add("hfz-preview");

    const sandbox = document.createElement("iframe");
    sandbox.style.boxShadow = "0 0 0 1.2px #ebecf0";
    sandbox.style.borderRadius = "4px";
    sandbox.style.marginBottom = "12px";
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

    sandbox.src = "/preview/" + id;
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
              name: manifest.value.name,
              version: manifest.value.version,
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

    const actions = document.createElement("template");
    actions.innerHTML = `
      <div class="relative">
        <div class="absolute flex gap-3 top-3 right-4 z-10">
          <button class="text-gray-400 hover:text-gray-200 w-6" title="Open in new tab">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1zM14 4c0 .55.45 1 1 1h2.59l-9.13 9.13c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1h-5c-.55 0-1 .45-1 1z"/>
            </svg>
          </button>
          <button class="text-gray-400 hover:text-gray-200 w-6" title="Edit">
            <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="currentColor" d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"/><path fill="currentColor" d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2V19z"/></svg>
          </button>
          <button class="text-gray-400 hover:text-gray-200 w-6" title="Reload">
            <svg fill="currentColor" viewBox="0 0 1024 1024"><path d="M768 707.669333V256H469.333333a42.666667 42.666667 0 1 1 0-85.333333h341.333334a42.666667 42.666667 0 0 1 42.666666 42.666666v494.336l55.168-55.168a42.666667 42.666667 0 0 1 60.330667 60.330667l-128 128a42.666667 42.666667 0 0 1-60.330667 0l-128-128a42.666667 42.666667 0 0 1 60.330667-60.330667L768 707.669333zM256 316.330667V768h298.666667a42.666667 42.666667 0 1 1 0 85.333333H213.333333a42.666667 42.666667 0 0 1-42.666666-42.666666V316.330667l-55.168 55.168a42.666667 42.666667 0 0 1-60.330667-60.330667l128-128a42.666667 42.666667 0 0 1 60.330667 0l128 128a42.666667 42.666667 0 0 1-60.330667 60.330667L256 316.330667z"></path></svg>
          </button>
        </div>
      </div>
    `;

    const actionBtns = actions.content.querySelectorAll("button");

    const openBtn = actionBtns[0];
    openBtn.addEventListener("click", () => {
      window.open("/preview/" + id, "_blank");
    });

    const editBtn = actionBtns[1];
    let editorContainer: HTMLDivElement | null = null;
    editBtn.addEventListener("click", () => {
      if (editorContainer) {
        container.removeChild(editorContainer);
        snippet.style.display = "block";
        editorContainer = null;
        return;
      }

      editorContainer = document.createElement("div");
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
        }, 250),
        () => {
          snippet.style.display = "none";
        }
      );
    });

    const reloadBtn = actionBtns[2];
    reloadBtn.addEventListener("click", () => {
      (sandbox as any).iFrameResizer.sendMessage({ action: "reload" });
    });

    container.appendChild(actions.content);
  });
}
</script>
<style>
.hfz-preview {
  position: relative;
  margin-bottom: 12px;
}
.hfz-preview iframe {
  width: 100%;
  min-width: 100%;
  height: 0;
  border: none;
  transition: height 300ms ease;
}

.shiki {
  position: relative;
  overflow: hidden;
}
.shiki[data-hfz] {
  display: flex;
  flex-direction: column;
  max-height: 200px;
}
</style>
