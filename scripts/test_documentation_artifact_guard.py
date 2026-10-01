import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from scripts.check_documentation_artifacts import changed_files, path_errors


class DocumentationGuardTests(unittest.TestCase):
    def test_rejects_issue_number_only_and_temp_paths(self):
        self.assertTrue(path_errors("A", "docs/issue-123.md"))
        self.assertTrue(path_errors("A", "evidence/.cache/receipt.json"))
        self.assertEqual(path_errors("A", "docs/architecture.md"), [])
        self.assertEqual(path_errors("A", "docs/overview.md"), [])


    def test_changed_files_uses_real_git_rename_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            tmp_path = Path(directory)
            subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
            subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=tmp_path, check=True)
            subprocess.run(["git", "config", "user.name", "Documentation Test"], cwd=tmp_path, check=True)
            (tmp_path / "source.md").write_text("# source\n", encoding="utf-8")
            subprocess.run(["git", "add", "source.md"], cwd=tmp_path, check=True)
            subprocess.run(["git", "commit", "-qm", "base"], cwd=tmp_path, check=True)
            base = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=tmp_path, text=True).strip()
            subprocess.run(["git", "mv", "source.md", "issue-123.md"], cwd=tmp_path, check=True)
            subprocess.run(["git", "commit", "-qm", "rename"], cwd=tmp_path, check=True)

            self.assertIn(("R", "issue-123.md"), changed_files(tmp_path, base))
            self.assertTrue(path_errors("R", "issue-123.md"))


    def test_cli_emits_zero_bytes_for_code_only_change_and_guard_runs(self):
        with tempfile.TemporaryDirectory() as directory:
            tmp_path = Path(directory)
            subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
            subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=tmp_path, check=True)
            subprocess.run(["git", "config", "user.name", "Documentation Test"], cwd=tmp_path, check=True)
            (tmp_path / "README.md").write_text("# readme\n", encoding="utf-8")
            subprocess.run(["git", "add", "README.md"], cwd=tmp_path, check=True)
            subprocess.run(["git", "commit", "-qm", "base"], cwd=tmp_path, check=True)
            base = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=tmp_path, text=True).strip()
            (tmp_path / "code.txt").write_text("code\n", encoding="utf-8")
            subprocess.run(["git", "add", "code.txt"], cwd=tmp_path, check=True)
            subprocess.run(["git", "commit", "-qm", "code-only"], cwd=tmp_path, check=True)
            script = Path(__file__).with_name("check_documentation_artifacts.py")
            result = subprocess.run(
                [sys.executable, str(script), "--root", str(tmp_path), "--base", base, "--print-markdown-files"],
                check=True, capture_output=True,
            )
            self.assertEqual(result.stdout, b"")
            subprocess.run([sys.executable, str(script), "--root", str(tmp_path), "--base", base], check=True)
