import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { demoDataDirName, demoDataFiles } from "./demo-data.mjs";

const PRIVATE_DIRECTORY_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;

export function getDemoDataDir() {
  return resolve(process.cwd(), process.env.TRACK_SHOWS_DEMO_DATA_DIR ?? demoDataDirName);
}

async function bestEffortChmod(path, mode) {
  try {
    await fs.chmod(path, mode);
  } catch {
    // Best-effort hardening only. Some filesystems do not support chmod.
  }
}

async function ensurePrivateDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  await bestEffortChmod(directoryPath, PRIVATE_DIRECTORY_MODE);
}

async function writePrivateJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: PRIVATE_FILE_MODE
  });
  await bestEffortChmod(filePath, PRIVATE_FILE_MODE);
}

export async function seedDemoData({
  demoDataDir = getDemoDataDir(),
  onLog = console.log
} = {}) {
  await fs.rm(demoDataDir, { force: true, recursive: true });
  await ensurePrivateDirectory(demoDataDir);

  for (const [fileName, value] of Object.entries(demoDataFiles)) {
    await writePrivateJsonFile(resolve(demoDataDir, fileName), value);
  }

  onLog(`Seeded demo data in ${demoDataDir}`);
  return demoDataDir;
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  await seedDemoData();
}
