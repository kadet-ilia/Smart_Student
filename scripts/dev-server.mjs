import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const host = valueAfter("--host", "0.0.0.0");
const port = valueAfter("--port", "3000");
const child = spawn("next", ["dev", "-H", host, "-p", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
