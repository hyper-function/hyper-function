import * as Vue from "vue";
import { listenBuildEvents } from "./build-event-listener";

const hfzGlobal = require("@hyper-function/hfz-global");

(<any>window).$HFC_NPM_CDN_URL = "https://cdn.jsdelivr.net/npm";
(<any>window).Vue = Vue;
(<any>window).iFrameResizer = {
  onMessage(msg: any) {},
  onReady() {},
};

function renderCode({
  code,
  name,
  version,
}: {
  code: string;
  name: string;
  version: string;
}) {
  (<any>window)[`$HFC_CDN_REWRITE_@hyper.fun/${name}@${version}`] =
    location.protocol + "//" + location.host;

  const container = document.getElementById("app")!;
  container.innerHTML = code;

  hfzGlobal.run();
}

const id = location.pathname.split("/").pop();
fetch("/hfz/template?id=" + id)
  .then((res) => res.json())
  .then((res) => {
    if (!res.code) {
      document.write("404 not found");
      return;
    }

    renderCode(res);
  });

if (self === top) {
  listenBuildEvents((data) => {
    if (data.action === "update-hfc-markdown") {
      location.reload();
    }

    if (data.action === "rebuild-complete") {
      location.reload();
    }
  });
}
