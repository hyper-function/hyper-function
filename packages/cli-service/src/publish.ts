import { randomBytes } from "crypto";
import { readFileSync, statSync } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";
import tar from "tar";
import fetch, { FormData, fileFromSync } from "node-fetch";

export async function publish() {
  const pkgJsonPath = join(
    process.cwd(),
    ".hfc",
    "build",
    "pkg",
    "package.json"
  );

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
  const { description } = pkgJson;
  const name = pkgJson.name.replace("@hyper.fun/", "");
  pkgJson.description = `👉 https://hyper.fun/${name}/${pkgJson.version}${
    description ? ` - ${description}` : ""
  }`;

  const token = readToken();

  let docTarPath;
  let pkgTarPath;
  try {
    [docTarPath, pkgTarPath] = await Promise.all([packDoc(), packHfcPkg()]);
  } catch (error) {
    console.log("failed to pack:", error);
    return;
  }

  const sizeJs = statSync(
    join(process.cwd(), ".hfc", "build", "pkg", "esm", name + ".js")
  );

  const sizeCss = statSync(
    join(process.cwd(), ".hfc", "build", "pkg", "hfc.css")
  );

  const form = new FormData();
  form.append("token", token!);
  form.append("description", description);
  form.append("manifest", JSON.stringify(pkgJson));
  form.append("sizeJs", sizeJs.size.toString());
  form.append("sizeCss", sizeCss.size.toString());
  form.append("doc", fileFromSync(docTarPath));
  form.append("pkg", fileFromSync(pkgTarPath));

  try {
    await fetch("https://hfc-publish.hyper.fun/publish", {
      method: "POST",
      body: form,
    })
      .then((res) => res.json())
      .then((json) => console.log(json));
  } catch (error) {
    console.log("failed to publish, network error");
  }
}

async function packDoc(): Promise<string> {
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar");

  await tar.create(
    {
      cwd: join(process.cwd(), ".hfc", "build", "doc"),
      file: output,
    },
    ["."]
  );

  return output;
}

async function packHfcPkg(): Promise<string> {
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar.gz");

  await tar.create(
    {
      cwd: join(process.cwd(), ".hfc", "build"),
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
