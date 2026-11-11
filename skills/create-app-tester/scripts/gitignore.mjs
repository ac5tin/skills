#!/usr/bin/env node
// Add or refresh the managed app-tester block in a repo's .gitignore.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const BEGIN = "# app-tester: begin (managed)"
const END = "# app-tester: end (managed)"
const BASE = [".app-tester/", "__pycache__/", "*.pyc"]
const STACKS = [
  ["package.json", ["node_modules/", ".next/", "coverage/"]],
  ["pyproject.toml", [".venv/", ".pytest_cache/"]],
  ["requirements.txt", [".venv/", ".pytest_cache/"]],
  ["Cargo.toml", ["target/"]],
  ["pom.xml", ["target/"]],
  ["build.gradle", ["build/", ".gradle/"]],
  ["build.gradle.kts", ["build/", ".gradle/"]],
  ["Gemfile", [".bundle/"]],
  ["composer.json", ["vendor/"]],
  ["pubspec.yaml", [".dart_tool/", "build/"]],
]

const argv = process.argv.slice(2)
const extras = []
const positional = []
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--extra") {
    if (i + 1 >= argv.length) {
      console.error("--extra needs a path")
      process.exit(1)
    }
    extras.push(argv[i + 1])
    i += 1
  } else {
    positional.push(argv[i])
  }
}
const root = positional[0]
if (!root || positional.length !== 1) {
  console.error("usage: gitignore.mjs <repo-root> [--extra <path>]...")
  process.exit(1)
}
const project = resolve(root)
if (!existsSync(join(project, ".git"))) {
  console.log("GITIGNORE skipped: not a git repo")
  process.exit(0)
}

const stack = []
for (const [manifest, patterns] of STACKS) {
  if (!existsSync(join(project, manifest))) continue
  for (const pattern of patterns) if (!stack.includes(pattern)) stack.push(pattern)
}

const path = join(project, ".gitignore")
let lines = []
try {
  lines = readFileSync(path, "utf8").split(/\r?\n/)
} catch {
  lines = []
}

const kept = []
const block = []
let inside = false
for (const line of lines) {
  const stripped = line.trim()
  if (stripped === BEGIN) {
    inside = true
    continue
  }
  if (stripped === END) {
    inside = false
    continue
  }
  ;(inside ? block : kept).push(line)
}

const outside = new Set(kept.map((line) => line.trim()))
const desired = [...new Set([...BASE, ...stack, ...extras.filter(Boolean)])].filter(
  (pattern) => !outside.has(pattern),
)
const current = block.map((line) => line.trim()).filter(Boolean)

if (JSON.stringify(current) === JSON.stringify(desired)) {
  console.log("GITIGNORE clean")
  process.exit(0)
}

if (desired.length) {
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
  if (kept.length) kept.push("")
  kept.push(BEGIN, ...desired, END)
}

const text = kept.join("\n").replace(/\n+$/, "")
writeFileSync(path, text ? `${text}\n` : "")

if (desired.length) {
  console.log(`GITIGNORE added: ${desired.join(", ")}`)
} else {
  console.log("GITIGNORE removed stale block")
}
