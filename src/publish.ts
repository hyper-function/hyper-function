import { randomBytes } from "crypto";
import { readFileSync, statSync } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";
import tar from "tar";
import fetch, { FormData, fileFromSync } from "node-fetch";

import bundleSize from "./bundle-size.js";
import fs from "fs-extra";

export async function publish({ token }: { token: string }) {
  const context = process.env.HFC_CLI_CONTEXT || process.cwd();

  const pkgPath = join(context, ".hfc", "build", "pkg");
  const pkgJsonPath = join(pkgPath, "package.json");

  const pkgJson = JSON.parse(await fs.readJSON(pkgJsonPath, "utf-8"));
  const { description } = pkgJson;

  pkgJson.description = `👉  https://hyper.fun/c/${pkgJson.hfc.name}/${
    pkgJson.version
  }${description ? ` - ${description}` : ""}`;

  let docTarPath;
  let pkgTarPath;
  try {
    [docTarPath, pkgTarPath] = await Promise.all([packDoc(), packHfcPkg()]);
  } catch (error) {
    console.log("failed to pack:", error);
    return;
  }

  const { sizeJs, sizeCss } = await bundleSize(pkgPath);

  const form = new FormData();
  form.append("token", token!);
  form.append("description", description);
  form.append("manifest", JSON.stringify(pkgJson));
  form.append("sizeJs", sizeJs + "");
  form.append("sizeCss", sizeCss + "");
  form.append("doc", fileFromSync(docTarPath));
  form.append("pkg", fileFromSync(pkgTarPath));

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
        if (res.error) {
          console.log(res.message);
          return;
        }

        console.log("publish success");
      });
  } catch (error) {
    console.log("failed to publish, network error");
    console.error(error);
  }
}

async function packDoc(): Promise<string> {
  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar");

  await tar.create(
    {
      cwd: join(context, ".hfc", "build", "doc"),
      file: output,
    },
    ["."]
  );

  return output;
}

async function packHfcPkg(): Promise<string> {
  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar.gz");

  await tar.create(
    {
      cwd: join(context, ".hfc", "build"),
      gzip: true,
      file: output,
    },
    ["pkg"]
  );

  return output;
}

export function readToken() {
  let token;
  try {
    token = readFileSync(join(homedir(), ".hfc", "token"), "utf8");
  } catch (error) {}

  return token;
}
