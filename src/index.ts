import { define } from "@opencode-ai/plugin/v2/promise"

type Options = {
  /** OpenRouter model IDs mapped to CLIProxyAPI model IDs. */
  modelMap?: Record<string, string>
}

const validLimit = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

export const Plugin = define({
  id: "cliproxy-openrouter-metadata",
  setup: async (ctx) => {
    const options = (ctx.options ?? {}) as Options
    const aliases = options.modelMap ?? {}
    await ctx.catalog.transform(async (catalog) => {
      // Use the exact OpenCode provider/model catalog. That catalog is the source
      // of truth; no guessed OpenRouter slugs or independently fetched metadata.
      const openrouter = catalog.provider.get("openrouter")
      if (!openrouter) {
        console.warn("[cliproxy-openrouter-metadata] OpenCode catalog has no openrouter provider")
        return
      }
      const truthByID = new Map<string, { context: number; output: number; name: string }>()
      const truthByName = new Map<string, { context: number; output: number; name: string }>()
      for (const [id, model] of openrouter.models) {
        const context = model.limit?.context
        const output = model.limit?.output
        if (!validLimit(context)) continue
        const truth = { context, output: validLimit(output) ? output : 0, name: model.name }
        truthByID.set(id.toLowerCase(), truth)
        truthByName.set(normalize(model.name), truth)
      }

      for (const provider of catalog.provider.list()) {
        const providerID = provider.provider.id
        if (providerID === "openrouter" || providerID !== "cliproxyapi") continue
        for (const [modelID, proxyModel] of provider.models) {
          const alias = aliases[`${providerID}/${modelID}`] ?? aliases[modelID]
          const metadata = alias
            ? truthByID.get(alias.toLowerCase())
            : truthByName.get(normalize(proxyModel.name))
          if (!metadata) continue
          catalog.model.update(providerID, modelID, (model) => {
            model.limit.context = metadata.context
            if (metadata.output) model.limit.output = metadata.output
          })
        }
      }
    })
  },
})

export default Plugin
