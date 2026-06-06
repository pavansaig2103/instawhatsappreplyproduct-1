import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hasPostgresUrl(value?: string) {
  return Boolean(value?.startsWith("postgresql://") || value?.startsWith("postgres://"));
}

const env = {
  ...process.env
};

loadDotEnv();

Object.assign(env, process.env);

if (!hasPostgresUrl(env.DATABASE_URL)) {
  env.DATABASE_URL = "postgresql://user:password@localhost:5432/instareply";
  console.warn("DATABASE_URL is not PostgreSQL. Using a temporary placeholder for Prisma generate.");
}

if (!hasPostgresUrl(env.DIRECT_URL)) {
  env.DIRECT_URL = env.DATABASE_URL;
  console.warn("DIRECT_URL is not PostgreSQL. Using DATABASE_URL for Prisma generate.");
}

const result = spawnSync("npx prisma generate", {
  env,
  shell: true,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
