import { unlinkSync } from "node:fs"
import {
  STATE_FILE,
  loadMap,
  parseArgs,
  readState,
  runId as newRunId,
  sh,
  targetName,
  targets,
} from "./lib.mjs"

const args = parseArgs()
const data = loadMap()
const state = readState()
const run = args.runId || state.run_id || newRunId()
let target
try {
  target = targetName({ arg: args.target, run, data })
} catch (error) {
  console.error(`BLOCKED teardown ${error.message}`)
  process.exit(2)
}

if (state.run_id && state.run_id !== run) {
  console.log(`TEARDOWN skipped run-mismatch ${run} (state run ${state.run_id})`)
  process.exit(0)
}
if (state.target && state.target !== target) {
  console.log(`TEARDOWN skipped target-mismatch ${run} (state target ${state.target})`)
  process.exit(0)
}

let stopped = false

if (state.pid) {
  try {
    process.kill(-state.pid, "SIGTERM")
    stopped = true
  } catch {
    stopped = false
  }
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
    try {
      process.kill(-state.pid, 0)
    } catch {
      break
    }
  }
  try {
    process.kill(-state.pid, "SIGKILL")
  } catch {
    // already gone
  }
}

const config = targets(data)[target]
const teardown =
  (config.kind || "local") === "local"
    ? (config.run?.teardown || config.teardown || "").trim()
    : ""
if (teardown) {
  const proc = sh(teardown, { timeout: 120 })
  if (proc.status !== 0) console.error(proc.stderr.slice(-2000))
}

try {
  unlinkSync(STATE_FILE)
} catch {
  // no state
}

console.log(`TEARDOWN ${stopped ? "stopped" : "no-process"} ${run} target=${target} (evidence kept)`)
