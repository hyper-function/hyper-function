#!/usr/bin/env node

const ejs = require("ejs");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const inquirer = require("inquirer");
const minimist = require("minimist");
const resolveGlobal = require("resolve-global");
const updateNotifier = require("update-notifier");

const pkg = require("./package.json");
require("please-upgrade-node")(pkg);

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

const contextRoot = process.cwd();
const argv = minimist(process.argv.slice(2));

const buildinGeneratorPaths = [
  "./generators/vanilla",
  "./generators/react",
  // "./generators/vue",
  "./generators/svelte",
];

const generators = [];
buildinGeneratorPaths.forEach((p) => {
  const g = require(p);
  generators.push(g);
});

let namedGenerator;
const cliGeneratorName = argv._[0];
if (cliGeneratorName) {
  namedGenerator = generators.find(
    (g) => g.name.toLowerCase() === cliGeneratorName.toLowerCase()
  );
  if (!namedGenerator) {
    const globalPath = resolveGlobal.silent(
      "hfc-generator-" + cliGeneratorName
    );
    if (globalPath) {
      namedGenerator = require(globalPath);
    }
  }
}

const prompt = inquirer.createPromptModule();
async function run() {
  if (argv.name) {
    const errmsg = validateName(argv.name);
    if (errmsg !== true) {
      console.error(errmsg);
      process.exit(-1);
    }
  }

  const answer = await prompt(
    [
      {
        type: "list",
        name: "generator",
        message: "Templates",
        choices: generators.map((g) => ({ name: g.name, value: g })),
      },
      {
        type: "input",
        name: "name",
        message: "Name",
        validate(input) {
          return validateName(input);
        },
      },
    ],
    { generator: namedGenerator, name: argv.name }
  );

  const { name, generator } = answer;

  let destinationFolderName = name;
  let destinationRoot = path.resolve(contextRoot, destinationFolderName);
  if (fs.existsSync(destinationRoot)) {
    console.warn(`Folder ${name} already exists`);
    const destinationRootAnswer = await prompt([
      {
        type: "input",
        name: "folder",
        message: "Folder Name",
        validate(input) {
          const targetPath = path.resolve(contextRoot, input);
          if (fs.existsSync(targetPath)) {
            return `Folder ${input} already exists`;
          }
          return true;
        },
      },
    ]);

    destinationFolderName = destinationRootAnswer.folder;
    destinationRoot = path.resolve(contextRoot, destinationFolderName);
  }

  fs.mkdirSync(destinationRoot);

  function destinationPath(subPath) {
    return path.resolve(destinationRoot, subPath);
  }

  function templatePath(subPath) {
    return path.resolve(generator.templatePath, subPath);
  }

  function copyTpl(src, target, data) {
    fs.writeFileSync(target, ejs.render(fs.readFileSync(src, "utf-8"), data));
  }

  try {
    await generator.apply({
      name,
      argv,
      contextRoot,
      destinationRoot,
      destinationPath,
      templatePath,
      copyTpl,
      ejs,
      chalk,
      prompt,
    });
  } catch (error) {
    console.error(`Run ${generator.name} generator failed, please retry`);
    console.error(error);
    process.exit(-1);
  }

  console.log(
    `${name} has been created \nplease run: \ncd ${destinationFolderName} && npm install && npm run dev`
  );
}

function validateName(input) {
  if (!input) {
    return "name is required";
  }

  const ref =
    "\nref: https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name";

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

run();
