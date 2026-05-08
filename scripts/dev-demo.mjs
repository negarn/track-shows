import { spawn } from "node:child_process";
import { seedDemoData } from "./seed-demo-data.mjs";

const demoPort = "5174";
const demoHost = "127.0.0.1";

const demoDataDir = await seedDemoData({ onLog: console.log });

const child = spawn(
  "vite",
  ["--host", demoHost, "--port", demoPort, "--strictPort", ...process.argv.slice(2)],
  {
    env: {
      ...process.env,
      TRACK_SHOWS_DATA_DIR: demoDataDir
    },
    stdio: "inherit"
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
