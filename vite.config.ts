import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig, type Plugin } from "vite";
import { handleApiRequest } from "./server.ts";

function thousandStoresApiPlugin(): Plugin {
  return {
    name: "thousand-stores-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), thousandStoresApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
