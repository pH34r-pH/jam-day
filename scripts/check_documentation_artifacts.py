#!/usr/bin/env python3
"""Check changed documentation names and disposable artifact boundaries."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


HISTORICAL_ROOTS = ("archive/", "artifacts/", "evidence/", "results/")
SUSPICIOUS_PARTS = {
    ".cache",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "scratch",
    "temp",
    "tmp",
}
DISPOSABLE_SUFFIXES = {".bak", ".log", ".pyc", ".pyo", ".tmp"}
DOC_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
ISSUE_ONLY_RE = re.compile(r"^(?:issue[-_]?)?\d+\.md$", re.IGNORECASE)


def changed_files(root: Path, base: str) -> list[tuple[str, str]]:
    output = subprocess.check_output(
        [
            "git", "diff", "--name-status", "-z", "--find-renames", "--find-copies",
            "--diff-filter=ACMR", f"{base}...HEAD",
        ], cwd=root,
    )
    fields = output.decode().split("\0")
    records: list[tuple[str, str]] = []
    index = 0
    while index < len(fields) - 1:
        status = fields[index]
        index += 1
        if not status:
            break
        if status.startswith(("R", "C")):
            index += 1
            records.append((status[0], fields[index]))
        else:
            records.append((status[0], fields[index]))
        index += 1
    return records


def is_historical(path: str) -> bool:
    return any(path.startswith(root) for root in HISTORICAL_ROOTS)


def changed_markdown_files(root: Path, base: str) -> list[str]:
    return [path for _, path in changed_files(root, base) if path.endswith(".md") and not is_historical(path)]


def path_errors(status: str, relative: str) -> list[str]:
    if "\n" in relative or "\t" in relative:
        return [f"{relative!r}: path contains a control character"]
    parts = Path(relative).parts
    errors: list[str] = []
    if any(part in SUSPICIOUS_PARTS for part in parts) or Path(relative).suffix in DISPOSABLE_SUFFIXES:
        errors.append(f"{relative}: new temporary/build artifact is not approved")
    if status in {"A", "C", "R"} and relative.endswith(".md"):
        name = Path(relative).name
        if ISSUE_ONLY_RE.fullmatch(name):
            errors.append(f"{relative}: new documentation needs a descriptive name")
        elif not is_historical(relative) and name not in {"README.md", "AGENTS.md"} and not DOC_NAME_RE.fullmatch(name):
            errors.append(f"{relative}: new living docs need lowercase kebab-case names")
    return errors


def check(root: Path, base: str) -> list[str]:
    return [error for status, path in changed_files(root, base) for error in path_errors(status, path)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--print-markdown-files", action="store_true")
    parser.add_argument("--root", type=Path)
    args = parser.parse_args()
    root = args.root.resolve() if args.root else Path(__file__).resolve().parents[1]
    if args.print_markdown_files:
        sys.stdout.write("\n".join(changed_markdown_files(root, args.base)))
        return 0
    errors = check(root, args.base)
    if errors:
        print("Documentation/artifact guard failed:\n" + "\n".join(f"- {error}" for error in errors))
        return 1
    print("Documentation/artifact guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
