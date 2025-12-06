import { existsSync } from "fs";

import * as core from "@actions/core";
import { exec } from "@actions/exec";

import { enableVenv, getPythonVersion, isWindows } from "./utils";
import * as cache from "./cache";
import * as poetry from "./poetry";
import { version } from "../package.json";

async function run(): Promise<void> {
  core.info(`trim21/install-poetry-project@${version}`);
  const extras = core
    .getInput("extras", { required: false })
    .split("\n")
    .filter((x) => x !== "")
    .sort();

  const additionalArgs = core
    .getInput("install_args", { required: false })
    .split(" ")
    .filter((x) => x !== "")
    .sort();

  const pythonVersion = await getPythonVersion();
  const poetryVersion = await poetry.getVersion();
  core.info(`python version: ${pythonVersion}`);
  core.info(`poetry version: ${poetryVersion}`);

  const primaryMatch = await cache.restore(
    pythonVersion,
    extras,
    additionalArgs,
  );

  core.info("update poetry config");
  await poetry.config("virtualenvs.in-project", "true");

  if (!primaryMatch) {
    if (isWindows() && !existsSync(".venv")) {
      core.info("create venv on windows");
      await exec("python -m venv .venv");
    }
  }

  core.info("run poetry sync/install");
  await poetry.install(extras, additionalArgs);

  if (!primaryMatch) {
    core.info("save cache");
    await cache.setup(pythonVersion, extras, additionalArgs);
  }

  enableVenv();
}

run().catch((e) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  core.setFailed(e);
  throw e;
});
