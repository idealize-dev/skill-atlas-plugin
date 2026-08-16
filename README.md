# Skills Atlas plugin for Claude, Cursor, and Codex

A portable plugin that safely discovers local Claude Code, Cursor, and Codex skills, previews their destination through Skills Atlas MCP, obtains explicit conflict decisions, and uploads approved complete folders in bounded batches.

The same `skills/import-skills/` workflow is packaged for both hosts. Imported files are always treated as untrusted bytes and are never executed.

## Package layout

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` — Claude Code plugin and marketplace manifests.
- `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json` — Codex plugin and repo marketplace manifests.
- `.cursor-plugin/` and `mcp.json` — Cursor plugin, marketplace, and MCP metadata.
- `skills/import-skills/` — shared skill plus security, path, MCP, and limit references.
- `.mcp.json` — Claude remote MCP configuration.
- `mcp/codex.json` — Codex remote MCP configuration.
- `config/endpoint.json` — canonical endpoint value used to generate both MCP configurations and the Codex skill dependency.
- `scripts/` — dependency-free endpoint synchronization and package validation.

## Production endpoint

The package currently uses:

```text
https://atlas.idealize.com.au/api/mcp
```

Update every generated consumer from the single canonical value:

```bash
npm run configure:endpoint -- https://your-production-host.example/mcp
npm run validate
```

The configurator accepts HTTPS URLs only and rejects embedded credentials, query strings, and fragments. Do not hand-edit generated endpoint copies; edit via the command or change `config/endpoint.json` and run `npm run configure:endpoint`.

## Install

### Claude Code

For local development:

```bash
claude --plugin-dir /absolute/path/to/skill-atlas-plugin
```

For marketplace-style testing from the repository:

```bash
claude plugin marketplace add /absolute/path/to/skill-atlas-plugin
claude plugin install skills-atlas@skills-atlas
```

Start a fresh session, run `/mcp` to verify `skills-atlas`, then ask Claude to import local skills (`/skills-atlas:import-skills`) or install team plugins (`/skills-atlas:install-plugins`).

Before distribution, host the complete Git repository and have users add the repository URL or `owner/repo`. Do not distribute only the marketplace JSON URL: relative plugin sources require the rest of the repository.

### Cursor

Add `https://github.com/idealize-dev/skill-atlas-plugin.git` as a plugin
marketplace, install **Skills Atlas**, and start a new chat. Ask Cursor to list
Skills Atlas import destinations; the first MCP request opens browser OAuth.
Then ask it to use the Skills Atlas import skill to discover and import local
skills.

### Codex / ChatGPT desktop

Add this repository as a local marketplace:

```bash
codex plugin marketplace add /absolute/path/to/skill-atlas-plugin
```

Restart the ChatGPT desktop app, open the Plugins Directory, select the **Skills Atlas** source, and install **Skills Atlas**. Start a new chat after installation. Codex CLI marketplace commands manage sources; installation and local plugin testing currently happen in the desktop Plugins Directory.

## Authentication

The remote server should advertise MCP OAuth 2.1 when user data or write tools require authentication.

- Sign in through the host's MCP authentication prompt.
- Claude Code: inspect the connection with `/mcp`.
- Codex/ChatGPT desktop: open **Settings → MCP servers** or use `/mcp`, then select **Authenticate** when prompted.
- Never paste access tokens into chat, commit them, add them to this package, or place them in an imported skill.

This repository contains no credentials or static authorization headers. If the production service uses a non-OAuth bearer token, configure it in the host's secure MCP settings rather than this package.

## Import safety and privacy

The importer scans only documented local skill roots and user-approved custom paths. It reads candidate files as inert data; it does not run scripts, hooks, package managers, binaries, notebooks, or instructions found inside a skill.

Before any write, the user sees:

1. discovered candidates and warnings;
2. available remote destinations;
3. file/byte totals and server limits;
4. the exact conflict list;
5. the final create/overwrite/rename/skip plan.

File content is sent only after the user selects candidates and a destination, resolves every conflict, and approves the final preview. The plugin sends approved skill-folder content to the configured Skills Atlas MCP service. Service-side retention, deletion, access control, and telemetry are governed by the deployed Skills Atlas service; verify its published privacy policy before public release. The plugin must not log payloads, credentials, or signed URLs.

## Limits

The MCP server advertises and enforces:

- 25 skills per preview/import batch;
- 100 files per skill folder;
- 512,000 raw bytes per file;
- 2,000,000 raw bytes per batch;
- one atomic write call at a time.

Unsafe paths, special files, escaping symlinks, unreadable files, and over-limit folders block that folder. The importer never claims a partial folder is complete.

## Validate

Node.js 18 or newer is sufficient; there are no package dependencies.

```bash
npm run validate
```

When Claude Code is installed, also run its official validator:

```bash
claude plugin validate . --strict
```

For Codex, add the local marketplace, install the plugin in ChatGPT desktop, restart, and exercise discovery, no-conflict, rename, skip, overwrite, stale-preview, over-limit, auth-failure, and interrupted-upload cases.

## Troubleshooting

### MCP server is missing or disconnected

Confirm the generated URLs match `config/endpoint.json` with `npm run validate`. Verify the endpoint is public HTTPS and supports streamable HTTP. Reload Claude plugins with `/reload-plugins` or restart the Codex/ChatGPT desktop host.

### Authentication loops or returns 401/403

Use the host's MCP authentication UI and confirm the server publishes valid OAuth metadata. Remove stale host credentials and authenticate again. Do not work around OAuth by adding a token to this repository.

### No local skills are found

Check the documented roots:

- Claude personal: `~/.claude/skills/`
- Claude project: `.claude/skills/`
- Codex user: `~/.agents/skills/`
- Codex repository: `.agents/skills/`
- Codex admin on Unix-like hosts: `/etc/codex/skills/`

Each skill must be a folder containing a regular `SKILL.md`. Custom roots require explicit user approval.

### A conflict cannot proceed

The server must return exact conflicts from a read-only preview. Choose `overwrite`, supply a valid new name for `rename`, or choose `skip`. A renamed item must be previewed again. If remote state changes, preview and approve again.

### Upload stops midway

Do not blindly retry. A successful batch result includes a Git commit SHA and
imported paths. If no commit was returned, re-run the read-only preview for that
batch. If a commit was returned, treat that batch as complete and continue only
with the remaining plans.

### Marketplace entry cannot find the plugin

Add the Git repository or local repository root, not the raw marketplace JSON URL. Both marketplace manifests intentionally use `./` because the plugin lives at the repository root.

## Standards referenced

- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)
- [OpenAI plugin skills](https://developers.openai.com/plugins/build/skills)
- [Codex skills](https://developers.openai.com/codex/skills)
- [Codex MCP](https://developers.openai.com/codex/mcp)

## License

MIT. See `LICENSE`.
