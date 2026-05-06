---
name: ludus-commit-push
description: Commit and push local Ludus repository changes safely on the current branch, and answer the user in French. Use when the user explicitly asks to commit, push, publish, send changes to the remote, or prepare a Conventional Commit from local work without creating a branch or opening a pull request.
---

# Ludus Commit And Push

## Purpose

Commit and push local `ludus` changes with a clean, intentional scope on the current branch. Do not create or switch branches, and do not open a pull request unless the user explicitly asks.

Always respond to the user in French. Keep code, identifiers, commands, commit messages, and technical file contents in English.

## Required First Steps

1. Read the repository root agent instructions: `AGENTS.md` if present, otherwise `agents.md`.
2. Inspect local Git state:
   - `git status --short --untracked-files=all`
   - `git branch --show-current`
   - `git diff --stat`
   - `git diff --name-only`
   - `git diff --cached --stat`
   - `git diff --cached --name-only`
3. Identify which changes belong to the requested commit. If unrelated user changes are present, leave them unstaged unless the user explicitly asked to include everything.
4. Inspect the relevant diffs before staging:
   - `git diff -- <path>`
   - `git diff --cached -- <path>` for already staged files

## Commit Method

- Stage files explicitly by path. Avoid broad `git add .` unless the user clearly asked for all current changes.
- Never stage `.env*`, secrets, local debug files, `node_modules/`, `dist/`, coverage, logs, or temporary files.
- Use an English Conventional Commit message, such as `chore: add Codex commit workflow`.
- Keep the commit body concise when it helps explain scope or validation.
- Do not create a branch, switch branches, or retarget the work unless the user explicitly asks for branch management.
- Do not amend, squash, rebase, reset, or force-push unless the user explicitly asks.
- Do not push directly to `main` without confirming that this is intended.
- If the branch has no upstream, push with `git push -u origin HEAD`; otherwise use `git push`.
- If push fails because the remote moved, stop and report the exact issue before pulling, rebasing, or merging.

## Validation

- Always run `git diff --check` before committing.
- For docs/config/skill-only changes, validate touched structured files when practical, then run at least `npm run build` if repository config changed.
- For source code, gameplay, persistence, i18n, styles, or UI changes, run the relevant checks before committing, usually:
  - `npm run check:assets`
  - `npm run build`
  - `npm run lint`
  - `npm run test`
- Never claim a command passed unless it was run or inspected.

## Output

Respond to the user in French.

After a successful commit and push, summarize:

- Commit SHA and message
- Branch and remote push result
- Files included
- Validation commands run

When running in Codex desktop, include the appropriate Git directives in the final response after successful staging, commit, and push.
