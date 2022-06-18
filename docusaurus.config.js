// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Hyper Function",
  tagline: "Hyper Function",
  url: "https://hyper-function.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  organizationName: "hyper-fun", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh-Hans"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/hyper-fun/docs",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "HYPER FUNCTION",
        logo: {
          alt: "Hyper Function Logo",
          src: "img/hfn-logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "hfn/intro",
            position: "left",
            label: "HFN",
          },
          {
            type: "doc",
            docId: "hfc/intro",
            position: "left",
            label: "HFC",
          },
          {
            type: "doc",
            docId: "hfz/intro",
            position: "left",
            label: "HFZ",
          },
          {
            type: "doc",
            docId: "devtools/intro",
            position: "left",
            label: "DevTools",
          },
          {
            type: "localeDropdown",
            position: "right",
          },
          {
            href: "https://github.com/hyper-fun/hyper-function",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Community",
            items: [
              // {
              //   label: "Discord",
              //   href: "https://discordapp.com/invite/docusaurus",
              // },
              {
                label: "Twitter",
                href: "https://twitter.com/TheHFN",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/hyper-fun/hyper-function",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} HFN Community.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
