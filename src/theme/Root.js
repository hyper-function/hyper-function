import React from "react";

function checkRegion() {
  const checked = localStorage.getItem("REGION_CHECKED");
  if (checked) return;
  fetch("https://hyper-function.com/api/region")
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem("REGION_CHECKED", "true");
      if (data.ipCountry === "CN") {
        if (location.pathname.indexOf("/zh-Hans") === -1) {
          location.pathname = "/zh-Hans" + location.pathname;
        }
      }
    });
}

export default function Root({ children }) {
  if (typeof window !== "undefined") checkRegion();
  return <>{children}</>;
}
