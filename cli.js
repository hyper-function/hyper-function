#!/usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const inquirer = require("inquirer");
const minimist = require("minimist");
const updateNotifier = require("update-notifier");

const pkg = require("./package.json");
require("please-upgrade-node")(pkg);

const { templates } = require("./templates/templates.json");

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

const cwd = process.cwd();
const argv = minimist(process.argv.slice(2));

const prompt = inquirer.createPromptModule();

async function run() {
  const answer = await prompt([
    {
      type: "list",
      name: "template",
      message: "Templates",
      choices: templates.map((t) => ({ name: t.title, value: t })),
    },
    {
      type: "confirm",
      name: "useCurrentFolder",
      message: "Generate in current folder?",
    },
  ]);

  const { template, useCurrentFolder } = answer;

  let folder;
  if (!useCurrentFolder) {
    const folderAnswer = await prompt([
      {
        type: "input",
        name: "folder",
        message: "Folder Name",
        validate(input) {
          const targetPath = path.resolve(cwd, input);
          if (fs.existsSync(targetPath)) {
            return `Folder ${input} already exists`;
          }
          return true;
        },
      },
    ]);

    folder = path.resolve(cwd, folderAnswer.folder);
  } else {
    folder = cwd;
  }

  fs.copySync(path.resolve(__dirname, "templates", template.folder), folder);
  console.log("Generate success");
  console.log(
    "Link: " +
      chalk.magenta("https://hyper-function.com/hfc/create-hfc/getting-started")
  );
}

run();
