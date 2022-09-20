import { listenBuildEvents } from "./build-event-listener";
import "iframe-resizer/js/iframeResizer.contentWindow.min.js";

import("vue").then((Vue) => {
  (<any>window).Vue = Vue;

  // @ts-ignore
  import("@hyper-function/hfz-global");
});

const id = location.pathname.split("/").pop();
function renderCode({
  code,
  name,
  version,
}: {
  code: string;
  name: string;
  version: string;
}) {
  document.title = name + " - " + id;

  (<any>window)[`$HFC_CDN_REWRITE_${name}_${version}`] =
    location.protocol + "//" + location.host + "/hfm/";

  const container = document.getElementById("app")!;
  container.innerHTML = code;
}

if (self === top) {
  fetch("/api/hfz/template?id=" + id)
    .then((res) => res.json())
    .then((res) => {
      if (!res.code) {
        document.write("404 not found");
        return;
      }

      renderCode(res);
    });

  listenBuildEvents((data) => {
    if (data.action === "update-hfc-markdown") {
      location.reload();
    }

    if (data.action === "rebuild-complete") {
      location.reload();
    }
  });
} else {
  (window as any).iFrameResizer = {
    onMessage(msg: any) {
      if (msg.action === "render") {
        renderCode(msg.data);
      }

      if (msg.action === "reload") {
        location.reload();
      }
    },
  };
}
