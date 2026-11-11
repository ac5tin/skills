import { existsSync } from "node:fs"
import net from "node:net"
import { join } from "node:path"
import {
  REPO_ROOT,
  http,
  loadMap,
  parseArgs,
  readState,
  sh,
  targetName,
  targets,
} from "./lib.mjs"

const args = parseArgs()

function checkPort(host, port) {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host, port: Number(port) })
    socket.setTimeout(3000)
    socket.once("connect", () => {
      socket.destroy()
      resolvePromise([true, `port ${port} open`])
    })
    socket.once("timeout", () => {
      socket.destroy()
      resolvePromise([false, `port ${port}: timeout`])
    })
    socket.once("error", (error) => {
      socket.destroy()
      resolvePromise([false, `port ${port}: ${error.message}`])
    })
  })
}

async function runCheck(check) {
  const kind = check.kind || "cmd"
  if (kind === "http") {
    const expect = check.expect ?? 200
    try {
      const { status } = await http(check.method || "GET", check.url)
      return [status === expect, `${check.url} -> ${status} (expected ${expect})`]
    } catch (error) {
      return [false, `${check.url}: ${error.message}`]
    }
  }
  if (kind === "port") {
    return checkPort(check.host || "127.0.0.1", check.port)
  }
  if (kind === "file") {
    const ok = existsSync(join(REPO_ROOT, check.path))
    return [ok, `file ${check.path} exists=${ok}`]
  }
  const proc = sh(check.cmd, { timeout: check.timeout || 60 })
  const expect = check.expect_exit ?? 0
  return [proc.status === expect, `\`${check.cmd}\` -> ${proc.status}`]
}

async function readVersion(probe) {
  if (!probe || !probe.url) return null
  const expect = probe.expect ?? 200
  try {
    const { status, body } = await http(probe.method || "GET", probe.url)
    let value = body.trim().slice(0, 200)
    if (probe.field) {
      try {
        value = JSON.parse(body)[probe.field] ?? null
      } catch {
        value = null
      }
    }
    return [status === expect, `${probe.url} -> ${status} version=${value} (expected ${expect})`]
  } catch (error) {
    return [false, `${probe.url}: ${error.message}`]
  }
}

const data = loadMap()
const state = readState()
let target
try {
  target = targetName({ arg: args.target, run: args.runId || state.run_id, data })
} catch (error) {
  console.log(
    JSON.stringify({ ok: false, target: args.target, checks: [{ check: "target", ok: false, detail: error.message }] }),
  )
  process.exit(2)
}

const config = targets(data)[target]
const checks = config.health || config.run?.health || []
const results = []
let ok = true

for (const check of checks) {
  const [passed, detail] = await runCheck(check)
  ok = ok && passed
  results.push({ check: check.kind || "cmd", ok: passed, detail })
}

const version = await readVersion(config.version)
if (version) {
  const [passed, detail] = version
  ok = ok && passed
  results.push({ check: "version", ok: passed, detail })
}

if (checks.length === 0 && !version && state.pid) {
  let passed = false
  try {
    process.kill(state.pid, 0)
    passed = true
  } catch {
    passed = false
  }
  ok = passed
  results.push({ check: "pid", ok: passed, detail: `pid ${state.pid} ${passed ? "alive" : "gone"}` })
}

if (checks.length === 0 && !version && !state.pid) {
  results.push({ check: "none", ok: true, detail: "no health checks configured" })
}

console.log(JSON.stringify({ ok, target, checks: results }))
process.exit(ok ? 0 : 2)
