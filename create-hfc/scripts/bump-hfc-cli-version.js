const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const { templates } = require("../templates/templates.json");

const version = process.argv[2];

if (!version) {
  console.log("please provide a version number as the first argument");
  process.exit(-1);
}

console.log("updating version to", version);

(async () => {
  await Promise.all(
    templates.map(async (template) => {
      const dir = path.resolve(__dirname, "..", "templates", template.folder);

      const packageFile = path.resolve(dir, "package.json");

      const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf-8"));
      packageJson.devDependencies["@hyper-function/cli-service"] =
        "^" + version;
      fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));

      execSync("npm i --package-lock-only", { cwd: dir });
    })
  );

  console.log("done");
})();
