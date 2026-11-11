import { spawn } from "node:child_process"
import { closeSync, mkdirSync, openSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  REPO_ROOT,
  RUNTIME_DIR,
  finish,
  http,
  loadMap,
  parseArgs,
  runId as newRunId,
  sh,
  targetName,
  targets,
  waitFor,
  writeState,
} from "./lib.mjs"

const args = parseArgs()
const run = args.runId || newRunId()
const data = loadMap()
let target
try {
  target = targetName({ arg: args.target, run, data })
} catch (error) {
  finish("BLOCKED", "setup", error.message, run)
}
const config = targets(data)[target]
const kind = config.kind || "local"
const runConfig = kind === "local" ? config.run || {} : config

function logTail(path) {
  try {
    return readFileSync(path, "utf8").split("\n").slice(-20).join("\n")
  } catch {
    return ""
  }
}

async function readyProbe(ready, child = null) {
  const configReady = typeof ready === "string" ? { url: ready } : ready || {}
  const timeout = configReady.timeout || 60
  if (configReady.url) {
    const expect = configReady.expect ?? 200
    await waitFor(
      async () => {
        if (child && child.exitCode !== null) throw new Error(`process exited ${child.exitCode}`)
        const { status } = await http("GET", configReady.url)
        return status === expect
      },
      { timeout, label: configReady.url },
    )
    return configReady.url
  }
  if (configReady.cmd) {
    await waitFor(
      async () => {
        if (child && child.exitCode !== null) throw new Error(`process exited ${child.exitCode}`)
        return sh(configReady.cmd, { timeout }).status === 0
      },
      { timeout, label: configReady.cmd },
    )
    return configReady.cmd
  }
  return ""
}

async function versionValue(probe) {
  if (!probe || !probe.url) return null
  try {
    const { status, body } = await http(probe.method || "GET", probe.url)
    if (status >= 400) return null
    if (probe.field) {
      try {
        return JSON.parse(body)[probe.field] ?? null
      } catch {
        return null
      }
    }
    return body.trim().slice(0, 120)
  } catch {
    return null
  }
}

mkdirSync(RUNTIME_DIR, { recursive: true })

if (kind === "remote") {
  const state = { run_id: run, target, kind: "remote", pid: null, setup: "" }
  writeState(state)
  try {
    const ready = await readyProbe(config.ready || { url: config.base_url })
    const version = await versionValue(config.version)
    if (version) {
      state.version = version
      writeState(state)
    }
    console.log(`READY ${ready} ${run} target=${target}`)
  } catch (error) {
    finish("BLOCKED", "setup", `target ${target}: ${error.message}`, run)
  }
} else {
  const setup = (runConfig.setup || "").trim()
  if (!setup) finish("BLOCKED", "setup", "map.json run.setup is empty", run)

  const logPath = join(RUNTIME_DIR, `setup-${run}.log`)
  const logFd = openSync(logPath, "a")
  const child = spawn(setup, {
    shell: true,
    cwd: REPO_ROOT,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      APP_TEST_RUN_ID: run,
      APP_TEST_TARGET: target,
      APP_TEST_FRESH: process.argv.includes("--fresh") ? "1" : "0",
    },
  })
  child.unref()
  closeSync(logFd)
  const state = { run_id: run, target, kind: "local", pid: child.pid, setup, log: logPath }
  writeState(state)

  try {
    const ready = await readyProbe(runConfig.ready || {}, child)
    const version = await versionValue(runConfig.version)
    if (version) {
      state.version = version
      writeState(state)
    }
    console.log(`READY ${ready} ${run} target=${target}`)
  } catch (error) {
    console.error(logTail(logPath))
    try {
      process.kill(-child.pid, "SIGTERM")
    } catch {
      // already gone
    }
    finish("BLOCKED", "setup", error.message, run)
  }
}
