#!/usr/bin/env node
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const gamesRoot = join(root, "games");
const games = readdirSync(gamesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((engine) =>
    readdirSync(join(gamesRoot, engine.name), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((game) => `${engine.name}/${game.name}`),
  )
  .filter((game) => existsSync(join(gamesRoot, game, "devvit.json")))
  .sort();

const args = process.argv.slice(2);
const requested = args.filter((arg) => arg !== "--install");
if (requested.some((game) => !games.includes(game))) {
  console.error(
    `Usage: node tools/validate-all.mjs [--install] [${games.join(" | ")}]`,
  );
  process.exit(1);
}

const selected = requested.length ? [...new Set(requested)] : games;
const failures = [];
for (const game of selected) {
  const commands = [
    ...(args.includes("--install") ? [["ci", "--no-fund", "--no-audit"]] : []),
    ["run", "type-check"],
    ["run", "lint"],
    ["run", "test"],
    ["run", "build"],
  ];
  for (const command of commands) {
    console.log(`\n${game}: npm ${command.join(" ")}`);
    const result = spawnSync("npm", command, {
      cwd: join(gamesRoot, game),
      stdio: "inherit",
    });
    if (result.error || result.status !== 0) {
      failures.push(`${game}: npm ${command.join(" ")}`);
      if (result.error) console.error(result.error.message);
      if (command[0] === "ci") break;
    }
  }
}

if (failures.length) {
  console.error(`\nFailed checks:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(
    `\nValidation passed for ${selected.length} game(s). Games without tests are reported by Vitest.`,
  );
}
