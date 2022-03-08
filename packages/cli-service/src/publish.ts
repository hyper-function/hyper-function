import { randomBytes } from "crypto";
import { readFileSync, createReadStream, createWriteStream } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";
import { pack } from "tar-fs";
import { createGzip } from "zlib";
import fetch from "node-fetch";
import FormData from "form-data";

export async function publish() {
  let docTarPath;
  let pkgTarPath;
  try {
    [docTarPath, pkgTarPath] = await Promise.all([packDoc(), packHfcPkg()]);
  } catch (error) {
    console.log("failed to pack:", error);
    return;
  }

  const pkgJson = readFileSync(
    join(process.cwd(), ".hfc", "build", "pkg", "package.json"),
    "utf-8"
  );

  const token = readToken();

  const form = new FormData();
  form.append("token", token);
  form.append("manifest", pkgJson);
  form.append("doc", createReadStream(docTarPath));
  form.append("pkg", createReadStream(pkgTarPath));

  await fetch("http://localhost:3000/publish", { method: "POST", body: form })
    .then((res) => res.json())
    .then((json) => console.log(json));

  console.log(docTarPath);
  console.log(pkgTarPath);
}

function packDoc(): Promise<string> {
  const path = join(process.cwd(), ".hfc", "build", "doc");
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar");

  const source = pack(path);
  const target = createWriteStream(output, { mode: 0o644 });

  return new Promise((resolve, reject) => {
    source.once("error", (error: Error) => {
      return reject(error);
    });

    target.once("error", (error: Error) => {
      return reject(error);
    });

    target.once("close", () => {
      return resolve(output);
    });

    source.pipe(target);
  });
}

function packHfcPkg(): Promise<string> {
  const path = join(process.cwd(), ".hfc", "build", "pkg");
  const output = join(tmpdir(), randomBytes(8).toString("hex") + ".tar.gz");

  const source = pack(path);
  const target = createWriteStream(output, { mode: 0o644 });

  return new Promise((resolve, reject) => {
    source.once("error", (error: Error) => {
      return reject(error);
    });

    target.once("error", (error: Error) => {
      return reject(error);
    });

    target.once("close", () => {
      return resolve(output);
    });

    source.pipe(createGzip({ chunkSize: 2 ** 21 })).pipe(target);
  });
}

export function readToken() {
  let token;
  try {
    token = readFileSync(join(homedir(), ".hfc", "token"), "utf8");
  } catch (error) {}

  return token;
}
