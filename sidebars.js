// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  hfnSidebar: [{ type: "doc", id: "hfn/intro", label: "Introduction" }],
  hfcSidebar: [
    { type: "doc", id: "hfc/intro", label: "Introduction" },
    {
      type: "category",
      label: "Use HFC",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "hfc/use-hfc/getting-started",
        },
      ],
    },
    {
      type: "category",
      label: "Create HFC",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "hfc/create-hfc/getting-started",
        },
        {
          type: "doc",
          id: "hfc/create-hfc/first-hfc",
        },
      ],
    },
  ],
  hfzSidebar: [{ type: "doc", id: "hfz/intro", label: "Introduction" }],
  devToolsSidebar: [
    { type: "doc", id: "devtools/intro", label: "Introduction" },
  ],
};

module.exports = sidebars;
