import type { IndicatorDefinition, Measurement } from '../data/project'

export type SavedTargets = Record<string, number>

export const STORAGE_KEYS = {
  targets: 'raiz-cuidado-indicator-targets',
  measurements: 'raiz-cuidado-indicator-measurements',
  testimonials: 'raiz-cuidado-authorized-testimonials',
  academic: 'raiz-cuidado-academic-context',
} as const

export function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    return JSON.parse(stored) as T
  } catch (error) {
    console.warn(`Não foi possível ler a preferência local "${key}".`, error)
    return fallback
  }
}

export function saveStoredValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Não foi possível salvar a preferência local "${key}".`, error)
    throw new Error('Não foi possível salvar os dados neste dispositivo.')
  }
}

export function latestMeasurements(
  measurements: Measurement[],
  indicatorId: string,
): Measurement[] {
  return measurements
    .filter((measurement) => measurement.indicatorId === indicatorId)
    .toSorted((left, right) => left.date.localeCompare(right.date))
}

export function formatIndicatorValue(value: number, definition: IndicatorDefinition): string {
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
  return definition.unit === '%' ? `${formatted}%` : `${formatted} ${definition.unit}`
}

export function buildReportText(options: {
  projectName: string
  institution: string
  course: string
  period: string
  areaLabel: string
  phaseLabel: string
  reportDate: string
  updatedAt?: string
  sourceName: string
  definitions: IndicatorDefinition[]
  values: Record<string, number>
  measurements: Measurement[]
  targets: SavedTargets
}): string {
  const indicatorLines = options.definitions.map((definition) => {
    const current =
      latestMeasurements(options.measurements, definition.id).at(-1)?.value ??
      options.values[definition.id] ??
      definition.reportedValue
    const target = options.targets[definition.id]
    return `- ${definition.name}: ${formatIndicatorValue(current, definition)}${target === undefined ? ' (meta não definida)' : ` · Meta: ${formatIndicatorValue(target, definition)}`}`
  })

  return [
    options.projectName,
    `${options.institution} · ${options.course}`,
    `${options.period} · Etapa: ${options.phaseLabel} · Frente: ${options.areaLabel}`,
    `Relatório gerado em: ${options.reportDate}`,
    `Fonte: ${options.sourceName}${options.updatedAt ? ` · Atualizada em ${new Date(options.updatedAt).toLocaleString('pt-BR')}` : ''}`,
    '',
    ...indicatorLines,
    '',
    'Notas metodológicas: redução percebida de desperdício é autoavaliação; alcance indireto é estimado. Os indicadores do projeto representam o ciclo completo quando não há medições datadas.',
  ].join('\n')
}

export function createCsv(
  definitions: IndicatorDefinition[],
  values: Record<string, number>,
  measurements: Measurement[],
  targets: SavedTargets,
): string {
  const rows = [
    ['Indicador', 'Resultado atual', 'Meta', 'Unidade', 'Data da medição', 'Observação metodológica'],
    ...definitions.map((definition) => {
      const history = latestMeasurements(measurements, definition.id)
      const latest = history.at(-1)
      return [
        definition.name,
        String(latest?.value ?? values[definition.id] ?? definition.reportedValue),
        targets[definition.id] === undefined ? 'Não definida' : String(targets[definition.id]),
        definition.unit,
        latest?.date ?? 'Resultado informado para o ciclo; data não informada',
        definition.source,
      ]
    }),
  ]

  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\n')}`
}

function escapeCsv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeVideoEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null

    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1)
      return /^[\w-]{11}$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : null
    }

    if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      const videoId = url.searchParams.get('v')
      return videoId && /^[\w-]{11}$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : null
    }

    if (['player.vimeo.com'].includes(url.hostname)) {
      const videoId = url.pathname.split('/').filter(Boolean).at(-1)
      return videoId && /^\d+$/.test(videoId)
        ? `https://player.vimeo.com/video/${videoId}`
        : null
    }

    return null
  } catch {
    return null
  }
}
