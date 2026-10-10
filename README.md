# OpenCode CLIProxyAPI OpenRouter Metadata

An OpenCode plugin that corrects stale context/output limits on CLIProxyAPI models using OpenRouter's public model catalog as the metadata source. For example, if OpenRouter lists a matched model with a 1M-token context, the OpenCode model picker and context accounting can use that value rather than a stale limit embedded in a proxy catalog.

> This changes OpenCode's local model catalog only. It does not modify CLIProxyAPI, increase the upstream model's actual capability, or bypass upstream request limits. OpenRouter metadata is a source of truth for OpenRouter's representation, not necessarily every provider route behind a similarly named model.

## Install

Install the package from npm (after publication) and add it to your OpenCode configuration:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-cliproxy-openrouter-metadata"]
}
```

For local development, place this repository in `~/.config/opencode/plugins/cliproxy-openrouter-metadata` and configure the plugin by its local package path/name according to your OpenCode version.

## Options

The plugin matches OpenRouter IDs directly to local model IDs by default. Aliases are useful when CLIProxyAPI exposes a short name such as `gpt-6-luna` but OpenRouter uses an organization-qualified identifier.

```jsonc
{
  "plugin": ["opencode-cliproxy-openrouter-metadata"],
  "pluginConfig": {
    "cliproxy-openrouter-metadata": {
      "refreshMs": 3600000,
      "modelMap": {
        "gpt-6-luna": "openai/gpt-6-luna",
        "custom-codex/gpt-6-luna": "openai/gpt-6-luna"
      }
    }
  }
}
```

- `refreshMs`: refresh interval (minimum 60 seconds; default one hour).
- `modelMap`: map local model IDs (or `provider-id/model-id`) to OpenRouter IDs.

Only providers whose ID or display name contains `CLIProxy` are touched. Only exact, case-insensitive OpenRouter ID matches (or explicit mappings) are applied; unmatched models and metadata remain unchanged. Fetch errors are logged and do not block OpenCode startup.

## Data source and refresh

Uses `GET https://openrouter.ai/api/v1/models`. `context_length` sets OpenCode's `limit.context`; `top_provider.max_completion_tokens`, when present, sets `limit.output`. The list is cached in memory for the configured interval, so changes to OpenRouter's catalog are picked up automatically at the next refresh/catalog load.

## Development

```sh
bun install
bun run typecheck
```

## License

MIT
