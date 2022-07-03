import http from "http";
import cors from "cors";
import express, { Response } from "express";
import portfinder from "portfinder";
import prettyBytes from "pretty-bytes";
import * as desm from "desm";
import { HfcConfig } from "./options.js";
import path from "path";
import kvCache from "./kv-cache.js";
import fs from "fs-extra";

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
      let sizeJs = 0;
      let sizeCss = 0;
      try {
        const [jsStat, cssStat] = await Promise.all([
          fs.stat(
            path.join(
              this.hfcConfig.pkgOutputPath,
              "esm",
              this.hfcConfig.hfcName + ".js"
            )
          ),
          fs.stat(path.join(this.hfcConfig.pkgOutputPath, "hfc.css")),
        ]);
        sizeJs = jsStat.size;
        sizeCss = cssStat.size;
      } catch (error) {}

      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        license: this.hfcConfig.license,
        deps: this.hfcConfig.dependencies,
        sizeJs: prettyBytes(sizeJs),
        sizeCss: prettyBytes(sizeCss),
      });
    });

    const wfmServePath = `/@hyper.fun/${this.hfcConfig.hfcName}@${this.hfcConfig.version}`;
    app.use(wfmServePath, express.static(this.hfcConfig.pkgOutputPath));
    app.use("/doc", express.static(this.hfcConfig.docOutputPath));

    const clientPath = desm.join(import.meta.url, "..", "client");

    const renderHtmlFile = path.join(clientPath, "render.html");
    app.get("/render/:id", async (req, res) => {
      res.setHeader("Content-Type", "text/html");
      const html = await fs.readFile(renderHtmlFile, "utf-8");
      res.end(html);
    });

    app.get("/hfz/template", (req, res) => {
      const { id } = req.query;
      const code = kvCache.get("HFZ_TEMPLATE_" + id);

      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        code,
      });
    });

    app.use(express.static(clientPath));
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
