import { execSync } from "node:child_process";

function runNpmPackDryRun() {
  const command =
    process.platform === "win32"
      ? "cmd.exe /d /s /c npm pack --dry-run --json"
      : "npm pack --dry-run --json";
  const output = execSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: true,
  });

  const trimmed = output
    .replace(/\u001b\[[0-9;]*m/g, "")
    .trim();
  const match = trimmed.match(/\[\s*\{[\s\S]*\}\s*\]/);

  if (!match) {
    throw new Error("npm pack --dry-run did not return JSON output.");
  }

  return JSON.parse(match[0]);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packResult = runNpmPackDryRun();
const artifact = packResult[0];
const packagedFiles = artifact.files.map((file) => file.path);

for (const requiredFile of [
  "LICENSE",
  "README.md",
  "dist/index.js",
  "dist/index.js.map",
  "dist/index.d.ts",
  "package.json",
]) {
  assert(
    packagedFiles.includes(requiredFile),
    `Expected package artifact to include ${requiredFile}.`,
  );
}

for (const forbiddenPattern of [/^docs\//, /^examples\//, /^tests\//, /^project\//]) {
  assert(
    packagedFiles.every((filePath) => !forbiddenPattern.test(filePath)),
    `Package artifact unexpectedly included files matching ${forbiddenPattern}.`,
  );
}

console.log(
  JSON.stringify(
    {
      entryCount: artifact.entryCount,
      files: packagedFiles,
      name: artifact.name,
      version: artifact.version,
    },
    null,
    2,
  ),
);
