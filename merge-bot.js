const { existsSync } = require("fs");
const { resolve } = require("path");
const { execSync } = require("child_process");

const org = "https://github.com/hyper-function";
const repos = [
  { name: "docs", prefix: "docs" },
  { name: "create-hfc", prefix: "create-hfc" },
  { name: "hyper-function-component", prefix: "hyper-function-component" },
];

repos.map((repo) => {
  const { name, prefix } = repo;
  const exists = existsSync(resolve(__dirname, prefix));

  const action = exists ? "pull" : "add";
  const command = `git subtree ${action} --prefix=${prefix} ${org}/${name}.git main -m "sync ${name}"`;

  console.log("Run: " + command);
  const stdout = execSync(command);
  console.log(stdout.toString());
});

const stdout = execSync("git push");
console.log(stdout.toString());
