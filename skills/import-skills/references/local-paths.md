# Standard local skill paths

Check only paths that exist. Expand the home directory using the host environment; never assume a username.

## Claude Code

| Scope | Roots |
| --- | --- |
| Personal | `~/.claude/skills/` |
| Project | `.claude/skills/` from the current directory through the repository root |
| Nested project | `.claude/skills/` below the working directory only when the user identifies that subtree as in scope |
| Added directory | `<approved --add-dir>/.claude/skills/` only when the user identifies it |

Plugin-installed skills are distributable packages rather than ordinary authored local skills. Do not scan Claude's plugin cache by default. Scan a plugin source checkout only when the user supplies or approves its path.

Enterprise skill locations are deployment-specific. Ask the user or administrator for the managed path; do not probe arbitrary system directories.

## Codex

| Scope | Roots |
| --- | --- |
| User | `$HOME/.agents/skills/` |
| Repository | `.agents/skills/` in every directory from the current directory through the repository root |
| Admin (Unix-like hosts) | `/etc/codex/skills/` |
| System | Built into Codex; not a local folder to import |

Codex follows symlinked skill folders during normal discovery. This importer is stricter: show symlinks, resolve them without executing anything, and require explicit approval before reading a target. Never read a target outside an approved root.

## Candidate rules

- A candidate is a directory with a regular `SKILL.md` file.
- A candidate may contain `references/`, `assets/`, `scripts/`, `agents/`, and other support files.
- Do not treat loose Markdown files as complete skills.
- Deduplicate by resolved directory identity when possible.
- Record source and scope so same-named candidates remain distinguishable.
- Paths supplied by the user are allowed only after confirming their scope; do not broaden them automatically.
