#!/usr/bin/env node
// Template for one feature or use case. Copy, rename, replace ENTRY_ID and steps.
import {
  Blocked,
  check,
  finish,
  http,
  parseArgs,
  runId as newRunId,
  save,
  sh,
} from "./lib.mjs"

const ENTRY_ID = "feat-example"
const BASE = process.env.APP_TEST_BASE_URL || "http://127.0.0.1:8099"
const args = parseArgs()
const run = args.runId || newRunId()
const evidence = []

try {
  if (ENTRY_ID === "feat-example") {
    throw new Blocked("template not filled in: replace ENTRY_ID and the steps")
  }

  // Example: HTTP surface.
  // const { status, body } = await http("GET", `${BASE}/notes.json`)
  // check(status === 200, `expected 200, got ${status}`)
  // evidence.push(save(run, ENTRY_ID, "notes.json", body))

  // Example: CLI surface.
  // const proc = sh("node app.mjs list")
  // check(proc.status === 0, `exit ${proc.status}: ${proc.stderr}`)
  // evidence.push(save(run, ENTRY_ID, "list.txt", proc.stdout))

  finish("PASS", ENTRY_ID, "verified", run, evidence, args.json)
} catch (error) {
  const status = error instanceof Blocked ? "BLOCKED" : "FAIL"
  finish(status, ENTRY_ID, error.message, run, evidence, args.json)
}
