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
  waitFor,
  writeState,
} from "./lib.mjs"

const args = parseArgs()
const run = args.runId || newRunId()
const data = loadMap()
const config = data.run || {}
const setup = (config.setup || "").trim()

if (!setup) finish("BLOCKED", "setup", "map.json run.setup is empty", run)

mkdirSync(RUNTIME_DIR, { recursive: true })
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
    APP_TEST_FRESH: process.argv.includes("--fresh") ? "1" : "0",
  },
})
child.unref()
closeSync(logFd)
writeState({ run_id: run, pid: child.pid, setup, log: logPath })

function logTail() {
  try {
    return readFileSync(logPath, "utf8").split("\n").slice(-20).join("\n")
  } catch {
    return ""
  }
}

async function readyProbe(ready) {
  const configReady = typeof ready === "string" ? { url: ready } : ready || {}
  const timeout = configReady.timeout || 60
  if (configReady.url) {
    const expect = configReady.expect ?? 200
    await waitFor(
      async () => {
        if (child.exitCode !== null) throw new Error(`process exited ${child.exitCode}`)
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
        if (child.exitCode !== null) throw new Error(`process exited ${child.exitCode}`)
        return sh(configReady.cmd, { timeout }).status === 0
      },
      { timeout, label: configReady.cmd },
    )
    return configReady.cmd
  }
  return ""
}

try {
  const ready = await readyProbe(config.ready || {})
  console.log(`READY ${ready} ${run}`)
} catch (error) {
  console.error(logTail())
  try {
    process.kill(-child.pid, "SIGTERM")
  } catch {
    // already gone
  }
  finish("BLOCKED", "setup", error.message, run)
}
