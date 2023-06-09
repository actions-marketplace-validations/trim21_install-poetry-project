import * as fs from "fs";
import * as os from "os";

import * as cache from "@actions/cache";
import * as core from "@actions/core";

import { hashString } from "./utils";
import { IN_PROJECT_VENV_PATH } from "./constants";

function cacheKeyComponents(
  pyVersion: string,
  extras: string[],
  additionalArgs: string[],
): string[] {
  const keys = ["poetry", "deps", "7"];

  const hashed = [
    os.platform() + os.arch() + os.release() + pyVersion,
    fs.readFileSync("poetry.lock").toString(),
    fs.readFileSync("pyproject.toml").toString(),
  ];

  if (extras.length !== 0) {
    hashed.push(hashString(extras.sort().join("_")));
  }

  if (additionalArgs.length !== 0) {
    hashed.push(hashString(JSON.stringify(additionalArgs)));
  }

  if (os.platform() === "win32") {
    return [...keys, hashString(hashed.join("\n"))];
  }

  return [...keys, ...hashed.map((s) => hashString(s))];
}

// fallback to same python/os/arch version's cache
function fallbackKeys(
  pyVersion: string,
  extras: string[],
  additionalArgs: string[],
): string[] {
  const keys = [];
  const components = cacheKeyComponents(pyVersion, extras, additionalArgs);

  for (let index = 4; index < components.length; index++) {
    keys.push(components.slice(0, index).join("-"));
  }

  keys.reverse();

  return keys;
}

export async function setup(
  pythonVersion: string,
  extras: string[],
  additionalArgs: string[],
): Promise<void> {
  const key = cacheKeyComponents(pythonVersion, extras, additionalArgs).join(
    "-",
  );
  core.info(`cache with key ${key}`);
  core.debug(IN_PROJECT_VENV_PATH);
  await cache.saveCache([IN_PROJECT_VENV_PATH], key);
}

export async function restore(
  pythonVersion: string,
  extras: string[],
  additionalArgs: string[],
): Promise<boolean> {
  const primaryKey = cacheKeyComponents(
    pythonVersion,
    extras,
    additionalArgs,
  ).join("-");
  const fbKeys: string[] = fallbackKeys(pythonVersion, extras, additionalArgs);
  core.info(`restore cache with key ${primaryKey}`);
  core.info(`fallback to ${JSON.stringify(fbKeys, null, 2)}`);
  core.debug(IN_PROJECT_VENV_PATH);
  const hitKey = await cache.restoreCache(
    [IN_PROJECT_VENV_PATH],
    primaryKey,
    fbKeys,
  );
  return hitKey === primaryKey;
}
