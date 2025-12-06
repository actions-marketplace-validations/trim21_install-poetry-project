import * as crypto from "crypto";
import path from "path";

import { exec } from "@actions/exec";
import * as core from "@actions/core";

import { IN_PROJECT_VENV_PATH } from "./constants";

export async function getPythonVersion(): Promise<string> {
  let myOutput = "";
  const options = {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        myOutput += data.toString();
      },
    },
  };

  await exec("python", ["-VV"], options);
  return myOutput;
}

export function hashString(s: string): string {
  const md5 = crypto.createHash("md5");
  return md5.update(s).digest("hex");
}

export function enableVenv(): void {
  core.info("Enabling virtualenv");
  if (process.platform === "linux" || process.platform === "darwin") {
    core.addPath(path.join(IN_PROJECT_VENV_PATH, "bin"));
  } else if (process.platform === "win32") {
    core.addPath(path.join(IN_PROJECT_VENV_PATH, "Scripts"));
  }
}

export function isWindows(): boolean {
  return process.platform === "win32";
}
