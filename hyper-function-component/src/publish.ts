import { randomBytes } from "crypto";
import { readFileSync } from "fs";
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

  const pkgJson = await fs.readJSON(pkgJsonPath);
  const { description } = pkgJson;

  pkgJson.description = `👉  https://hyper.fun/c/${pkgJson.hfc.name}/${
    pkgJson.version
  }${description ? ` - ${description}` : ""}`;

  const docHtml = await fs.readFile(
    join(context, ".hfc", "build", "doc", "index.html"),
    "utf8"
  );

  let docImgsTarPath;
  let pkgTarPath;
  try {
    [docImgsTarPath, pkgTarPath] = await Promise.all([
      packDocImgs(),
      packHfcPkg(),
    ]);
  } catch (error) {
    console.log("failed to pack:", error);
    return;
  }

  const { sizeJs, sizeCss } = await bundleSize(pkgPath);

  const [bannerJpg, bannerJpeg, bannerPng, bannerSvg] = await Promise.all(
    [".jpg", ".jpeg", ".png", ".svg"].map(async (ext) => {
      const bannerPath = join(context, "banner" + ext);
      if (await fs.pathExists(bannerPath)) {
        return ext;
      }
      return null;
    })
  );

  const bannerExt = bannerJpg || bannerJpeg || bannerPng || bannerSvg;

  let bannerPath;
  if (bannerExt) {
    bannerPath = join(context, "banner" + bannerExt);
  }

  const form = new FormData();
  form.append("token", token!);
  form.append("description", description);
  form.append("manifest", JSON.stringify(pkgJson));
  form.append("sizeJs", sizeJs + "");
  form.append("sizeCss", sizeCss + "");
  form.append("docHtml", docHtml);
  form.append("docImgs", fileFromSync(docImgsTarPath));
  form.append("pkg", fileFromSync(pkgTarPath));
  if (bannerPath) {
    form.append("banner", fileFromSync(bannerPath));
    form.append("bannerExt", bannerExt!);
  }

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
        if (res.success) {
          console.log("publish success");
          return;
        }

        if (res.error) {
          console.log(res.message);
          return;
        }

        console.log("publish failed:", res);
      });
  } catch (error) {
    console.log("failed to publish, network error");
    console.error(error);
  }
}

async function packDocImgs(): Promise<string> {
  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar");

  await tar.create(
    {
      cwd: join(context, ".hfc", "build", "doc", "imgs"),
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
