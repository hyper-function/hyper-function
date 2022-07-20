import http from "http";
import cors from "cors";
import path from "path";
import { dirname } from "desm";
import express, { Response } from "express";
// @ts-ignore
import fallback from "express-history-api-fallback";
import portfinder from "portfinder";
import prettyBytes from "pretty-bytes";
import { HfcConfig } from "./options.js";

import kvCache from "./kv-cache.js";
import fs from "fs-extra";
import { miniCss, miniJs } from "./minify.js";

const __dirname = dirname(import.meta.url);

export class DevServer {
  server: http.Server | null = null;
  eventMessageId = Date.now();
  eventMessages: { id: number; data: any }[] = [];
  eventResponses: Response[] = [];
  constructor(private hfcConfig: HfcConfig) {
    const app = express();
    app.use(cors());

    this.server = http.createServer(app);

    app.get("/events", (req, res) => {
      const msgId = parseInt(req.query.id + "");

      if (msgId) {
        const msgIndex = this.eventMessages.findIndex(
          (item) => item.id === msgId
        );

        const nextMsg = this.eventMessages[msgIndex + 1];
        if (nextMsg) {
          res.json(nextMsg);
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

    app.get("/meta", async (req, res) => {
      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        license: this.hfcConfig.license,
        deps: this.hfcConfig.dependencies,
      });
    });

    app.get("/size", async (req, res) => {
      const [contentJs, contentCss] = await Promise.all([
        await fs.readFile(
          path.join(hfcConfig.pkgOutputPath, "esm", "hfc.js"),
          "utf-8"
        ),
        await fs.readFile(
          path.join(hfcConfig.pkgOutputPath, "hfc.css"),
          "utf-8"
        ),
      ]);

      const js = await miniJs(contentJs);
      const css = await miniCss(contentCss);

      const sizeJs = prettyBytes(Buffer.from(js || "").byteLength);
      const sizeCss = prettyBytes(Buffer.from(css).byteLength);
      res.json({
        sizeJs,
        sizeCss,
      });
    });

    const wfmServePath = `/@hyper.fun/${this.hfcConfig.hfcName}@${this.hfcConfig.version}`;
    app.use(wfmServePath, express.static(this.hfcConfig.pkgOutputPath));
    app.use("/doc", express.static(this.hfcConfig.docOutputPath));

    app.get("/hfz/template", (req, res) => {
      const { id } = req.query;
      const code = kvCache.get("HFZ_TEMPLATE_" + id);

      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        code,
      });
    });

    const clientPath = path.join(__dirname, "client");

    app.use("/render/*", (req, res) => {
      const renderHtml = fs.readFileSync(
        path.join(clientPath, "render.html"),
        "utf8"
      );
      res.setHeader("Content-Type", "text/html");
      res.send(renderHtml);
    });

    app.use(express.static(clientPath));
    app.use(fallback("index.html", { root: clientPath }));
  }
  sendMessage(msg: any) {
    const id = this.eventMessageId++;
    const event = { id, data: msg };
    this.eventMessages.push(event);
    if (this.eventMessages.length > 100) this.eventMessages.shift();
    const eventResponses = this.eventResponses.slice();
    this.eventResponses = [];

    eventResponses.forEach((res) => {
      res.json(event);
    });
  }
  async listen() {
    if (this.hfcConfig.command === "build") return;
    const port = await portfinder.getPortPromise({
      port: this.hfcConfig.port,
    });

    this.server!.listen(port, () => {
      console.log();
      console.log("Preview server running at: http://localhost:" + port);
    });
  }
}
