import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { trackShowsApi } from "./server/trackShowsApi";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), "TRACK_SHOWS_"));

  return {
    plugins: [react(), trackShowsApi()]
  };
});
