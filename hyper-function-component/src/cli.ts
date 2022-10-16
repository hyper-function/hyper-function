import os from "os";
import fs from "fs-extra";
import { dirname, join } from "path";
import colors from "picocolors";
import minimist from "minimist";
import inquirer from "inquirer";
import updateNotifier from "update-notifier";
import pleaseUpgradeNode from "please-upgrade-node";
import { fileURLToPath } from "url";

import { Service } from "./service.js";
import { publish, readToken } from "./publish.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = fs.readJSONSync(join(__dirname, "..", "package.json"));

pleaseUpgradeNode(pkg);

function updateCheck() {
  const notifier = updateNotifier({ pkg });
  const message = [];

  if (notifier.update) {
    message.push(
      "Update available: " +
        colors.green(colors.bold(notifier.update.latest)) +
        colors.gray(" (current: " + notifier.update.current + ")"),
      "Run " + colors.magenta("npm install " + pkg.name) + " to update."
    );

    console.log(message.join(" "));
  }
}
updateCheck();

const argv = minimist(process.argv.slice(2));

async function run(command: string, context: string) {
  if (!command) {
    const service = new Service(context, "serve");
    service.run();
  } else if (command === "login") {
    let token = argv.token;

    if (!token) {
      try {
        console.log(
          "You can generate token at: " +
            colors.green(colors.bold("https://hyper.fun/settings/tokens"))
        );
        const answers = await inquirer.prompt([
          {
            name: "token",
            message: "Enter Access Token:",
            type: "password",
            mask: "*",
          },
        ]);

        if (!answers.token) {
          console.log("cancel login");
          return;
        }

        token = answers.token;
      } catch (error) {
        if ((error as any).isTtyError) {
          console.log('run "npx hfc-cli-service login --token=<token>"');
          return;
        }

        console.log("something wrong: ", error);
        return;
      }
    }

    fs.mkdirSync(join(os.homedir(), ".hfc"), { recursive: true });
    fs.writeFileSync(join(os.homedir(), ".hfc", "token"), token);
    console.log("login success");
  } else if (command === "build") {
    const service = new Service(context, "build");
    service.run();
  } else if (command === "publish") {
    let token = argv.token;
    if (!token) {
      token = readToken();
    }

    if (!token) {
      await run("login", context);
    }

    token = readToken();
    if (!token) {
      console.log("fail to read token");
      process.exit(-1);
    }

    if (argv["skip-build"]) {
      publish({ token });
      return;
    }

    const service = new Service(context, "build");

    service.on("ready", () => {
      publish({ token });
    });

    service.run();
  } else {
    console.log("unknow command");
  }
}

function verifyHfcName(input: string) {
  const ref = "\nref: https://bit.ly/3QzRS7S";

  if (input.length > 64) {
    return "name is too long (max 64 characters)";
  }

  if (!input.includes("-")) {
    return "name must contain hyphen [-] \nlike awesome-button " + ref;
  }

  if (/[^a-z]/.test(input[0])) {
    return "first character must be [a-z] " + ref;
  }

  if (/[^a-z0-9]/.test(input[input.length - 1])) {
    return "last character must be [a-z] [0-9] ";
  }

  if (/[^a-z0-9\-]/.test(input)) {
    return "invalid name, valid character is [a-z] [0-9] and -";
  }

  if (
    [
      "annotation-xml",
      "color-profile",
      "font-face",
      "font-face-src",
      "font-face-uri",
      "font-face-format",
      "font-face-name",
      "missing-glyph",
    ].includes(input)
  ) {
    return `${input} is reveresd ` + ref;
  }

  return true;
}

async function askForHfcName() {
  const prompt = inquirer.createPromptModule();
  const answer = await prompt([
    {
      type: "input",
      name: "name",
      message: "Please input HFC name:",

      validate(input) {
        return verifyHfcName(input);
      },
    },
  ]);

  return answer.name;
}

(async () => {
  if (argv.v || argv.version) {
    console.log(pkg.version);
    process.exit(0);
  }

  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const cwdPkgPath = join(context, "package.json");
  const cwdPkg = await fs.readJson(cwdPkgPath);
  if (
    !cwdPkg.hfc ||
    !cwdPkg.hfc.name ||
    verifyHfcName(cwdPkg.hfc.name) !== true
  ) {
    const name = await askForHfcName();

    const hfcObject = cwdPkg.hfc || {};
    hfcObject.name = name;
    cwdPkg.hfc = hfcObject;
    fs.writeFileSync(cwdPkgPath, JSON.stringify(cwdPkg, null, 2));

    const docPath = join(context, "hfc.md");
    let doc = fs.readFileSync(docPath, "utf-8");
    if (doc.split("\n").length <= 10) {
      doc += `
\`\`\`html render
<template hfz import:${name}="dev">
  <${name}></${name}>
</template>
\`\`\`
`;
      fs.writeFileSync(docPath, doc);
    }
  }

  if (!/^\d+(?:\.\d+){2}$/.test(cwdPkg.version)) {
    console.log("version format must be X.Y.Z, eg: 1.2.3");
    process.exit(-1);
  }

  run(argv._[0], context);
})();
