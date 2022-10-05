<template>
  <router-view />
</template>

<script setup lang="ts">
import { provide, ref } from "vue";
import { listenBuildEvents } from "./build-event-listener";

const manifest = ref<any>({});
provide("manifest", manifest);

const docHtml = ref({ ts: 0, text: "" });
provide("docHtml", docHtml);

const propTypes = ref<any>({});
provide("propTypes", propTypes);

const cssVars = ref<any>([]);
provide("cssVars", cssVars);

const hfcRebuildInfo = ref({ ts: 0 });
provide("hfcRebuildInfo", hfcRebuildInfo);

async function fetchManifest() {
  const res = await fetch("/doc/manifest.json")
    .then((res) => res.json())
    .then((manifest) => manifest);
  manifest.value = res;
}

async function fetchDocHtml() {
  const html = await fetch("/doc/index.html").then((res) => res.text());

  docHtml.value = {
    ts: Date.now(),
    text: html,
  };
}

async function fetchPropTypes() {
  const res = await fetch(`/doc/prop-types.json`).then((res) => res.json());

  propTypes.value = res;
}

async function fetchCssVars() {
  const res = await fetch(`/doc/css-vars.json`).then((res) => res.json());

  cssVars.value = res;
}

fetchManifest().then(() => {
  fetchDocHtml();
  fetchPropTypes();
  fetchCssVars();
  listenBuildEvents((data) => {
    if (document.hidden) return;
    if (data.action === "update-hfc-markdown") {
      fetchDocHtml();
    } else if (data.action === "update-hfc-props") {
      fetchPropTypes();
    } else if (data.action === "update-hfc-cssvars") {
      fetchCssVars();
    } else if (data.action === "rebuild-complete") {
      hfcRebuildInfo.value = { ts: Date.now() };
    }
  });
});
</script>
