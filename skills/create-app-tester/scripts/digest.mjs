#!/usr/bin/env node
// Hash a skill's asset tree so --update can detect generator drift.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.argv[2]
if (!root) {
  console.error("usage: digest.mjs <assets-dir>")
  process.exit(1)
}

const files = []
function walk(directory) {
  const items = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )
  for (const item of items) {
    if (item.isFile()) files.push(join(directory, item.name))
  }
  for (const item of items) {
    if (item.isDirectory() && item.name !== "__pycache__") walk(join(directory, item.name))
  }
}
walk(root)

const parts = files.map((path) => {
  const rel = relative(root, path).split("\\").join("/")
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex")
  return `${rel}\0${hash}`
})
console.log(createHash("sha256").update(parts.join("\n")).digest("hex"))
