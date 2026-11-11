#!/usr/bin/env python3
"""Add or refresh the managed app-tester block in a repo's .gitignore."""
import os
import sys

BEGIN = "# app-tester: begin (managed)"
END = "# app-tester: end (managed)"
BASE = [".app-tester/", "__pycache__/", "*.pyc"]
STACKS = [
    ("package.json", ["node_modules/", ".next/", "coverage/"]),
    ("pyproject.toml", [".venv/", ".pytest_cache/"]),
    ("requirements.txt", [".venv/", ".pytest_cache/"]),
    ("Cargo.toml", ["target/"]),
    ("pom.xml", ["target/"]),
    ("build.gradle", ["build/", ".gradle/"]),
    ("build.gradle.kts", ["build/", ".gradle/"]),
    ("Gemfile", [".bundle/"]),
    ("composer.json", ["vendor/"]),
    ("pubspec.yaml", [".dart_tool/", "build/"]),
]


def stack_patterns(root):
    found = []
    for manifest, patterns in STACKS:
        if not os.path.exists(os.path.join(root, manifest)):
            continue
        for pattern in patterns:
            if pattern not in found:
                found.append(pattern)
    return found


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: gitignore.py <repo-root>")
    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")
    if not os.path.isdir(os.path.join(root, ".git")):
        print("GITIGNORE skipped: not a git repo")
        return

    path = os.path.join(root, ".gitignore")
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except FileNotFoundError:
        lines = []

    kept = []
    block = []
    inside = False
    for line in lines:
        stripped = line.strip()
        if stripped == BEGIN:
            inside = True
            continue
        if stripped == END:
            inside = False
            continue
        (block if inside else kept).append(line)

    outside = {line.strip() for line in kept}
    patterns = BASE + stack_patterns(root)
    desired = [pattern for pattern in patterns if pattern not in outside]
    current = [line.strip() for line in block if line.strip()]

    if current == desired:
        print("GITIGNORE clean")
        return

    if desired:
        while kept and not kept[-1].strip():
            kept.pop()
        if kept:
            kept.append("")
        kept.extend([BEGIN, *desired, END])

    text = "\n".join(kept).rstrip("\n")
    if text:
        text += "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

    if desired:
        print(f"GITIGNORE added: {', '.join(desired)}")
    else:
        print("GITIGNORE removed stale block")

if __name__ == "__main__":
    main()
