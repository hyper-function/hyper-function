const fs = require("fs");
const path = require("path");
const { templates } = require("../templates/templates.json");

const version = process.argv[2];

if (!version) {
  console.log("please provide a version number as the first argument");
  process.exit(-1);
}

console.log("updating version to", version);

templates.forEach((template) => {
  const file = path.resolve(
    __dirname,
    "..",
    "templates",
    template.folder,
    "package.json"
  );
  const packageJson = JSON.parse(fs.readFileSync(file, "utf-8"));
  packageJson.devDependencies["@hyper-function/cli-service"] = "^" + version;
  fs.writeFileSync(file, JSON.stringify(packageJson, null, 2));
});

console.log("done");
