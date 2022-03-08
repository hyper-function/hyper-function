const fs = require("fs");
const path = require("path");

module.exports = {
  name: "React",
  templatePath: path.resolve(__dirname, "templates"),
  async apply(ctx) {
    const usePreactAnswer = await ctx.prompt([
      {
        type: "confirm",
        name: "usePreact",
        message: "use preact as default runtime?",
        default: false,
      },
    ]);

    const { usePreact } = usePreactAnswer;

    ctx.copyTpl(
      ctx.templatePath("package.json.ejs"),
      ctx.destinationPath("package.json"),
      { name: ctx.name, usePreact }
    );

    ctx.copyTpl(
      ctx.templatePath("hfc.props.d.ts"),
      ctx.destinationPath("hfc.props.d.ts")
    );

    ctx.copyTpl(ctx.templatePath("hfc.md"), ctx.destinationPath("hfc.md"), {
      name: ctx.name,
    });

    ctx.copyTpl(
      ctx.templatePath("hfc.config.js.ejs"),
      ctx.destinationPath("hfc.config.js"),
      { name: ctx.name, usePreact }
    );

    fs.mkdirSync(ctx.destinationPath("src"));
    ctx.copyTpl(
      ctx.templatePath("src/index.jsx"),
      ctx.destinationPath("src/index.jsx")
    );
  },
};
