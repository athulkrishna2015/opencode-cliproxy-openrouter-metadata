import type { Hooks, Plugin } from "@opencode-ai/plugin"
import type { Model, Provider } from "@opencode-ai/sdk/v2"

type Options = {
  /** Map CLIProxyAPI model IDs to IDs in the OpenRouter provider catalog. */
  modelMap?: Record<string, string>
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const valid = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0

const plugin: Plugin = async ({ client }, rawOptions): Promise<Hooks> => {
  const options = (rawOptions ?? {}) as Options
  const { data: providerResponse } = await client.provider.list()
  const openrouter = providerResponse?.all.find((provider) => provider.id === "openrouter")
  const openrouterModels = openrouter?.models ?? {}
  const aliases = options.modelMap ?? {}
  const truthByID = new Map<string, (typeof openrouterModels)[string]>()
  const truthByName = new Map<string, (typeof openrouterModels)[string]>()
  for (const [id, model] of Object.entries(openrouterModels)) {
    if (!valid(model.limit.context)) continue
    truthByID.set(id.toLowerCase(), model)
    truthByName.set(normalize(model.name), model)
  }

  return ({
  provider: {
    id: "cliproxyapi",
    models: async (provider: Provider, _ctx): Promise<Record<string, Model>> => {
      const updates: Record<string, Model> = {}
      for (const [id, proxyModel] of Object.entries(provider.models)) {
        const mapped = aliases[id] ?? aliases[`cliproxyapi/${id}`]
        const match = mapped
          ? truthByID.get(mapped.toLowerCase())
          : truthByName.get(normalize(proxyModel.name))
        if (!match) continue
        updates[id] = {
          ...proxyModel,
          limit: {
            ...proxyModel.limit,
            context: match.limit.context,
            output: valid(match.limit.output) ? match.limit.output : proxyModel.limit.output,
          },
        }
      }
      return updates
    },
  },
  })
}

export default { id: "cliproxy-openrouter-metadata", server: plugin }
