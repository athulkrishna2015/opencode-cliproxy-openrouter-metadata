import { define } from "@opencode-ai/plugin/v2/promise"

type OpenRouterModel = {
  id: string
  name?: string
  context_length?: number
  top_provider?: { max_completion_tokens?: number }
}

type Options = {
  /** Refresh interval in milliseconds. Defaults to one hour. */
  refreshMs?: number
  /** OpenRouter model IDs mapped to local CLIProxyAPI model IDs. */
  modelMap?: Record<string, string>
}

const endpoint = "https://openrouter.ai/api/v1/models"
const validLimit = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0

export const Plugin = define({
  id: "cliproxy-openrouter-metadata",
  setup: async (ctx) => {
    const options = (ctx.options ?? {}) as Options
    const refreshMs = Math.max(60_000, options.refreshMs ?? 60 * 60 * 1000)
    const aliases = options.modelMap ?? {}
    let cached: Map<string, OpenRouterModel> | undefined
    let fetchedAt = 0
    let pending: Promise<Map<string, OpenRouterModel>> | undefined

    const load = async () => {
      if (cached && Date.now() - fetchedAt < refreshMs) return cached
      if (pending) return pending
      pending = (async () => {
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } })
        if (!response.ok) throw new Error(`OpenRouter model list returned HTTP ${response.status}`)
        const body = await response.json() as { data?: OpenRouterModel[] }
        if (!Array.isArray(body.data)) throw new Error("Unexpected OpenRouter model-list response")
        const result = new Map<string, OpenRouterModel>()
        for (const model of body.data) if (model.id) result.set(model.id.toLowerCase(), model)
        cached = result
        fetchedAt = Date.now()
        return result
      })().finally(() => { pending = undefined })
      return pending
    }

    await ctx.catalog.transform(async (catalog) => {
      let models: Map<string, OpenRouterModel>
      try {
        models = await load()
      } catch (error) {
        // Keep the provider catalog intact if OpenRouter is unavailable.
        console.warn(`[cliproxy-openrouter-metadata] ${String(error)}`)
        return
      }

      // Ground truth is the OpenCode `openrouter` provider catalog, not a guessed
      // external ID convention. Its model IDs and listed limits must agree with
      // the current OpenRouter public model list before they are propagated.
      const openrouter = catalog.provider.get("openrouter")
      if (!openrouter) {
        console.warn("[cliproxy-openrouter-metadata] OpenCode catalog has no openrouter provider")
        return
      }
      const truth = new Map<string, OpenRouterModel>()
      for (const [id, model] of openrouter.models) {
        const metadata = models.get(id.toLowerCase())
        if (!metadata || !validLimit(metadata.context_length)) continue
        const catalogContext = model.limit?.context
        if (catalogContext !== metadata.context_length) continue
        truth.set(id.toLowerCase(), metadata)
      }

      for (const provider of catalog.provider.list()) {
        const providerID = provider.provider.id
        const providerName = provider.provider.name
        if (providerID === "openrouter" || !/cli.?proxy/i.test(`${providerID} ${providerName}`)) continue
        for (const modelID of provider.models.keys()) {
          const openRouterID = aliases[`${providerID}/${modelID}`] ?? aliases[modelID] ?? modelID
          const metadata = truth.get(openRouterID.toLowerCase())
          if (!metadata) continue
          catalog.model.update(providerID, modelID, (model) => {
            model.limit.context = metadata.context_length!
            const output = metadata.top_provider?.max_completion_tokens
            if (validLimit(output)) model.limit.output = output
          })
        }
      }
    })
  },
})
