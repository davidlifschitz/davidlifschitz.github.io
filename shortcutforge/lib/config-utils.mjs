export function deepMergeConfig(base, override) {
  const merged = { ...base, ...override };
  if (override?.llmProviders) {
    merged.llmProviders = { ...base.llmProviders };
    for (const [key, providerOverride] of Object.entries(override.llmProviders)) {
      merged.llmProviders[key] = {
        ...(base.llmProviders?.[key] || {}),
        ...providerOverride,
        modelFallbacks: providerOverride.modelFallbacks
          ? [...providerOverride.modelFallbacks]
          : base.llmProviders?.[key]?.modelFallbacks,
      };
    }
  }
  if (override?.examplePrompts) {
    merged.examplePrompts = [...override.examplePrompts];
  }
  return merged;
}

export function parseProviderModels(data) {
  const models = Array.isArray(data?.data) ? data.data : [];
  return models
    .map((model) => ({
      id: model.id || model.root || model.name,
      name: model.name || model.id || model.root,
    }))
    .filter((model) => model.id)
    .filter((model, index, all) => all.findIndex((candidate) => candidate.id === model.id) === index)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function collectProviderConnectOrigins(config) {
  const origins = new Set(["'self'"]);
  for (const provider of Object.values(config.llmProviders || {})) {
    for (const field of ['endpoint', 'modelsEndpoint']) {
      const value = provider?.[field];
      if (typeof value === 'string' && value.startsWith('https://')) {
        origins.add(new URL(value).origin);
      }
    }
  }
  if (typeof config.scheduleOsEndpoint === 'string' && config.scheduleOsEndpoint.startsWith('https://')) {
    origins.add(new URL(config.scheduleOsEndpoint).origin);
  }
  return [...origins].sort();
}
