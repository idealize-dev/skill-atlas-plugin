# Skills Atlas MCP workflow contract

Use only these advertised Skills Atlas tools. If one is absent, stop rather
than improvising with storage, database, or Git tools.

## `list_import_destinations`

Read-only. Returns editable organizations, connected repositories, writable
bundles, and limits. Never invent a destination ID.

## `plan_skill_import`

Read-only with respect to GitHub. Creates a short-lived server plan from an
`orgSlug`, `bundleId`, and up to the advertised number of skill descriptors.
Each descriptor contains:

- `name` and `description`;
- all normalized relative file paths;
- exact raw byte sizes;
- lowercase SHA-256 digests.

The result labels each skill `create` or `conflict`, returns allowed actions,
and includes `planId` plus expiry. Preview all selected batches and show every
conflict before requesting write approval.

## `import_skills`

Writes one bounded, atomic Git commit from a valid `planId`. Every decision
must identify the previewed source `name`, use an advertised action, and include
the complete folder unless skipped:

```json
{
  "name": "local-skill",
  "action": "create | overwrite | rename | skip",
  "renameTo": "required only for rename",
  "files": [
    {
      "path": "SKILL.md",
      "encoding": "base64",
      "content": "base64 of the exact previewed raw bytes"
    }
  ]
}
```

The server aligns frontmatter names for renames, verifies every digest, scans
text for credentials, and rejects stale destination state. Omit `files` only
for `skip`.

## Approval binding

The `planId` binds approval to destination and Git blob state for 15 minutes.
If the server reports expiry or stale state, discard prior approval, re-preview,
show the differences, and ask again. Do not translate missing decisions to a
default. Do not send skipped folder bytes.

## Upload semantics

- Preserve relative paths using `/` separators.
- Reject empty, absolute, drive-prefixed, `.`/`..`, NUL-containing, or escaping paths.
- Base64-encode every file directly from raw bytes, including UTF-8 text. Do
  not round-trip text through a string, normalize line endings, or rewrite
  frontmatter between preview and import.
- Re-read raw bytes immediately before encoding. If their size or SHA-256 no
  longer matches the preview descriptor, create a new preview.
- Never log payload bytes, auth headers, OAuth tokens, or signed URLs.
- Only a result containing a Git commit SHA and imported paths establishes
  success for that batch.

## Authentication

Use the MCP client's OAuth flow when the server requests authentication. Never ask the user to paste a token into chat. Never place credentials in plugin files, candidate folders, manifests, previews, or logs.
