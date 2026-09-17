import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://redox.studio",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap({ filter: (page) => !/\/404(?:\/|\.html)?$/.test(page) })],
});
