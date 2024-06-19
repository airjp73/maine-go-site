import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://airjp73.github.io",
  base: "maine-go-site",
  integrations: [tailwind()],
});
