import { describe, expect, it, vi } from 'vitest'
import { indicatorDefinitions, recipeResources } from '../data/project'
import { fetchDashboardSnapshot } from '../services/dashboardApi'
import { createCsv, latestMeasurements, safeVideoEmbedUrl } from './dashboard'

describe('dashboard data utilities', () => {
  it('provides a clearly labeled complementary 12-recipe collection', () => {
    expect(recipeResources).toHaveLength(12)
    expect(new Set(recipeResources.map((recipe) => recipe.id)).size).toBe(12)
    expect(recipeResources.every((recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0 && recipe.safety.length > 0)).toBe(true)
  })

  it('exports only the requested indicators and escapes CSV values', () => {
    const definition = indicatorDefinitions.find((item) => item.id === 'wasteReduction')
    if (!definition) throw new Error('Expected the waste reduction indicator fixture.')

    const csv = createCsv([definition], { wasteReduction: 72 }, [], {})

    expect(csv).toContain('"Famílias com redução percebida de desperdício"')
    expect(csv).toContain('"72"')
    expect(csv).not.toContain('"Participantes diretos"')
    expect(csv).toContain('"Autoavaliação relatada pelas famílias participantes; não corresponde à pesagem de resíduos."')
  })

  it('sorts actual measurements chronologically without inventing a baseline', () => {
    const measurements = [
      { id: 'later', indicatorId: 'wasteReduction', value: 72, date: '2025-06-01' },
      { id: 'earlier', indicatorId: 'wasteReduction', value: 70, date: '2025-03-01' },
    ]

    expect(latestMeasurements(measurements, 'wasteReduction').map(({ id }) => id)).toEqual(['earlier', 'later'])
    expect(latestMeasurements(measurements, 'directParticipants')).toEqual([])
  })

  it('accepts only safe supported video embed URLs', () => {
    expect(safeVideoEmbedUrl('https://youtu.be/abcdefghijk')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk')
    expect(safeVideoEmbedUrl('javascript:alert(1)')).toBeNull()
    expect(safeVideoEmbedUrl('https://example.com/video')).toBeNull()
  })

  it('validates API snapshots and rejects malformed measurements', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updatedAt: '2025-05-01T10:00:00Z',
        indicators: { wasteReduction: 71 },
        targets: { wasteReduction: 80 },
        measurements: [{ indicatorId: 'wasteReduction', value: 71, date: '2025-05-01' }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const snapshot = await fetchDashboardSnapshot('https://example.test/data.json', new AbortController().signal, indicatorDefinitions)

    expect(snapshot.indicators.wasteReduction).toBe(71)
    expect(snapshot.targets.wasteReduction).toBe(80)
    expect(snapshot.measurements).toHaveLength(1)

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        updatedAt: '2025-05-01T10:00:00Z',
        targets: { wasteReduction: 80 },
      }),
    })
    const targetOnlySnapshot = await fetchDashboardSnapshot('https://example.test/data.json', new AbortController().signal, indicatorDefinitions)
    expect(targetOnlySnapshot.targets.wasteReduction).toBe(80)

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        updatedAt: '2025-05-01T10:00:00Z',
        measurements: [{ indicatorId: 'wasteReduction', value: -1, date: '2025-05-01' }],
      }),
    })
    await expect(fetchDashboardSnapshot('https://example.test/data.json', new AbortController().signal, indicatorDefinitions))
      .rejects.toThrow('A medição 1 tem campos inválidos.')
  })
})
