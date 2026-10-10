# OpenCode CLIProxyAPI OpenRouter Metadata

An OpenCode plugin that corrects context/output limits on the `cliproxyapi` provider using the actual `openrouter` provider and model catalog loaded by OpenCode. It does not guess model IDs or fetch a different catalog behind OpenCode's back.

> This changes OpenCode's local model catalog only. It does not modify CLIProxyAPI, increase the upstream model's actual capability, or bypass upstream request limits. OpenRouter metadata is a source of truth for OpenRouter's representation, not necessarily every provider route behind a similarly named model.

## Install

Add the plugin package to OpenCode V2's global or project `opencode.json` configuration:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-cliproxy-openrouter-metadata"]
}
```

For local development, add the absolute plugin directory to the V2 `plugins` array, for example `"/home/me/.config/opencode/plugins/cliproxy-openrouter-metadata"`. V2 plugin code uses `@opencode/plugin` and is not compatible with V1's plugin runtime.

## Options

The plugin uses the OpenRouter model ID when explicitly mapped; otherwise it matches the exact display name in OpenCode's OpenRouter and CLIProxyAPI catalogs. This means similarly named models share limits only when their catalog names agree.

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

- `modelMap`: map local model IDs (or `provider-id/model-id`) to OpenRouter IDs.

Only provider ID `cliproxyapi` is touched. Values come from provider ID `openrouter` already present in OpenCode's catalog. Unmatched models and metadata remain unchanged. Updated values are applied whenever OpenCode rebuilds its catalog; no periodic timer is needed because the OpenCode provider/model list is the source of truth.

## Data source and refresh

Uses OpenCode's `openrouter` provider model entries. The OpenRouter model's `limit.context` sets the matched CLIProxyAPI model's `limit.context`; its `limit.output` sets the matched output limit. This deliberately reflects the OpenRouter catalog presented to this OpenCode installation and does not assert that all upstream providers for a model have identical limits.

## Development

```sh
bun install
bun run typecheck
```

## License

MIT
