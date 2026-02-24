import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

export default defineConfig({
  integrations: [react(), tailwind({ applyBaseStyles: true }), mdx()],
  site: "https://maryssedesign.com",
  server: { port: 4321 },
});
