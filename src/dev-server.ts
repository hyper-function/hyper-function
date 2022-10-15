import cors from "cors";
import path from "path";
import sirv from "sirv";
import fs from "fs-extra";
import connect from "connect";
import { dirname } from "desm";
import colors from "picocolors";
import prettyBytes from "pretty-bytes";

import kvCache from "./kv-cache.js";
import bundleSize from "./bundle-size.js";
import { ResolvedConfig } from "./config.js";
import { createServer, ServerResponse } from "http";
import { sendJson, useUrl } from "./utils.js";

const __dirname = dirname(import.meta.url);

export class DevServer {
  middlewares: connect.Server;
  eventMessageId = Date.now();
  eventMessages: { id: number; data: any }[] = [];
  eventResponses: ServerResponse[] = [];
  constructor(private config: ResolvedConfig) {
    this.middlewares = connect();
    this.middlewares.use(cors());

    this.middlewares.use("/api/events", (req, res) => {
      const url = useUrl(req);
      const msgId = parseInt(url.searchParams.get("id") + "");

      if (msgId) {
        const msgIndex = this.eventMessages.findIndex(
          (item) => item.id === msgId
        );

        const nextMsg = this.eventMessages[msgIndex + 1];
        if (nextMsg) {
          sendJson(res, nextMsg);
          return;
        }
      }

      this.eventResponses.push(res);

      res.on("close", () => {
        if (!this.eventResponses.length) return;
        const idx = this.eventResponses.indexOf(res);
        if (idx >= 0) this.eventResponses.splice(idx, 1);
      });
    });

    this.middlewares.use("/api/meta", async (req, res) => {
      sendJson(res, {
        name: this.config.hfcName,
        desc: this.config.description,
        keywords: this.config.keywords,
        version: this.config.version,
        license: this.config.license,
        deps: this.config.dependencies,
        banner: this.config.bannerPath,
      });
    });

    this.middlewares.use("/api/size", async (req, res) => {
      const { sizeJs, sizeCss } = await bundleSize(this.config.pkgOutputPath);

      sendJson(res, {
        sizeJs: prettyBytes(sizeJs),
        sizeCss: prettyBytes(sizeCss),
      });
    });

    this.middlewares.use("/api/hfz/template", (req, res) => {
      const url = useUrl(req);
      const id = url.searchParams.get("id");
      const code = kvCache.get("HFZ_TEMPLATE_" + id);

      sendJson(res, {
        name: this.config.hfcName,
        version: this.config.version,
        code,
      });
    });

    this.middlewares.use(
      `/hfm/`,
      sirv(this.config.hfmOutputPath, {
        dev: true,
        etag: true,
      })
    );

    this.middlewares.use(
      "/doc/",
      sirv(this.config.docOutputPath, {
        dev: true,
        etag: true,
      })
    );

    const clientPath = path.join(__dirname, "client");
    this.middlewares.use(sirv(clientPath, { dev: true, etag: true }));

    const previewHtml = fs.readFileSync(
      path.join(clientPath, "preview.html"),
      "utf8"
    );

    this.middlewares.use("/preview/", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.end(previewHtml);
    });
  }
  sendMessage(msg: any) {
    const id = this.eventMessageId++;
    const event = { id, data: msg };
    this.eventMessages.push(event);
    if (this.eventMessages.length > 100) this.eventMessages.shift();
    const eventResponses = this.eventResponses.slice();
    this.eventResponses = [];

    eventResponses.forEach((res) => {
      sendJson(res, event);
    });
  }
  async listen() {
    if (this.config.command === "build") return;

    const httpServer = createServer(this.middlewares);
    let port = this.config.port!;
    const onError = (e: Error & { code?: string }) => {
      if (e.code === "EADDRINUSE") {
        console.log(`Port ${port} is in use, trying another one...`);
        httpServer.listen(++port);
      } else {
        httpServer.removeListener("error", onError);
        throw e;
      }
    };

    httpServer.on("error", onError);

    httpServer.listen(port, () => {
      console.log();
      console.log(
        `${colors.green("➜")} ${colors.cyan(`http://localhost:${port}`)}`
      );
    });
  }
}
