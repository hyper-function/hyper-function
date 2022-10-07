import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import colors from "picocolors";
import fetch, { FormData, fileFromSync } from "node-fetch";

import fs from "fs-extra";
import { Manifest } from "./build-manifest";

export async function publish({ token }: { token: string }) {
  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const outputPath = join(context, ".hfc", "build");

  // ! file must append at the end of formData, string field must before file field
  const form = new FormData();
  form.append("token", token!);

  const docPath = join(outputPath, "doc");

  const manifest: Manifest = fs.readJsonSync(join(docPath, "manifest.json"));
  form.append("manifest", JSON.stringify(manifest));

  const docMd = readFileSync(join(docPath, "index.md"), "utf8");
  if (Buffer.byteLength(docMd) > 1024 * 256) {
    console.error("doc too large, max 256 kb");
    process.exit(-1);
  }

  form.append("doc", docMd);
  form.append(
    "prop-types.json",
    fileFromSync(join(docPath, "prop-types.json"))
  );
  form.append("css-vars.json", fileFromSync(join(docPath, "css-vars.json")));

  const imgFileNames = fs.readdirSync(join(docPath, "imgs"));
  for (const imgFileName of imgFileNames) {
    form.append(
      "docImg",
      fileFromSync(join(docPath, "imgs", imgFileName)),
      imgFileName
    );
  }

  if (manifest.banner) {
    form.append(
      "banner",
      fileFromSync(join(docPath, manifest.banner)),
      manifest.banner
    );
  }

  const pkgPath = join(outputPath, "pkg");
  form.append("hfc.js", fileFromSync(join(pkgPath, "hfc.js")));
  form.append("hfc.css", fileFromSync(join(pkgPath, "hfc.css")));

  const hfmPath = join(outputPath, "hfm", manifest.name, manifest.version);
  form.append("hfm.js", fileFromSync(join(hfmPath, "hfc.js")));
  form.append("style.css", fileFromSync(join(hfmPath, "style.css")));

  const publishUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/hfc/publish"
      : "https://api.hyper.fun/hfc/publish";

  try {
    await fetch(publishUrl, {
      method: "POST",
      body: form,
    })
      .then((res) => res.json())
      .then((res: any) => {
        if (res.err === "OK") {
          console.log(colors.green("publish success"));
          return;
        }

        if (res.errmsg) {
          console.error(res.errmsg);
          return;
        }

        console.log("publish failed:", res);
      });
  } catch (error) {
    console.log("failed to publish, network error");
    console.error(error);
  }
}

export function readToken() {
  let token;
  try {
    token = readFileSync(join(homedir(), ".hfc", "token"), "utf8");
  } catch (error) {}

  return token;
}
