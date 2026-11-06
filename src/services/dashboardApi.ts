import type { IndicatorDefinition, Measurement } from '../data/project'

export type DashboardSnapshot = {
  updatedAt: string
  indicators: Partial<Record<string, number>>
  targets: Record<string, number>
  measurements: Measurement[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))

export async function fetchDashboardSnapshot(
  url: string,
  signal: AbortSignal,
  definitions: IndicatorDefinition[],
): Promise<DashboardSnapshot> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`A fonte de dados respondeu com HTTP ${response.status}.`)
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !isValidDate(payload.updatedAt)) {
    throw new Error('A resposta da fonte não contém uma data de atualização válida.')
  }

  const knownIds = new Set(definitions.map((definition) => definition.id))
  const indicators: DashboardSnapshot['indicators'] = {}
  const targets: DashboardSnapshot['targets'] = {}

  if (payload.indicators !== undefined) {
    if (!isRecord(payload.indicators)) {
      throw new Error('O campo "indicators" precisa ser um objeto JSON.')
    }

    for (const [id, value] of Object.entries(payload.indicators)) {
      if (!knownIds.has(id)) continue
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error(`O indicador "${id}" precisa ser um número não negativo.`)
      }
      indicators[id] = value
    }
  }

  if (payload.targets !== undefined) {
    if (!isRecord(payload.targets)) {
      throw new Error('O campo "targets" precisa ser um objeto JSON.')
    }

    for (const [id, value] of Object.entries(payload.targets)) {
      if (!knownIds.has(id)) continue
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error(`A meta do indicador "${id}" precisa ser um número não negativo.`)
      }
      targets[id] = value
    }
  }

  const measurements: Measurement[] = []
  if (payload.measurements !== undefined) {
    if (!Array.isArray(payload.measurements)) {
      throw new Error('O campo "measurements" precisa ser uma lista.')
    }

    for (const [index, item] of payload.measurements.entries()) {
      if (
        !isRecord(item) ||
        typeof item.indicatorId !== 'string' ||
        !knownIds.has(item.indicatorId) ||
        typeof item.value !== 'number' ||
        !Number.isFinite(item.value) ||
        item.value < 0 ||
        !isValidDate(item.date)
      ) {
        throw new Error(`A medição ${index + 1} tem campos inválidos.`)
      }

      if (
        item.target !== undefined &&
        (typeof item.target !== 'number' || !Number.isFinite(item.target) || item.target < 0)
      ) {
        throw new Error(`A meta da medição ${index + 1} precisa ser um número não negativo.`)
      }

      measurements.push({
        id: typeof item.id === 'string' ? item.id : `api-${item.indicatorId}-${item.date}-${index}`,
        indicatorId: item.indicatorId,
        value: item.value,
        ...(typeof item.target === 'number' ? { target: item.target } : {}),
        date: item.date,
        ...(typeof item.note === 'string' ? { note: item.note } : {}),
      })
    }
  }

  return { updatedAt: payload.updatedAt, indicators, targets, measurements }
}
