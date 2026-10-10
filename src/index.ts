import { Plugin } from "@opencode/plugin"
import type { Model } from "@opencode/schema/model"
import type { ProviderRecord } from "@opencode/plugin/promise/provider"

type Options = {
  /** Map CLIProxyAPI model IDs to IDs in the OpenRouter provider catalog. */
  modelMap?: Record<string, string>
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const valid = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0

function indexModels(record: ProviderRecord | undefined) {
  const byID = new Map<string, Model.Info>()
  const byName = new Map<string, Model.Info>()
  for (const [id, model] of record?.models ?? []) {
    if (!valid(model.limit.context)) continue
    byID.set(id.toLowerCase(), model)
    byName.set(normalize(model.name), model)
  }
  return { byID, byName }
}

const MetadataPlugin = Plugin.define({
  id: "cliproxy-openrouter-metadata",
  async setup(ctx) {
    const options = ctx.options as Options
    const aliases = options.modelMap ?? {}

    await ctx.model.transform((editor) => {
      const proxy = editor.provider.get("cliproxyapi")
      const openrouter = editor.provider.get("openrouter")
      if (!proxy || !openrouter) return

      const { byID, byName } = indexModels(openrouter)
      for (const [id, proxyModel] of proxy.models) {
        const mapped = aliases[id] ?? aliases[`cliproxyapi/${id}`]
        const match = mapped ? byID.get(mapped.toLowerCase()) : byName.get(normalize(proxyModel.name))
        if (!match) continue

        editor.update("cliproxyapi", id, (model) => {
          model.limit.context = match.limit.context
          if (valid(match.limit.output)) model.limit.output = match.limit.output
        })
      }
    })
  },
})

export default MetadataPlugin
