const fs = require("fs");
const path = require("path");

module.exports = {
  name: "VanillaJS",
  templatePath: path.resolve(__dirname, "templates"),
  apply(ctx) {
    ctx.copyTpl(
      ctx.templatePath("package.json.ejs"),
      ctx.destinationPath("package.json"),
      { name: ctx.name }
    );

    ctx.copyTpl(
      ctx.templatePath("hfc.props.d.ts"),
      ctx.destinationPath("hfc.props.d.ts")
    );

    ctx.copyTpl(ctx.templatePath("hfc.md"), ctx.destinationPath("hfc.md"), {
      name: ctx.name,
    });

    ctx.copyTpl(
      ctx.templatePath("hfc.config.js"),
      ctx.destinationPath("hfc.config.js"),
      { name: ctx.name }
    );

    fs.mkdirSync(ctx.destinationPath("src"));
    ctx.copyTpl(
      ctx.templatePath("src/index.js"),
      ctx.destinationPath("src/index.js")
    );
  },
};
