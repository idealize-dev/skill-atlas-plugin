import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const required = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  ".mcp.json",
  "mcp/codex.json",
  "config/endpoint.json",
  "skills/import-skills/SKILL.md",
  "skills/import-skills/agents/openai.yaml",
];

for (const relative of required) {
  try {
    await access(path.join(root, relative));
  } catch {
    errors.push(`Missing required file: ${relative}`);
  }
}

async function json(relative) {
  try {
    return JSON.parse(await readFile(path.join(root, relative), "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${relative}: ${error.message}`);
    return {};
  }
}

const endpointConfig = await json("config/endpoint.json");
const claudeManifest = await json(".claude-plugin/plugin.json");
const claudeMarketplace = await json(".claude-plugin/marketplace.json");
const codexManifest = await json(".codex-plugin/plugin.json");
const codexMarketplace = await json(".agents/plugins/marketplace.json");
const claudeMcp = await json(".mcp.json");
const codexMcp = await json("mcp/codex.json");

let endpoint;
try {
  endpoint = new URL(endpointConfig.mcpEndpoint);
  if (endpoint.protocol !== "https:") errors.push("The MCP endpoint must use HTTPS.");
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    errors.push("The MCP endpoint must not contain credentials, a query, or a fragment.");
  }
} catch {
  errors.push("config/endpoint.json must contain an absolute mcpEndpoint URL.");
}

for (const [name, manifest] of [
  ["Claude", claudeManifest],
  ["Codex", codexManifest],
]) {
  if (manifest.name !== "skills-atlas") errors.push(`${name} plugin name must be skills-atlas.`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
    errors.push(`${name} version must be semantic x.y.z.`);
  }
  if (manifest.skills !== "./skills/") errors.push(`${name} manifest must use shared ./skills/.`);
}

if (claudeManifest.mcpServers !== "./.mcp.json") {
  errors.push("Claude manifest must reference ./.mcp.json.");
}
if (codexManifest.mcpServers !== "./mcp/codex.json") {
  errors.push("Codex manifest must reference ./mcp/codex.json.");
}
if (claudeMarketplace.plugins?.[0]?.source !== "./") {
  errors.push("Claude marketplace must source the repository-root plugin.");
}
if (codexMarketplace.plugins?.[0]?.source?.path !== "./") {
  errors.push("Codex marketplace must source the repository-root plugin.");
}

const configuredEndpoint = endpointConfig.mcpEndpoint;
if (claudeMcp.mcpServers?.["skills-atlas"]?.url !== configuredEndpoint) {
  errors.push(".mcp.json is out of sync; run npm run configure:endpoint.");
}
if (codexMcp["skills-atlas"]?.url !== configuredEndpoint) {
  errors.push("mcp/codex.json is out of sync; run npm run configure:endpoint.");
}

const skill = await readFile(path.join(root, "skills/import-skills/SKILL.md"), "utf8");
if (!skill.startsWith("---\n") || !/^name:\s+import-skills$/m.test(skill)) {
  errors.push("SKILL.md must have import-skills YAML frontmatter.");
}
for (const phrase of [
  "Never execute imported content",
  "explicit `overwrite`, `rename`, or `skip`",
  "Upload complete approved folders",
]) {
  if (!skill.includes(phrase)) errors.push(`SKILL.md is missing safety rule: ${phrase}`);
}

const openai = await readFile(
  path.join(root, "skills/import-skills/agents/openai.yaml"),
  "utf8",
);
if (!openai.includes(`url: "${configuredEndpoint}"`)) {
  errors.push("agents/openai.yaml is out of sync; run npm run configure:endpoint.");
}

const textFiles = [
  ".mcp.json",
  "mcp/codex.json",
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];
const credentialPattern =
  /("(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)"\s*:\s*")(?!\s*")[^"]+/i;
for (const relative of textFiles) {
  const text = await readFile(path.join(root, relative), "utf8");
  if (credentialPattern.test(text)) errors.push(`Possible embedded credential in ${relative}.`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${required.length} required files and both plugin formats.`);
  console.log(`Canonical MCP endpoint: ${endpoint?.href ?? configuredEndpoint}`);
}
