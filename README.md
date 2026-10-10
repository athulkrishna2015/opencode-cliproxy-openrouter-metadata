# OpenCode CLIProxyAPI OpenRouter Metadata

An OpenCode V2 plugin that aligns model context and output limits for the `cliproxyapi` provider with matching entries from OpenCode's own `openrouter` provider catalog. It does not guess model IDs or fetch a separate catalog behind OpenCode's back.

> This changes OpenCode's local model catalog only. It does not modify CLIProxyAPI, increase the upstream model's actual capability, or bypass upstream request limits. OpenRouter metadata is a source of truth for OpenRouter's representation, not necessarily every provider route behind a similarly named model.

## Install

Install the published package through OpenCode's plugin configuration (or use a local plugin directory during development):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-cliproxy-openrouter-metadata"]
}
```

For local development, add the absolute plugin directory to the V2 `plugins` array, for example `"/home/me/.config/opencode/plugins/cliproxy-openrouter-metadata"`. This implementation uses OpenCode V2's `@opencode/plugin` API and is not compatible with V1's plugin runtime.

## Options

By default, the plugin matches normalized display names: comparison is case-insensitive and ignores punctuation, spaces, and other non-alphanumeric characters. To avoid relying on names, provide an explicit mapping from a CLIProxyAPI model ID to an ID in OpenCode's OpenRouter catalog.

```jsonc
{
  "plugins": [{
    "package": "opencode-cliproxy-openrouter-metadata",
    "options": {
      "modelMap": {
        "gpt-6-luna": "openai/gpt-6-luna",
        "cliproxyapi/gpt-6-luna": "openai/gpt-6-luna"
      }
    }
  }]
}
```

- `modelMap`: map CLIProxyAPI model IDs (either the bare ID or `cliproxyapi/<id>`) to OpenRouter model IDs as they appear in OpenCode's catalog. Do not include the `openrouter/` provider prefix in the target ID.

Only provider ID `cliproxyapi` is modified. The plugin reads source definitions from the `openrouter` and `cliproxyapi` provider catalogs and updates matched CLIProxyAPI limits. Unmatched models and metadata remain unchanged. Values are reapplied when OpenCode rebuilds its model catalog; the plugin does not run a periodic fetch.

## Data source and refresh

Uses the `limit.context` and `limit.output` values already present on OpenCode's OpenRouter model definitions. Context is copied when it is a positive integer; output is copied when it is a positive integer, otherwise the CLIProxyAPI model's existing output limit is retained. This reflects OpenCode's local OpenRouter catalog and does not guarantee that every upstream route with a similar name has the same limits.

## Compatibility

This plugin targets OpenCode V2 and depends on the `@opencode/plugin` and `@opencode/schema` V2 APIs. OpenCode V1 is not supported.

## Development

```sh
bun install
bun run typecheck
```

## License

MIT
