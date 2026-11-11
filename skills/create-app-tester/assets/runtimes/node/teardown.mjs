import { unlinkSync } from "node:fs"
import { STATE_FILE, loadMap, parseArgs, readState, runId as newRunId, sh } from "./lib.mjs"

const args = parseArgs()
const state = readState()
const run = args.runId || state.run_id || newRunId()
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

const teardown = (loadMap().run?.teardown || "").trim()
if (teardown) {
  const proc = sh(teardown, { timeout: 120 })
  if (proc.status !== 0) console.error(proc.stderr.slice(-2000))
}

try {
  unlinkSync(STATE_FILE)
} catch {
  // no state
}

console.log(`TEARDOWN ${stopped ? "stopped" : "no-process"} ${run} (evidence kept)`)
