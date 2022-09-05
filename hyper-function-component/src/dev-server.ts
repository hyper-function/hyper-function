import cors from "cors";
import path from "path";
import fs from "fs-extra";
import sirv from "sirv";
import polka from "polka";
import { dirname } from "desm";
// @ts-ignore
import portfinder from "portfinder";
import prettyBytes from "pretty-bytes";

import kvCache from "./kv-cache.js";
import { HfcConfig } from "./options.js";
import bundleSize from "./bundle-size.js";

const __dirname = dirname(import.meta.url);

export class DevServer {
  app: polka.Polka;
  eventMessageId = Date.now();
  eventMessages: { id: number; data: any }[] = [];
  eventResponses: any[] = [];
  constructor(private hfcConfig: HfcConfig) {
    this.app = polka();
    this.app.use(cors());
    this.app.use((req, res: any, next) => {
      res.json = (d: any) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(d));
      };
      next();
    });

    this.app.get("/api/events", (req, res) => {
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

    this.app.get("/api/meta", async (req, res) => {
      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        license: this.hfcConfig.license,
        deps: this.hfcConfig.dependencies,
      });
    });

    this.app.get("/api/size", async (req, res) => {
      const { sizeJs, sizeCss } = await bundleSize(
        this.hfcConfig.pkgOutputPath
      );

      res.json({
        sizeJs: prettyBytes(sizeJs),
        sizeCss: prettyBytes(sizeCss),
      });
    });

    this.app.get("/api/hfz/template", (req, res) => {
      const { id } = req.query;
      const code = kvCache.get("HFZ_TEMPLATE_" + id);

      res.json({
        name: this.hfcConfig.hfcName,
        version: this.hfcConfig.version,
        code,
      });
    });

    const wfmStatic = sirv(this.hfcConfig.pkgOutputPath, {
      dev: true,
      etag: true,
    });

    const pathPrefix = `/@hyper.fun/${this.hfcConfig.hfcName}@${this.hfcConfig.version}`;
    const wfmServePath = pathPrefix + "/*";
    this.app.get(wfmServePath, (req, res) => {
      const pathname = (req as any)._parsedUrl.pathname;
      (req as any)._parsedUrl.pathname = pathname.replace(pathPrefix, "");
      wfmStatic(req, res);
    });

    this.app.use(
      "/doc",
      sirv(this.hfcConfig.docOutputPath, {
        dev: true,
        etag: true,
      })
    );

    const clientPath = path.join(__dirname, "client");

    const renderHtml = fs.readFileSync(
      path.join(clientPath, "render.html"),
      "utf8"
    );

    this.app.get("/render/*", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.end(renderHtml);
    });

    this.app.use(sirv(clientPath, { dev: true, etag: true }));
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

    this.app.listen(port, () => {
      console.log();
      console.log("Preview server running at: http://localhost:" + port);
    });
  }
}
