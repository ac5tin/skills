#!/usr/bin/env python3
"""Check this skill against the map contract. Exit 1 on any failure."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib

FEATURE_H2 = [
    "Sub-features",
    "Entry points",
    "How to test and verify",
    "Evidence",
    "Code anchors",
    "Gotchas",
]
USECASE_H2 = [
    "Features involved",
    "Preconditions",
    "How to test and verify",
    "Evidence",
    "Code anchors",
    "Gotchas",
]


def fail(errors, message):
    errors.append(message)


def main():
    errors = []
    skill_name = os.path.basename(lib.SKILL_DIR)

    skill_md = os.path.join(lib.SKILL_DIR, "SKILL.md")
    text = open(skill_md, encoding="utf-8").read()
    match = re.match(r"^---\r?\n(.*?)\r?\n---", text, re.S)
    if not match:
        fail(errors, "SKILL.md has no frontmatter")
    else:
        fields = dict(
            line.split(":", 1)
            for line in match.group(1).splitlines()
            if ":" in line
        )
        name = fields.get("name", "").strip()
        description = fields.get("description", "").strip()
        if name != skill_name:
            fail(errors, f"frontmatter name '{name}' != directory '{skill_name}'")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
            fail(errors, f"name '{name}' is not kebab-case")
        if not 1 <= len(description) <= 1024:
            fail(errors, "description must be 1-1024 characters")

    data = lib.load_map()
    features = data.get("features", [])
    usecases = data.get("usecases", [])

    ids = [entry["id"] for entry in features + usecases]
    if len(ids) != len(set(ids)):
        fail(errors, "duplicate ids in map.json")

    def check_entries(entries, required, folder):
        seen = set()
        for entry in entries:
            entry_id = entry.get("id", "?")
            priority = entry.get("priority")
            path = os.path.join(lib.SKILL_DIR, entry.get("file", ""))
            script = os.path.join(lib.SKILL_DIR, entry.get("script", ""))
            if priority not in ("P0", "P1", "P2", "P3"):
                fail(errors, f"{entry_id}: priority must be P0-P3, got {priority!r}")
            if not os.path.exists(path):
                fail(errors, f"{entry_id}: missing file {entry.get('file')}")
                continue
            if not os.path.exists(script):
                fail(errors, f"{entry_id}: missing script {entry.get('script')}")
            body = open(path, encoding="utf-8").read()
            for heading in required:
                if not re.search(rf"^## {re.escape(heading)}\s*$", body, re.M):
                    fail(errors, f"{entry_id}: missing H2 '{heading}'")
            match = re.search(r"^\*\*Priority:\*\* (P[0-3])\b", body, re.M)
            if not match:
                fail(errors, f"{entry_id}: missing '**Priority:** Pn' line")
            elif match.group(1) != priority:
                fail(errors, f"{entry_id}: file priority {match.group(1)} != map {priority}")
            seen.add(os.path.basename(path))
        directory = os.path.join(lib.SKILL_DIR, "references", folder)
        actual = {
            name for name in os.listdir(directory) if name.endswith(".md") and name != "README.md"
        }
        for name in sorted(actual - seen):
            fail(errors, f"{folder}/{name} is not in map.json")
        for name in sorted(seen - actual):
            fail(errors, f"{folder}/{name} is in map.json but not on disk")
        index_path = os.path.join(directory, "README.md")
        index_body = open(index_path, encoding="utf-8").read() if os.path.exists(index_path) else ""
        for entry in entries:
            entry_id = entry.get("id", "?")
            if os.path.basename(entry.get("file", "")) not in index_body:
                fail(errors, f"{entry_id}: file missing from {folder}/README.md")
                continue
            row = next(
                (line for line in index_body.splitlines() if entry_id in line), ""
            )
            if entry.get("priority") not in row:
                fail(errors, f"{entry_id}: priority not shown in {folder}/README.md")


    check_entries(features, FEATURE_H2, "features")
    check_entries(usecases, USECASE_H2, "usecases")

    rank = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    feature_rank = {e["id"]: rank.get(e.get("priority"), 3) for e in features}
    for entry in usecases:
        ranks = [feature_rank.get(fid) for fid in entry.get("features", [])]
        ranks = [value for value in ranks if value is not None]
        if ranks and rank.get(entry.get("priority"), 3) > min(ranks):
            fail(errors, f"{entry['id']}: use case is less critical than its features")

    if features and not any(e.get("priority") == "P0" for e in features):
        print("WARN no P0 feature")
    if usecases and not any(e.get("priority") == "P0" for e in usecases):
        print("WARN no P0 use case")

    for dirpath, dirnames, filenames in os.walk(lib.SKILL_DIR):
        dirnames[:] = [d for d in dirnames if d != "__pycache__"]
        for name in filenames:
            if name.endswith((".pyc", ".png", ".jpg", ".zip")):
                continue
            path = os.path.join(dirpath, name)
            try:
                body = open(path, encoding="utf-8").read()
            except UnicodeDecodeError:
                continue
            if "{" * 2 in body:
                fail(errors, f"unreplaced token in {os.path.relpath(path, lib.SKILL_DIR)}")

    if errors:
        for message in errors:
            print(f"FAIL {message}")
        sys.exit(1)

    print(f"VALID {len(features)} features, {len(usecases)} use cases in {skill_name}")
    print(json.dumps({"features": len(features), "usecases": len(usecases)}))


if __name__ == "__main__":
    main()
