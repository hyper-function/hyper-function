import os from "os";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import minimist from "minimist";
import inquirer from "inquirer";
import updateNotifier from "update-notifier";
import pleaseUpgradeNode from "please-upgrade-node";
import * as desm from "desm";

import { Service } from "./service.js";
import { publish, readToken } from "./publish.js";

const pkg = JSON.parse(
  fs.readFileSync(desm.join(import.meta.url, "..", "package.json"), "utf-8")
);

pleaseUpgradeNode(pkg);

function updateCheck() {
  const notifier = updateNotifier({ pkg });
  const message = [];

  if (notifier.update) {
    message.push(
      "Update available: " +
        chalk.green.bold(notifier.update.latest) +
        chalk.gray(" (current: " + notifier.update.current + ")"),
      "Run " + chalk.magenta("npm install -g " + pkg.name) + " to update."
    );

    console.log(message.join(" "));
  }
}
updateCheck();

const argv = minimist(process.argv.slice(2));

async function run(command: string) {
  if (!command) {
    const service = new Service(
      process.env.HFC_CLI_CONTEXT || process.cwd(),
      "serve"
    );
    service.run();
  } else if (command === "login") {
    let token = argv.token;

    if (!token) {
      try {
        console.log(
          "You can generate token at: " +
            chalk.green.bold("https://hyper.fun/settings/tokens")
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

    fs.mkdirSync(path.join(os.homedir(), ".hfc"), { recursive: true });
    fs.writeFileSync(path.join(os.homedir(), ".hfc", "token"), token);
    console.log("login success");
  } else if (command === "build") {
    const service = new Service(
      process.env.HFC_CLI_CONTEXT || process.cwd(),
      "build"
    );
    service.run();
  } else if (command === "publish") {
    let token = readToken();
    if (!token) {
      await run("login");
    }

    token = readToken();
    if (!token) {
      console.log("fail to read token");
      return;
    }

    if (argv["skip-build"]) {
      publish();
      return;
    }

    const service = new Service(
      process.env.HFC_CLI_CONTEXT || process.cwd(),
      "build"
    );

    let docBuildComplete = false;
    let hfcPropsBuildComplete = false;
    let pkgJsonBuildComplete = false;
    let pkgBuildComplete = false;

    service.on("doc-build-complete", () => {
      docBuildComplete = true;
      tryPublish();
    });
    service.on("hfc-props-build-complete", () => {
      hfcPropsBuildComplete = true;
      tryPublish();
    });
    service.on("pkg-json-build-complete", () => {
      pkgJsonBuildComplete = true;
      tryPublish();
    });
    service.on("pkg-build-complete", () => {
      pkgBuildComplete = true;
      tryPublish();
    });

    service.run();

    function tryPublish() {
      if (
        !docBuildComplete ||
        !hfcPropsBuildComplete ||
        !pkgJsonBuildComplete ||
        !pkgBuildComplete
      ) {
        return;
      }

      publish();
    }
  } else {
    console.log("unknow command");
  }
}

run(argv._[0]);
