#!/usr/bin/env python3
"""Hash a skill's asset tree so --update can detect generator drift."""
import hashlib
import os
import sys


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: digest.py <assets-dir>")
    root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")
    parts = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d != "__pycache__")
        for name in sorted(filenames):
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, root).replace(os.sep, "/")
            with open(path, "rb") as f:
                digest = hashlib.sha256(f.read()).hexdigest()
            parts.append(f"{rel}\0{digest}")
    print(hashlib.sha256("\n".join(parts).encode()).hexdigest())


if __name__ == "__main__":
    main()
