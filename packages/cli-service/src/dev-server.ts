import http from "http";
import cors from "cors";
import express from "express";
import SseStream from "ssestream";
import portfinder from "portfinder";
import * as desm from "desm";
import { Options } from "./options.js";
import path from "path";
import { readFileSync } from "fs";
import kvCache from "./kv-cache.js";

// @ts-ignore
const SSE = SseStream.default;

export class DevServer {
  server: http.Server | null = null;
  sseConnections: SseStream[] = [];
  constructor(private hfcConfig: Partial<Options> = {}) {
    const app = express();
    app.use(cors());

    this.server = http.createServer(app);

    this.sseConnections = [];
    app.get("/sse", (req, res) => {
      const sse = new SSE(req);
      sse.pipe(res);
      this.sseConnections.push(sse);

      res.on("close", () => {
        const idx = this.sseConnections.indexOf(sse);
        if (idx >= 0) this.sseConnections.splice(idx, 1);
        sse.unpipe(res);
      });
    });

    app.get("/meta", async (req, res) => {
      res.json({
        name: this.hfcConfig.name,
        version: this.hfcConfig.version,
        license: this.hfcConfig.license,
        deps: this.hfcConfig.dependencies,
      });
    });

    const wfmServePath = `/${this.hfcConfig.name}@${this.hfcConfig.version}`;
    app.use(wfmServePath, express.static(this.hfcConfig.pkgOutputPath!));
    app.use("/doc", express.static(this.hfcConfig.docOutputPath!));

    const clientPath = desm.join(import.meta.url, "..", "client");

    const renderHtmlFile = path.join(clientPath, "render.html");
    app.get("/render/:id", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.end(readFileSync(renderHtmlFile, "utf8"));
    });

    app.get("/hfz/template", (req, res) => {
      const { id } = req.query;
      const code = kvCache.get("HFZ_TEMPLATE_" + id);

      res.json({
        name: this.hfcConfig.name,
        version: this.hfcConfig.version,
        code,
      });
    });

    app.use(express.static(clientPath));
  }
  sendMessage(msg: any) {
    this.sseConnections.forEach((sse) => {
      sse.writeMessage({ event: "event", data: msg });
    });
  }
  async listen() {
    if (this.hfcConfig.command === "build") return;
    const port = await portfinder.getPortPromise({
      port: this.hfcConfig.port!,
    });

    this.server!.listen(port, () => {
      console.log();
      console.log("Preview server running at: http://localhost:" + port);
    });
  }
}
