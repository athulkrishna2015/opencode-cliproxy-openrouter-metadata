# OpenCode CLIProxyAPI OpenRouter Metadata

An OpenCode plugin that corrects context/output limits on the `cliproxyapi` provider using the actual `openrouter` provider and model catalog loaded by OpenCode. It does not guess model IDs or fetch a different catalog behind OpenCode's back.

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

The plugin uses the OpenRouter model ID when explicitly mapped; otherwise it matches the exact display name in OpenCode's OpenRouter and CLIProxyAPI catalogs. This means similarly named models share limits only when their catalog names agree.

```jsonc
{
  "plugin": ["opencode-cliproxy-openrouter-metadata"],
  "pluginConfig": {
    "cliproxy-openrouter-metadata": {
      "modelMap": {
        "gpt-6-luna": "openai/gpt-6-luna",
        "cliproxyapi/gpt-6-luna": "openai/gpt-6-luna"
      }
    }
  }
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
