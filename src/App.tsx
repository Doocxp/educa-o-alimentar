import { startTransition, useEffect, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CookingPot,
  Download,
  Earth,
  FileImage,
  FileText,
  Heart,
  Leaf,
  ListFilter,
  Minus,
  Menu,
  Moon,
  Plus,
  Printer,
  Presentation,
  RefreshCw,
  Recycle,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
  Video,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  areas,
  indicatorDefinitions,
  methodologyNotes,
  phases,
  projectProfile,
  recipeResources,
  workshopDetails,
  type AreaId,
  type Measurement,
} from './data/project'
import { fetchDashboardSnapshot } from './services/dashboardApi'
import {
  buildReportText,
  createCsv,
  downloadTextFile,
  formatIndicatorValue,
  latestMeasurements,
  readStoredValue,
  safeVideoEmbedUrl,
  saveStoredValue,
  STORAGE_KEYS,
  type SavedTargets,
} from './utils/dashboard'
import {
  SUPABASE_CONFIGURED,
} from './services/backendConfig'
import './App.css'

const navItems = [
  { label: 'Visão geral', id: 'visao-geral', icon: Sparkles },
  { label: 'Impacto', id: 'impacto', icon: Earth },
  { label: 'Indicadores', id: 'indicadores', icon: Target },
  { label: 'Jornada', id: 'jornada', icon: ArrowRight },
  { label: 'Materiais', id: 'materiais', icon: BookOpen },
  { label: 'Aprendizados', id: 'aprendizados', icon: BookOpen },
]

const fontScales = [1, 1.08, 1.16, 1.24]
const API_POLL_INTERVAL = 5 * 60 * 1000
const API_ENDPOINT = import.meta.env.VITE_DASHBOARD_DATA_URL?.trim() ?? ''
const VIDEO_URL = import.meta.env.VITE_EDUCATIONAL_VIDEO_URL?.trim() ?? ''
const sustainabilityQuotes = [
  { text: 'Pequenas mudanças, grandes colheitas.', kind: 'INSPIRAÇÃO' },
  { text: 'Planejar as refeições ajuda a aproveitar melhor cada alimento.', kind: 'DICA DE PLANEJAMENTO' },
  { text: 'Talos e folhas próprios para consumo podem virar novas receitas.', kind: 'APROVEITAMENTO' },
  { text: 'Separar resíduos orgânicos é o primeiro passo para compostar.', kind: 'COMPOSTAGEM' },
  { text: 'Compartilhar excedentes fortalece os laços da comunidade.', kind: 'CUIDADO EM REDE' },
  { text: 'Cada escolha consciente pode reduzir desperdícios no dia a dia.', kind: 'CONSUMO CONSCIENTE' },
]
const getLocalDateInputValue = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}
const formatMeasurementDate = (date: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date).toLocaleDateString('pt-BR')
const getSavedTheme = () => {
  try {
    return localStorage.getItem('raiz-cuidado-theme') === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.warn('Não foi possível ler o tema salvo.', error)
    return 'light'
  }
}
const getSavedFontScale = () => {
  try {
    const savedScale = Number(localStorage.getItem('raiz-cuidado-font-scale'))
    return fontScales.includes(savedScale) ? savedScale : 1.08
  } catch (error) {
    console.warn('Não foi possível ler o tamanho de texto salvo.', error)
    return 1.08
  }
}

type AreaFilter = AreaId | 'todas'
type ApiState = {
  loading: boolean
  updatedAt?: string
  indicators: Partial<Record<string, number>>
  targets: SavedTargets
  measurements: Measurement[]
  error?: string
}
type AdminState = { loading: boolean; email?: string; isAdmin: boolean; error?: string }

type Testimonial = { id: string; author: string; quote: string; consent: true }
type AcademicContext = typeof projectProfile

const isValidMeasurement = (value: unknown): value is Measurement =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'indicatorId' in value &&
  typeof value.indicatorId === 'string' &&
  indicatorDefinitions.some((definition) => definition.id === value.indicatorId) &&
  'value' in value &&
  typeof value.value === 'number' &&
  Number.isFinite(value.value) &&
  value.value >= 0 &&
  'date' in value &&
  typeof value.date === 'string' &&
  !Number.isNaN(Date.parse(value.date))

const getSavedMeasurements = (): Measurement[] => {
  const saved = readStoredValue<unknown>(STORAGE_KEYS.measurements, [])
  return Array.isArray(saved) ? saved.filter(isValidMeasurement) : []
}

const getSavedTargets = (): SavedTargets => {
  const saved = readStoredValue<unknown>(STORAGE_KEYS.targets, {})
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return {}
  return Object.fromEntries(
    Object.entries(saved).filter(
      ([id, value]) =>
        indicatorDefinitions.some((definition) => definition.id === id) &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0,
    ),
  )
}

const getAcademicContext = (): AcademicContext => {
  const saved = readStoredValue<Partial<AcademicContext>>(STORAGE_KEYS.academic, {})
  return {
    institution: saved.institution?.trim() || projectProfile.institution,
    course: saved.course?.trim() || projectProfile.course,
    period: saved.period?.trim() || projectProfile.period,
    location: projectProfile.location,
  }
}

const getSavedTestimonials = (): Testimonial[] => {
  const saved = readStoredValue<unknown>(STORAGE_KEYS.testimonials, [])
  if (!Array.isArray(saved)) return []
  return saved.filter(
    (item): item is Testimonial =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      'author' in item &&
      typeof item.author === 'string' &&
      'quote' in item &&
      typeof item.quote === 'string' &&
      'consent' in item &&
      item.consent === true,
  )
}

function App() {
  const [selectedPhaseId, setSelectedPhaseId] = useState(phases[2].id)
  const [phaseFilter, setPhaseFilter] = useState('todas')
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('todas')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(indicatorDefinitions[0].id)
  const [activeReachIndex, setActiveReachIndex] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState('visao-geral')
  const [menuOpen, setMenuOpen] = useState(false)
  const [exported, setExported] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteHovered, setQuoteHovered] = useState(false)
  const [quoteFocused, setQuoteFocused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [theme, setTheme] = useState(getSavedTheme)
  const [fontScale, setFontScale] = useState(getSavedFontScale)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [profileHelpOpen, setProfileHelpOpen] = useState(false)
  const [measurementHistory, setMeasurementHistory] = useState<Measurement[]>(getSavedMeasurements)
  const [targets, setTargets] = useState<SavedTargets>(getSavedTargets)
  const [academicContext, setAcademicContext] = useState<AcademicContext>(getAcademicContext)
  const [academicEditing, setAcademicEditing] = useState(false)
  const [academicDraft, setAcademicDraft] = useState<AcademicContext>(getAcademicContext)
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [measurementDraft, setMeasurementDraft] = useState(() => ({
    indicatorId: indicatorDefinitions[0].id,
    value: '',
    target: '',
    date: getLocalDateInputValue(),
    note: '',
  }))
  const [testimonials, setTestimonials] = useState<Testimonial[]>(getSavedTestimonials)
  const [testimonialDraft, setTestimonialDraft] = useState({ author: '', quote: '', consent: false })
  const [testimonialMessage, setTestimonialMessage] = useState('')
  const [resourceFilter, setResourceFilter] = useState<'todos' | 'receita' | 'manual' | 'infografico' | 'video'>('todos')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [apiState, setApiState] = useState<ApiState>({ loading: Boolean(SUPABASE_CONFIGURED || API_ENDPOINT), indicators: {}, targets: {}, measurements: [] })
  const [adminState, setAdminState] = useState<AdminState>({ loading: SUPABASE_CONFIGURED, isAdmin: false })
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' })
  const [adminBusy, setAdminBusy] = useState(false)
  const [refreshRequest, setRefreshRequest] = useState(0)
  const [presentationMode, setPresentationMode] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [reportGeneratedAt, setReportGeneratedAt] = useState('')
  const [todayLabel] = useState(() => new Date().toLocaleDateString('pt-BR'))
  const [goalDraft, setGoalDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(getSavedTargets()).map(([id, value]) => [id, String(value)]),
    ),
  )

  const combinedMeasurements = [...measurementHistory, ...apiState.measurements].filter(
    (measurement, index, list) => list.findIndex((entry) => entry.id === measurement.id) === index,
  )

  const selectedPhase = phases.find((phase) => phase.id === selectedPhaseId) ?? phases[0]
  const visiblePhases = phaseFilter === 'todas' ? phases : phases.filter((phase) => phase.id === phaseFilter)
  const selectedArea = areas.find((area) => area.id === areaFilter)
  const visibleIndicators = indicatorDefinitions.filter((definition) => {
    const matchesArea = areaFilter === 'todas' || definition.areas.includes(areaFilter)
    const matchesPhase =
      phaseFilter === 'todas' ||
      Boolean(phases.find((phase) => phase.id === phaseFilter)?.areas.some((area) => definition.areas.includes(area)))
    return matchesArea && matchesPhase
  })
  const visibleWorkshops = workshopDetails.filter((workshop) => {
    const matchesArea = areaFilter === 'todas' || workshop.areas.includes(areaFilter)
    const matchesPhase =
      phaseFilter === 'todas' ||
      Boolean(phases.find((phase) => phase.id === phaseFilter)?.areas.some((area) => workshop.areas.includes(area)))
    return matchesArea && matchesPhase
  })
  const resourceRecipes =
    areaFilter === 'todas' || areaFilter === 'reaproveitamento' || areaFilter === 'alimentacao'
      ? recipeResources
      : []
  const selectedIndicator = indicatorDefinitions.find((definition) => definition.id === selectedIndicatorId) ?? indicatorDefinitions[0]
  const selectedIndicatorHistory = latestMeasurements(combinedMeasurements, selectedIndicatorId)
  const selectedRecipe = recipeResources.find((recipe) => recipe.id === selectedRecipeId)

  const getCurrentValue = (indicatorId: string): number => {
    const history = latestMeasurements(combinedMeasurements, indicatorId)
    return history.at(-1)?.value ?? apiState.indicators[indicatorId] ?? indicatorDefinitions.find((definition) => definition.id === indicatorId)?.reportedValue ?? 0
  }
  const getCurrentTarget = (indicatorId: string): number | undefined =>
    targets[indicatorId] ?? apiState.targets[indicatorId]
  const currentTargets = Object.fromEntries(indicatorDefinitions.flatMap(({ id }) => {
    const target = getCurrentTarget(id)
    return target === undefined ? [] : [[id, target]]
  }))
  const reachData = [
    { name: 'Participantes diretos', value: getCurrentValue('directParticipants'), color: '#347d5b' },
    { name: 'Alcance indireto estimado', value: getCurrentValue('indirectReach'), color: '#e5b548' },
  ]
  const reachTotal = reachData.reduce((total, item) => total + item.value, 0)
  const videoEmbedUrl = safeVideoEmbedUrl(VIDEO_URL)
  const currentDate = todayLabel
  const dataStatus = !SUPABASE_CONFIGURED && !API_ENDPOINT
    ? 'Dados do projeto'
    : apiState.loading
      ? 'Sincronizando'
      : apiState.error
        ? 'Fonte indisponível'
        : apiState.updatedAt
          ? 'Dados atualizados'
          : 'Aguardando fonte'
  const evolutionData = selectedIndicatorHistory.map((measurement) => ({
    date: formatMeasurementDate(measurement.date),
    result: measurement.value,
    target: measurement.target ?? getCurrentTarget(selectedIndicatorId),
    note: measurement.note,
  }))

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || quoteHovered || quoteFocused) return
    const interval = window.setInterval(() => {
      setQuoteIndex((index) => (index + 1) % sustainabilityQuotes.length)
    }, 8000)
    return () => window.clearInterval(interval)
  }, [prefersReducedMotion, quoteHovered, quoteFocused])

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return
    let active = true
    let unsubscribe: (() => void) | undefined

    void import('./services/supabase').then(({ getProjectAdminStatus, getSupabaseClient }) => {
      if (!active) return
      const supabase = getSupabaseClient()
      const refreshAdminStatus = async () => {
        try {
          const status = await getProjectAdminStatus()
          if (active) setAdminState({ loading: false, ...status })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível verificar o acesso administrativo.'
          console.error('Falha ao verificar acesso administrativo:', error)
          if (active) setAdminState((current) => ({ ...current, loading: false, error: message }))
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          if (active) setAdminState({ loading: false, isAdmin: false })
          return
        }
        if (active) setAdminState({ loading: true, isAdmin: false, email: session.user.email })
        window.setTimeout(() => void refreshAdminStatus(), 0)
      })
      unsubscribe = () => subscription.unsubscribe()
      void refreshAdminStatus()
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar o acesso administrativo.'
      console.error('Falha ao carregar o módulo Supabase:', error)
      if (active) setAdminState({ loading: false, isAdmin: false, error: message })
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!SUPABASE_CONFIGURED && !API_ENDPOINT) {
      return
    }

    let disposed = false
    const fetching = { current: false }
    const controller = { current: null as AbortController | null }

    const refresh = async () => {
      if (fetching.current || document.visibilityState === 'hidden') return
      fetching.current = true
      controller.current = new AbortController()
      const requestController = controller.current
      const timeout = window.setTimeout(() => requestController.abort(), 12_000)
      startTransition(() => setApiState((current) => ({ ...current, loading: true, error: undefined })))

      try {
        const snapshot = SUPABASE_CONFIGURED
          ? await import('./services/supabase').then(({ fetchSupabaseSnapshot }) =>
            fetchSupabaseSnapshot(indicatorDefinitions, requestController.signal),
          )
          : await fetchDashboardSnapshot(API_ENDPOINT, requestController.signal, indicatorDefinitions)
        if (disposed) return
        startTransition(() => setApiState({
          loading: false,
          updatedAt: snapshot.updatedAt,
          indicators: snapshot.indicators,
          targets: snapshot.targets,
          measurements: snapshot.measurements,
        }))
      } catch (error) {
        if (disposed || requestController.signal.aborted) {
          if (!disposed) {
            startTransition(() => setApiState((current) => ({
              ...current,
              loading: false,
              error: 'A atualização demorou mais de 12 segundos. Os últimos dados disponíveis foram mantidos.',
            })))
          }
          return
        }

        const message = error instanceof Error ? error.message : 'Falha inesperada ao atualizar os dados.'
        console.error('Falha ao atualizar a fonte do dashboard:', error)
        startTransition(() => setApiState((current) => ({ ...current, loading: false, error: message })))
      } finally {
        window.clearTimeout(timeout)
        fetching.current = false
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), API_POLL_INTERVAL)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      disposed = true
      controller.current?.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshRequest])

  useEffect(() => {
    if (!presentationMode) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresentationMode(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [presentationMode])

  const navigateTo = (id: string) => {
    setActiveSection(id)
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const changeFontScale = (direction: -1 | 1) => {
    const currentIndex = fontScales.indexOf(fontScale)
    const nextIndex = Math.max(0, Math.min(fontScales.length - 1, currentIndex + direction))
    try {
      localStorage.setItem('raiz-cuidado-font-scale', String(fontScales[nextIndex]))
    } catch (error) {
      console.error('Não foi possível salvar o tamanho de texto preferido.', error)
      setReportMessage('O tamanho do texto foi alterado, mas não pôde ser salvo neste dispositivo.')
    }
    setFontScale(fontScales[nextIndex])
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem('raiz-cuidado-theme', nextTheme)
    } catch (error) {
      console.error('Não foi possível salvar o tema preferido.', error)
      setReportMessage('O tema foi alterado, mas não pôde ser salvo neste dispositivo.')
    }
    setTheme(nextTheme)
  }

  const getReportText = () =>
    buildReportText({
      projectName: 'Raiz & Cuidado — Educação alimentar e reaproveitamento',
      institution: academicContext.institution,
      course: academicContext.course,
      period: academicContext.period,
      areaLabel: selectedArea?.label ?? 'Todas as frentes',
      phaseLabel: phaseFilter === 'todas' ? 'Ciclo completo' : selectedPhase.name,
      reportDate: new Date().toLocaleString('pt-BR'),
      updatedAt: apiState.updatedAt,
      sourceName: SUPABASE_CONFIGURED ? 'Supabase com indicadores publicados' : API_ENDPOINT ? 'API configurada' : 'Relato informado para o projeto',
      definitions: visibleIndicators,
      values: Object.fromEntries(visibleIndicators.map((definition) => [definition.id, getCurrentValue(definition.id)])),
      measurements: combinedMeasurements,
      targets: currentTargets,
    })

  const exportSummary = () => {
    try {
      const values = Object.fromEntries(
        indicatorDefinitions.map((definition) => [definition.id, getCurrentValue(definition.id)]),
      )
      downloadTextFile(
        'impacto-educacao-alimentar.csv',
        createCsv(visibleIndicators, values, combinedMeasurements, currentTargets),
        'text/csv;charset=utf-8',
      )
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Não foi possível exportar os dados.')
      return
    }
    setExported(true)
    window.setTimeout(() => setExported(false), 2400)
  }

  const handleShareReport = async () => {
    const report = getReportText()
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Relatório de impacto — Raiz & Cuidado', text: report })
        setReportMessage('Relatório compartilhado.')
        return
      }
      await navigator.clipboard.writeText(report)
      setReportMessage('Resumo copiado para a área de transferência.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Falha ao compartilhar o relatório:', error)
      setReportMessage('Não foi possível compartilhar. Tente imprimir ou copiar os dados manualmente.')
    }
  }

  const handlePrintReport = () => {
    setReportGeneratedAt(new Date().toLocaleString('pt-BR'))
    window.setTimeout(() => window.print(), 50)
  }

  const handleSaveTargets = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTargets: SavedTargets = { ...targets }
    for (const definition of visibleIndicators) {
      const { id } = definition
      const currentTarget = getCurrentTarget(id)
      const rawValue = goalDraft[id] ?? (currentTarget === undefined ? '' : String(currentTarget))
      if (rawValue.trim() === '') {
        delete nextTargets[id]
        continue
      }
      const value = Number(rawValue)
      if (!Number.isFinite(value) || value < 0) {
        setReportMessage('As metas devem ser números iguais ou maiores que zero.')
        return
      }
      nextTargets[id] = value
    }
    if (adminState.isAdmin) {
      const cloudTargets = Object.fromEntries(
        visibleIndicators.map(({ id }) => [id, nextTargets[id] ?? null]),
      )
      void (async () => {
        try {
          await import('./services/supabase').then(({ saveSupabaseTargets }) => saveSupabaseTargets(cloudTargets))
          setTargets(nextTargets)
          setApiState((current) => {
            const updatedTargets = { ...current.targets }
            for (const [id, value] of Object.entries(cloudTargets)) {
              if (value === null) delete updatedTargets[id]
              else updatedTargets[id] = value
            }
            return { ...current, targets: updatedTargets }
          })
          setGoalDraft(Object.fromEntries(Object.entries(nextTargets).map(([id, value]) => [id, String(value)])))
          setRefreshRequest((value) => value + 1)
          setReportMessage('Metas salvas no Supabase.')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível salvar as metas.'
          console.error('Falha ao salvar metas no Supabase:', error)
          setReportMessage(message)
        }
      })()
      return
    }

    try {
      saveStoredValue(STORAGE_KEYS.targets, nextTargets)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Erro ao salvar as metas.')
      return
    }
    setTargets(nextTargets)
    setGoalDraft(Object.fromEntries(Object.entries(nextTargets).map(([id, value]) => [id, String(value)])))
    setReportMessage('Metas salvas neste dispositivo.')
  }

  const handleAddMeasurement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(measurementDraft.value)
    const target = measurementDraft.target === '' ? undefined : Number(measurementDraft.target)
    if (!Number.isFinite(value) || value < 0 || (target !== undefined && (!Number.isFinite(target) || target < 0))) {
      setReportMessage('Resultado e meta devem ser números iguais ou maiores que zero.')
      return
    }
    const measurement: Measurement = {
      id: crypto.randomUUID(),
      indicatorId: measurementDraft.indicatorId,
      value,
      ...(target === undefined ? {} : { target }),
      date: measurementDraft.date,
      ...(measurementDraft.note.trim() ? { note: measurementDraft.note.trim() } : {}),
    }
    if (adminState.isAdmin) {
      setAdminBusy(true)
      try {
        await import('./services/supabase').then(({ saveSupabaseMeasurement }) => saveSupabaseMeasurement(measurement))
        setSelectedIndicatorId(measurement.indicatorId)
        setMeasurementDialogOpen(false)
        setMeasurementDraft((current) => ({ ...current, value: '', target: '', note: '' }))
        setRefreshRequest((current) => current + 1)
        setReportMessage('Medição publicada no Supabase com acesso de administrador.')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível salvar a medição no Supabase.'
        console.error('Falha ao salvar medição no Supabase:', error)
        setReportMessage(message)
      } finally {
        setAdminBusy(false)
      }
      return
    }
    const nextMeasurements = [...measurementHistory, measurement]
    const nextTargets = target === undefined ? targets : { ...targets, [measurement.indicatorId]: target }
    try {
      saveStoredValue(STORAGE_KEYS.measurements, nextMeasurements)
      if (target !== undefined) saveStoredValue(STORAGE_KEYS.targets, nextTargets)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Erro ao salvar a medição.')
      return
    }
    setMeasurementHistory(nextMeasurements)
    if (target !== undefined) {
      setTargets(nextTargets)
      setGoalDraft((current) => ({ ...current, [measurement.indicatorId]: String(target) }))
    }
    setSelectedIndicatorId(measurement.indicatorId)
    setMeasurementDialogOpen(false)
    setMeasurementDraft((current) => ({ ...current, value: '', target: '', note: '' }))
    setReportMessage('Medição registrada. Ela ficará salva neste dispositivo.')
  }

  const handleSaveAcademicContext = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextAcademicContext = {
      ...academicDraft,
      institution: academicDraft.institution.trim() || projectProfile.institution,
      course: academicDraft.course.trim() || projectProfile.course,
      period: academicDraft.period.trim() || projectProfile.period,
      location: projectProfile.location,
    }
    try {
      saveStoredValue(STORAGE_KEYS.academic, nextAcademicContext)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Erro ao salvar os dados acadêmicos.')
      return
    }
    setAcademicContext(nextAcademicContext)
    setAcademicEditing(false)
    setReportMessage('Identificação acadêmica atualizada.')
  }

  const handleAddTestimonial = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!testimonialDraft.consent) {
      setTestimonialMessage('Confirme que possui autorização explícita antes de registrar um depoimento.')
      return
    }
    if (!testimonialDraft.quote.trim()) {
      setTestimonialMessage('Informe o depoimento autorizado.')
      return
    }
    const nextTestimonial: Testimonial = {
      id: crypto.randomUUID(),
      author: testimonialDraft.author.trim() || 'Participante (anônimo)',
      quote: testimonialDraft.quote.trim(),
      consent: true,
    }
    const nextTestimonials = [...testimonials, nextTestimonial]
    try {
      saveStoredValue(STORAGE_KEYS.testimonials, nextTestimonials)
    } catch (error) {
      setTestimonialMessage(error instanceof Error ? error.message : 'Erro ao salvar o depoimento.')
      return
    }
    setTestimonials(nextTestimonials)
    setTestimonialDraft({ author: '', quote: '', consent: false })
    setTestimonialMessage('Depoimento autorizado registrado neste dispositivo.')
  }

  const downloadAsset = (filename: string, content: string, type: string) => {
    try {
      downloadTextFile(filename, content, type)
      setReportMessage(`${filename} baixado.`)
    } catch (error) {
      console.error(`Falha ao baixar "${filename}".`, error)
      setReportMessage(error instanceof Error ? error.message : `Não foi possível baixar ${filename}.`)
    }
  }

  const handleDownloadManual = () => {
    const recipeSections = recipeResources.map((recipe) => `
      <article><h2>${recipe.title}</h2><p><strong>${recipe.category} · ${recipe.time}</strong></p>
      <h3>Ingredientes</h3><ul>${recipe.ingredients.map((item) => `<li>${item}</li>`).join('')}</ul>
      <h3>Preparo</h3><ol>${recipe.steps.map((item) => `<li>${item}</li>`).join('')}</ol>
      <p><strong>Segurança alimentar:</strong> ${recipe.safety}</p></article>`).join('')
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Manual de reaproveitamento</title>
      <style>body{max-width:760px;margin:40px auto;padding:0 24px;font:16px/1.6 Arial,sans-serif;color:#26372d}h1{color:#226b48}article{padding:20px 0;border-bottom:1px solid #ddd}li{margin:6px 0}</style>
      <h1>Manual complementar de reaproveitamento alimentar</h1><p>Esta edição reúne 12 fichas preparadas como material educativo complementar para a dashboard. O manual original do projeto não foi disponibilizado; este conteúdo não é uma transcrição dele. Adapte ingredientes ao que está disponível, confirme alergias e restrições, higienize os alimentos e siga as orientações sanitárias locais.</p>${recipeSections}
      <p>Conteúdo complementar elaborado para a dashboard Raiz &amp; Cuidado. As receitas são sugestões educativas e não substituem orientação de profissional de saúde ou vigilância sanitária.</p></html>`
    downloadAsset('manual-reaproveitamento.html', html, 'text/html;charset=utf-8')
  }

  const handleDownloadInfographic = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="680" viewBox="0 0 1000 680">
      <rect width="1000" height="680" rx="32" fill="#f3f6eb"/><text x="60" y="82" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#668265">RAIZ &amp; CUIDADO · GUIA PRÁTICO</text>
      <text x="60" y="145" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#294835">Do alimento à horta</text>
      <text x="60" y="184" font-family="Arial,sans-serif" font-size="19" fill="#69796a">Quatro passos para cuidar melhor dos alimentos e dos resíduos orgânicos.</text>
      ${[
        ['1', 'Planeje', 'Organize compras e refeições para evitar excessos.'],
        ['2', 'Armazene', 'Higienize e conserve os alimentos de forma segura.'],
        ['3', 'Aproveite', 'Use folhas, talos e cascas próprios para consumo.'],
        ['4', 'Composte', 'Encaminhe resíduos orgânicos adequados à composteira.'],
      ].map(([number, title, description], index) => {
        const y = 245 + index * 92
        return `<circle cx="92" cy="${y}" r="22" fill="#2f7856"/><text x="92" y="${y + 7}" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="white">${number}</text><text x="137" y="${y + 6}" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="#35563e">${title}</text><text x="270" y="${y + 6}" font-family="Arial,sans-serif" font-size="18" fill="#657568">${description}</text>`
      }).join('')}
      <text x="60" y="642" font-family="Arial,sans-serif" font-size="15" fill="#7d897d">Aproveitamento integral depende de higienização, conservação e escolha de partes próprias para consumo.</text></svg>`
    downloadAsset('infografico-cuidado-com-alimentos.svg', svg, 'image/svg+xml;charset=utf-8')
  }

  const handleAdminSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminBusy(true)
    setAdminState((current) => ({ ...current, loading: true, error: undefined }))
    try {
      const { getProjectAdminStatus, signInProjectAdmin } = await import('./services/supabase')
      await signInProjectAdmin(adminCredentials.email.trim(), adminCredentials.password)
      const status = await getProjectAdminStatus()
      if (!status.isAdmin) {
        await import('./services/supabase').then(({ signOutProjectAdmin }) => signOutProjectAdmin())
        setAdminState({
          loading: false,
          isAdmin: false,
          error: 'Esta conta ainda não foi autorizada como administradora do projeto.',
        })
        return
      }
      setAdminState({ loading: false, ...status })
      setAdminCredentials((current) => ({ ...current, password: '' }))
      setAdminDialogOpen(false)
      setReportMessage('Acesso administrativo autorizado pelo Supabase.')
      setRefreshRequest((current) => current + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao autenticar no Supabase.'
      console.error('Falha na autenticação administrativa:', error)
      setAdminState((current) => ({ ...current, loading: false, error: message }))
    } finally {
      setAdminBusy(false)
    }
  }

  const handleAdminSignOut = async () => {
    setAdminBusy(true)
    try {
      await import('./services/supabase').then(({ signOutProjectAdmin }) => signOutProjectAdmin())
      setAdminState({ loading: false, isAdmin: false })
      setReportMessage('Sessão administrativa encerrada.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível encerrar a sessão.'
      console.error('Falha ao encerrar sessão administrativa:', error)
      setReportMessage(message)
    } finally {
      setAdminBusy(false)
    }
  }

  return (
    <div
      className={`app-shell theme-${theme} ${presentationMode ? 'presentation-mode' : ''}`}
      style={{ '--font-scale': fontScale } as CSSProperties}
      data-font-scale={fontScale}
    >
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <a className="brand-home" href="#visao-geral" onClick={() => navigateTo('visao-geral')}>
            <span className="brand-mark"><Sprout size={23} strokeWidth={2.2} /></span>
            <span className="brand-copy">
              <strong>Raiz &amp; Cuidado</strong>
              <small>Impacto que floresce</small>
            </span>
          </a>
          <button
            className="icon-button close-menu"
            type="button"
            aria-label="Fechar menu"
            onClick={(event) => {
              event.preventDefault()
              setMenuOpen(false)
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">ESPAÇO DO PROJETO</div>
        <div className="project-switcher">
          <span className="project-avatar"><Leaf size={17} /></span>
          <span className="project-name"><strong>Educação alimentar</strong><small>Projeto comunitário</small></span>
          <ChevronDown size={16} className="switcher-chevron" />
        </div>

        <nav className="sidebar-nav" aria-label="Navegação do painel">
          <span className="nav-heading">ACOMPANHAMENTO</span>
          {navItems.map(({ label, id, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${activeSection === id ? 'nav-link-active' : ''}`}
              type="button"
              onClick={() => navigateTo(id)}
            >
              <Icon size={17} strokeWidth={1.9} />
              <span>{label}</span>
              {activeSection === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <section
          className="sidebar-impact"
          aria-label="Dicas e inspiração ambiental"
          onMouseEnter={() => setQuoteHovered(true)}
          onMouseLeave={() => setQuoteHovered(false)}
          onFocusCapture={() => setQuoteFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setQuoteFocused(false)
          }}
        >
          <div className="impact-card-heading">
            <span className="impact-leaf"><Leaf size={18} /></span>
            <span>{sustainabilityQuotes[quoteIndex].kind}</span>
          </div>
          <p className="impact-quote" aria-live="polite" aria-atomic="true">{sustainabilityQuotes[quoteIndex].text}</p>
          <div className="impact-card-controls" role="group" aria-label="Selecionar uma dica">
            {sustainabilityQuotes.map((quote, index) => (
              <button
                key={quote.kind}
                type="button"
                aria-label={`Mostrar dica ${index + 1}: ${quote.kind}`}
                aria-pressed={index === quoteIndex}
                onClick={() => setQuoteIndex(index)}
              />
            ))}
          </div>
          <div className="impact-decoration" aria-hidden="true">✳</div>
        </section>
        <div className="profile-card">
          <div className="profile-avatar">LS</div>
          <div className="profile-copy"><strong>Luiz Souto</strong><small>Guarujá - SP</small></div>
          <div className="profile-help-wrap">
            <button
              className="profile-help"
              type="button"
              aria-label="Sobre este perfil"
              aria-expanded={profileHelpOpen}
              aria-describedby="profile-help-tooltip"
              onClick={() => setProfileHelpOpen(!profileHelpOpen)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setProfileHelpOpen(false)
              }}
            >
              <CircleHelp size={17} />
            </button>
            <span className={`profile-tooltip ${profileHelpOpen ? 'profile-tooltip-open' : ''}`} id="profile-help-tooltip" role="tooltip">
              Perfil responsável pela organização deste painel. O projeto foi realizado em Guarujá, SP.
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb"><strong>Educação alimentar</strong></div>
          <div className="topbar-actions">
            <span
              className="updated-label"
              title={SUPABASE_CONFIGURED ? 'Indicadores publicados no Supabase e atualizados automaticamente a cada cinco minutos.' : API_ENDPOINT ? 'Indicadores conectados à fonte configurada; a atualização automática ocorre a cada cinco minutos.' : 'Resultados apresentados conforme o relato do projeto. Configure o Supabase para sincronização e edição segura.'}
            >
              <span className={`status-dot ${apiState.loading ? 'status-loading' : ''} ${apiState.error ? 'status-error' : ''}`} /> {dataStatus}
            </span>
            {SUPABASE_CONFIGURED && <button
              className="admin-access-button"
              type="button"
              disabled={adminBusy || adminState.loading}
              onClick={() => adminState.isAdmin ? void handleAdminSignOut() : setAdminDialogOpen(true)}
            >
              <Users size={15} /><span>{adminState.isAdmin ? 'Sair do admin' : 'Acesso admin'}</span>
            </button>}
            <button className="icon-button presentation-toggle" type="button" aria-pressed={presentationMode} aria-label={presentationMode ? 'Sair do modo apresentação' : 'Ativar modo apresentação'} onClick={() => setPresentationMode(!presentationMode)}>
              {presentationMode ? <X size={17} /> : <Presentation size={17} />}
            </button>
            <div className="preferences-wrap">
              <button
                className="preferences-button"
                type="button"
                aria-label="Abrir preferências de visualização"
                aria-expanded={preferencesOpen}
                aria-controls="view-preferences"
                onClick={() => setPreferencesOpen(!preferencesOpen)}
              >
                <SlidersHorizontal size={16} />
                <span>Visualização</span>
              </button>
              {preferencesOpen && (
                <div
                  className="preferences-panel"
                  id="view-preferences"
                  aria-label="Preferências de visualização"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setPreferencesOpen(false)
                  }}
                >
                  <div className="preferences-heading">
                    <span><strong>Personalizar painel</strong><small>Preferências salvas neste dispositivo</small></span>
                    <button className="preferences-close" type="button" aria-label="Fechar preferências" onClick={() => setPreferencesOpen(false)}><X size={15} /></button>
                  </div>
                  <div className="preference-row">
                    <span className="preference-label"><span className="preference-icon">{theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}</span><span><strong>Tema</strong><small>{theme === 'dark' ? 'Modo escuro' : 'Modo claro'}</small></span></span>
                    <button className="theme-toggle" type="button" role="switch" aria-checked={theme === 'dark'} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={toggleTheme}><span /></button>
                  </div>
                  <div className="preference-row font-preference">
                    <span className="preference-label"><span className="preference-icon font-icon">A</span><span><strong>Tamanho do texto</strong><small>{Math.round(fontScale * 100)}% do tamanho padrão</small></span></span>
                    <span className="font-controls">
                      <button type="button" aria-label="Diminuir tamanho do texto" disabled={fontScales.indexOf(fontScale) === 0} onClick={() => changeFontScale(-1)}><Minus size={14} /></button>
                      <button type="button" aria-label="Aumentar tamanho do texto" disabled={fontScales.indexOf(fontScale) === fontScales.length - 1} onClick={() => changeFontScale(1)}><Plus size={14} /></button>
                    </span>
                  </div>
                  <button className="print-button" type="button" onClick={handlePrintReport}><Printer size={15} /> Imprimir ou salvar como PDF</button>
                </div>
              )}
            </div>
            <button className="icon-button share-button" type="button" aria-label="Compartilhar resumo" onClick={() => void handleShareReport()}><Share2 size={17} /></button>
            <button className="export-button" type="button" onClick={exportSummary}>
              {exported ? <Check size={16} /> : <Download size={16} />}
              <span>{exported ? 'Relatório baixado' : 'Exportar dados'}</span>
            </button>
          </div>
        </header>

        <div className="dashboard">
          <section className="welcome-section" id="visao-geral">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> PROJETO DE EXTENSÃO <span className="eyebrow-dot">·</span> IMPACTO LOCAL</div>
              <h1>Alimentar bem,<br /><span>transformar juntos.</span></h1>
              <p className="welcome-description">
                Ação no centro comunitário do Guarujá com famílias de baixa renda, estudantes e voluntários: novos hábitos, menos desperdício e mais cuidado em rede.
              </p>
              <div className="welcome-meta">
                <span><span className="meta-icon"><Heart size={14} /></span> Centro comunitário local</span>
                <span className="meta-divider" />
                <span>11 semanas de ação</span>
              </div>
              <div className="academic-summary">
                <span>{academicContext.institution} · {academicContext.course} · {academicContext.period}</span>
                <button type="button" onClick={() => {
                  setAcademicDraft(academicContext)
                  setAcademicEditing(!academicEditing)
                }}>{academicEditing ? 'Fechar' : 'Editar identificação'}</button>
              </div>
            </div>
            <div className="hero-art" aria-label="Ilustração de uma planta crescendo em um vaso">
              <div className="sun-shape" />
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-leaf leaf-one"><Leaf size={55} fill="currentColor" strokeWidth={1.3} /></div>
              <div className="hero-leaf leaf-two"><Leaf size={48} fill="currentColor" strokeWidth={1.3} /></div>
              <div className="hero-leaf leaf-three"><Leaf size={37} fill="currentColor" strokeWidth={1.3} /></div>
              <div className="hero-stem" />
              <div className="hero-pot"><span /><span /><span /></div>
              <div className="hero-ground" />
              <div className="hero-sparkle sparkle-one">✳</div>
              <div className="hero-sparkle sparkle-two">✦</div>
            </div>
            <div className="ods-badge"><span className="ods-icon">♧</span><span><small>ALINHADO À</small><strong>ODS 2 &amp; 12</strong></span></div>
            <div className="hero-caption"><span className="caption-icon"><Sprout size={16} /></span><span><strong>Impacto cultivado</strong><small>com a força da comunidade</small></span></div>
          </section>

          {academicEditing && (
            <form className="panel academic-form" onSubmit={handleSaveAcademicContext}>
              <label>Faculdade<input value={academicDraft.institution} onChange={(event) => setAcademicDraft((current) => ({ ...current, institution: event.target.value }))} placeholder="Nome da instituição" /></label>
              <label>Curso<input value={academicDraft.course} onChange={(event) => setAcademicDraft((current) => ({ ...current, course: event.target.value }))} placeholder="Nome do curso" /></label>
              <label>Período do projeto<input value={academicDraft.period} onChange={(event) => setAcademicDraft((current) => ({ ...current, period: event.target.value }))} placeholder="Ex.: março a junho de 2025" /></label>
              <button className="primary-button" type="submit"><Check size={15} /> Salvar identificação</button>
            </form>
          )}

          {!SUPABASE_CONFIGURED && !API_ENDPOINT && <div className="source-notice" role="note">
            <CircleHelp size={17} />
            <span><strong>Fonte ainda não conectada.</strong> Esta visualização usa os dados informados no projeto. Configure o Supabase e execute a migration documentada para ativar sincronização pública com edição restrita.</span>
          </div>}
          <section className="filter-toolbar panel" aria-label="Filtros do painel">
            <div className="filter-heading"><ListFilter size={17} /><span><strong>Explorar resultados</strong><small>Indicadores originais são resultados do ciclo inteiro; etapas não alteram a atribuição dos dados.</small></span></div>
            <label>Etapa
              <select value={phaseFilter} onChange={(event) => {
                setPhaseFilter(event.target.value)
                if (event.target.value !== 'todas') setSelectedPhaseId(event.target.value)
              }}>
                <option value="todas">Ciclo completo</option>
                {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name} · {phase.weeks}</option>)}
              </select>
            </label>
            <label>Frente
              <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as AreaFilter)}>
                <option value="todas">Todas as frentes</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
              </select>
            </label>
            {(SUPABASE_CONFIGURED || API_ENDPOINT) && <div className="sync-actions">
              <span>{apiState.updatedAt ? `Atualizado ${new Date(apiState.updatedAt).toLocaleString('pt-BR')}` : apiState.loading ? 'Sincronizando…' : 'Aguardando fonte de dados'}</span>
              <button className="icon-button" type="button" aria-label="Atualizar dados agora" disabled={apiState.loading} onClick={() => setRefreshRequest((value) => value + 1)}><RefreshCw size={16} /></button>
            </div>}
            {SUPABASE_CONFIGURED && adminState.isAdmin && <span className="admin-role-badge">Administrador: {adminState.email}</span>}
            {SUPABASE_CONFIGURED && adminState.error && <span className="form-message" role="status">{adminState.error}</span>}
          </section>
          {(apiState.error || reportMessage) && <div className={`feedback-banner ${apiState.error ? 'feedback-error' : ''}`} role="status">
            {apiState.error && <TriangleAlert size={16} />}
            <span>{apiState.error || reportMessage}</span>
            <button type="button" aria-label="Dispensar mensagem" onClick={() => {
              setReportMessage('')
              setApiState((current) => ({ ...current, error: undefined }))
            }}><X size={15} /></button>
          </div>}

          <section className="metrics-grid" aria-label="Indicadores principais">
            {visibleIndicators.slice(0, 4).map((definition, index) => {
              const target = getCurrentTarget(definition.id)
              const result = getCurrentValue(definition.id)
              const progress = target && target > 0 ? Math.min(100, Math.round((result / target) * 100)) : null
              const MetricIcon = [Users, Recycle, BookOpen, Sprout][index % 4]
              return <article className={`metric-card metric-${['green', 'yellow', 'blue', 'sage'][index % 4]}`} key={definition.id}>
                <div className="metric-top"><span className="metric-icon"><MetricIcon size={18} /></span><span className="metric-trend">{target === undefined ? 'resultado' : `${progress}% da meta`}</span></div>
                <div className="metric-value">{definition.id === 'indirectReach' ? '~' : ''}{formatIndicatorValue(result, definition)}</div>
                <div className="metric-label">{definition.name}</div>
                <div className="metric-foot"><span>{target === undefined ? 'Meta não definida' : `Meta: ${formatIndicatorValue(target, definition)}`}</span></div>
              </article>
            })}
          </section>

          <section className="analytics-grid" id="impacto">
            <article className="panel timeline-panel" id="jornada">
              <div className="panel-header">
                <div><div className="section-kicker">DO PLANEJAMENTO À COLHEITA</div><h2>Uma jornada de 11 semanas</h2><p className="panel-subtitle">Cada etapa plantou uma semente para o próximo passo.</p></div>
                <span className="period-pill"><span className="period-dot" /> Ciclo completo</span>
              </div>
              <div className="timeline-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visiblePhases} layout="vertical" margin={{ top: 0, right: 12, left: 3, bottom: 0 }} barCategoryGap={13}>
                    <CartesianGrid horizontal={false} stroke={theme === 'dark' ? '#35453b' : '#edf0e9'} />
                    <XAxis type="number" domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={(value: number) => `${value} sem.`} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#abb9ad' : '#8a928b', fontSize: 10 * fontScale, fontFamily: 'DM Sans' }} />
                    <YAxis type="category" dataKey="name" width={104} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#c1cec3' : '#59665d', fontSize: 11 * fontScale, fontFamily: 'DM Sans' }} />
                    <Tooltip
                      cursor={{ fill: theme === 'dark' ? '#28372d' : '#f6f7f2' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const phase = payload[0].payload as (typeof phases)[number]
                        return <div className="chart-tooltip"><strong>{phase.name}</strong><span>{phase.weeks} · {phase.duration} {phase.duration === 1 ? 'semana' : 'semanas'}</span></div>
                      }}
                    />
                    <Bar dataKey="duration" name="Duração" radius={[0, 5, 5, 0]} maxBarSize={15} onClick={(data) => {
                      const phase = phases.find((item) => item.name === data.name)
                      if (phase) setSelectedPhaseId(phase.id)
                    }} cursor="pointer">
                      {visiblePhases.map((phase) => <Cell key={phase.name} fill={selectedPhaseId === phase.id ? '#28754f' : phase.color} opacity={selectedPhaseId === phase.id ? 1 : 0.78} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="phase-detail" aria-live="polite">
                <span className="phase-detail-marker" style={{ backgroundColor: selectedPhase.color }} />
                <span className="phase-detail-week">{selectedPhase.weeks}</span>
                <span className="phase-detail-description">{selectedPhase.description}</span>
                <button className="phase-next" type="button" aria-label="Ver próxima etapa" onClick={() => {
                  const currentIndex = phases.findIndex((phase) => phase.id === selectedPhaseId)
                  const nextPhase = phases[(currentIndex + 1) % phases.length]
                  setSelectedPhaseId(nextPhase.id)
                  setPhaseFilter('todas')
                }}><ArrowRight size={16} /></button>
              </div>
            </article>

            <article className="panel reach-panel">
              <div className="panel-header">
                <div><div className="section-kicker">PESSOAS ALCANÇADAS</div><h2>O cuidado se espalha</h2></div>
                <span className="round-leaf"><Users size={17} /></span>
              </div>
              <div className="donut-wrap">
                <div className="donut-chart">
                  <ResponsiveContainer width="100%" height={206}>
                    <PieChart>
                      <Pie
                        data={reachData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={76}
                        paddingAngle={4}
                        stroke="none"
                        cornerRadius={5}
                        onMouseEnter={(_, index) => setActiveReachIndex(index)}
                        onMouseLeave={() => setActiveReachIndex(null)}
                        onClick={(_, index) => setActiveReachIndex(index)}
                      >
                      {reachData.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>~{reachTotal}</strong><span>pessoas</span></div>
                </div>
                <div className="reach-hover-card" aria-live="polite" aria-atomic="true">
                  {activeReachIndex === null ? (
                    <span className="reach-hover-hint">Selecione uma fatia para ver os detalhes.</span>
                  ) : (
                    <>
                      <span className="reach-hover-dot" style={{ backgroundColor: reachData[activeReachIndex].color }} />
                      <strong>{reachData[activeReachIndex].name}</strong>
                      <span className="reach-hover-value">{reachData[activeReachIndex].value} pessoas</span>
                    </>
                  )}
                </div>
              </div>
              <div className="reach-legend">
                {reachData.map((item) => <div className="reach-item" key={item.name}><span className="legend-dot" style={{ backgroundColor: item.color }} /><span className="reach-name">{item.name}</span><strong>{item.value}</strong></div>)}
              </div>
              <div className="reach-note"><ArrowUpRight size={15} /><span>Uma rede que continua além das oficinas.</span></div>
            </article>
          </section>

          <section className="panel indicator-section" id="indicadores" aria-labelledby="indicator-title">
            <div className="panel-header">
              <div><div className="section-kicker">METAS E ACOMPANHAMENTO</div><h2 id="indicator-title">Indicadores com contexto</h2><p className="panel-subtitle">Metas são internas e opcionais. Registre novas medições com a data real para visualizar evolução.</p></div>
              <button className="primary-button" type="button" onClick={() => setMeasurementDialogOpen(true)}><Plus size={16} /> Registrar medição</button>
            </div>
            <form className="targets-form" onSubmit={handleSaveTargets}>
              {visibleIndicators.map((definition) => <label key={definition.id}>
              <span>{definition.name}<small>Resultado atual: {formatIndicatorValue(getCurrentValue(definition.id), definition)}</small></span>
              <span className="target-input-wrap"><input type="number" min="0" step="any" aria-label={`Meta para ${definition.name}`} placeholder="Meta não definida" value={goalDraft[definition.id] ?? (getCurrentTarget(definition.id) === undefined ? '' : String(getCurrentTarget(definition.id)))} onChange={(event) => setGoalDraft((current) => ({ ...current, [definition.id]: event.target.value }))} /><span>{definition.unit}</span></span>
              </label>)}
              {visibleIndicators.length === 0 && <p className="empty-state">Nenhum indicador corresponde aos filtros atuais.</p>}
              <button className="secondary-button" type="submit"><Target size={15} /> {adminState.isAdmin ? 'Salvar metas no Supabase' : 'Salvar metas neste dispositivo'}</button>
            </form>

            <div className="evolution-layout">
              <div className="evolution-chart">
              <div className="chart-heading">
                <label htmlFor="evolution-indicator">Evolução de</label>
                <select id="evolution-indicator" value={selectedIndicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>
                  {indicatorDefinitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.name}</option>)}
                </select>
              </div>
              {evolutionData.length > 0 ? <div className="evolution-plot">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolutionData} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#35453b' : '#edf0e9'} />
                    <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#abb9ad' : '#788279', fontSize: 11 * fontScale }} />
                    <YAxis width={48} tick={{ fill: theme === 'dark' ? '#abb9ad' : '#788279', fontSize: 11 * fontScale }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme === 'dark' ? '#35453b' : '#e8ebe4'}`, background: theme === 'dark' ? '#1d2a22' : '#fff', color: theme === 'dark' ? '#e5eee5' : '#26372d' }} />
                    <Line type="monotone" dataKey="result" name="Resultado" stroke="#347d5b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="target" name="Meta da medição" stroke="#e5b548" strokeDasharray="6 5" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div> : <div className="empty-chart">
                <TrendingUp size={24} />
                <strong>O histórico começa com a primeira medição</strong>
                <span>Os resultados do relato inicial não têm data de medição informada e não são convertidos em pontos históricos.</span>
                <button className="secondary-button" type="button" onClick={() => {
                  setMeasurementDraft((current) => ({ ...current, indicatorId: selectedIndicatorId }))
                  setMeasurementDialogOpen(true)
                }}><Plus size={15} /> Adicionar medição real</button>
              </div>}
              </div>
              <aside className="indicator-note">
              <span className="note-icon"><ClipboardCheck size={18} /></span>
              <strong>{selectedIndicator.name}</strong>
              <span>{selectedIndicator.source}</span>
              <small>{combinedMeasurements.filter((measurement) => measurement.indicatorId === selectedIndicatorId).length} medições datadas registradas</small>
              </aside>
            </div>
          </section>

          <section className="panel workshop-section" aria-labelledby="workshop-title">
            <div className="panel-header"><div><div className="section-kicker">ATIVIDADES REALIZADAS</div><h2 id="workshop-title">Oficinas e frentes de trabalho</h2><p className="panel-subtitle">Abra cada cartão para conhecer o formato e os conteúdos abordados.</p></div></div>
            <div className="workshop-list">
              {visibleWorkshops.map((workshop) => <details className="workshop-card" key={workshop.id}>
              <summary><span className="workshop-icon"><CookingPot size={17} /></span><span><strong>{workshop.title}</strong><small>{workshop.count}</small></span><ChevronDown size={17} /></summary>
              <div className="workshop-detail"><p>{workshop.description}</p><p><strong>Abordagem:</strong> {workshop.approach}</p><div className="workshop-tags">{workshop.areas.map((areaId) => <span key={areaId}>{areas.find((area) => area.id === areaId)?.label}</span>)}</div></div>
              </details>)}
              {visibleWorkshops.length === 0 && <p className="empty-state">Nenhuma atividade para os filtros atuais.</p>}
            </div>
          </section>

          <section className="panel resource-section" id="materiais" aria-labelledby="resource-title">
            <div className="panel-header">
              <div><div className="section-kicker">BIBLIOTECA DO PROJETO</div><h2 id="resource-title">Materiais para compartilhar</h2><p className="panel-subtitle">Recursos educativos disponíveis nesta demonstração; o vídeo só aparece quando uma URL válida é configurada.</p></div>
              <label className="resource-filter"><Search size={15} /><select aria-label="Filtrar materiais" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value as typeof resourceFilter)}>
              <option value="todos">Todos os materiais</option><option value="receita">Receitas</option><option value="manual">Manual</option><option value="infografico">Infográfico</option><option value="video">Vídeo</option>
              </select></label>
            </div>
            <div className="resource-grid">
              {(resourceFilter === 'todos' || resourceFilter === 'manual') && <article className="resource-card resource-manual"><span className="resource-icon"><BookOpen size={20} /></span><span className="resource-type">MANUAL COMPLEMENTAR · 12 FICHAS</span><h3>Reaproveitamento com segurança</h3><p>Material novo preparado para a dashboard. O manual original citado no relato ainda não foi fornecido.</p><button className="secondary-button" type="button" onClick={handleDownloadManual}><Download size={15} /> Baixar manual</button></article>}
              {(resourceFilter === 'todos' || resourceFilter === 'infografico') && <article className="resource-card resource-infographic"><span className="resource-icon"><FileImage size={20} /></span><span className="resource-type">INFOGRÁFICO</span><h3>Do alimento à horta</h3><p>Um guia visual: planejar, armazenar, aproveitar e compostar.</p><button className="secondary-button" type="button" onClick={handleDownloadInfographic}><Download size={15} /> Baixar SVG</button></article>}
              {(resourceFilter === 'todos' || resourceFilter === 'infografico') && <article className="resource-card resource-checklist"><span className="resource-icon"><CheckCircle2 size={20} /></span><span className="resource-type">CHECKLIST</span><h3>Cuidados antes de reaproveitar</h3><p>Higiene, conservação e seleção de ingredientes próprios para consumo.</p><button className="secondary-button" type="button" onClick={() => downloadAsset('checklist-seguranca-alimentar.txt', 'CHECKLIST DE SEGURANÇA ALIMENTAR\\n\\n- Higienize as mãos, utensílios e superfícies.\\n- Use apenas partes próprias para consumo e sem deterioração.\\n- Refrigere prontamente sobras em recipiente limpo e fechado.\\n- Reaqueça completamente e descarte alimentos com sinais de alteração.\\n- Siga orientações sanitárias locais.\\n', 'text/plain;charset=utf-8')}><Download size={15} /> Baixar checklist</button></article>}
              {(resourceFilter === 'todos' || resourceFilter === 'receita') && resourceRecipes.map((recipe) => <button className="resource-card recipe-card" type="button" key={recipe.id} onClick={() => setSelectedRecipeId(recipe.id)}>
              <span className="resource-icon"><CookingPot size={20} /></span><span className="resource-type">FICHA DE RECEITA · {recipe.time}</span><h3>{recipe.title}</h3><p>{recipe.category}. Selecione para ver ingredientes, preparo e cuidados.</p><span className="resource-link">Abrir receita <ArrowRight size={14} /></span>
              </button>)}
              {(resourceFilter === 'todos' || resourceFilter === 'video') && <article className="resource-card resource-video">
              <span className="resource-icon"><Video size={20} /></span><span className="resource-type">VÍDEO EDUCATIVO</span><h3>{videoEmbedUrl ? 'Vídeo do projeto' : 'Espaço para vídeo educativo'}</h3>
              {videoEmbedUrl ? <iframe title="Vídeo educativo sobre alimentação e reaproveitamento" src={videoEmbedUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <><p>Adicione uma URL pública do YouTube ou Vimeo em <code>VITE_EDUCATIONAL_VIDEO_URL</code> para ativar a incorporação.</p><span className="video-placeholder"><Video size={24} /> Nenhum vídeo fornecido</span></>}
              </article>}
            </div>
          </section>

          <section className="methodology-grid" id="metodologia" aria-label="Metodologia e origem dos dados">
            <article className="panel methodology-panel">
              <div className="panel-header"><div><div className="section-kicker">TRANSPARÊNCIA</div><h2>Metodologia e origem dos dados</h2></div><span className="round-leaf"><FileText size={17} /></span></div>
              <div className="methodology-list">{methodologyNotes.map((note) => <details key={note.title}>
              <summary>{note.title}<ChevronDown size={16} /></summary><p>{note.description}</p>
              </details>)}</div>
              <div className="data-stamp"><CalendarDays size={15} /><span>Relatório gerado em {reportGeneratedAt || currentDate} · atualização dos dados: {apiState.updatedAt ? new Date(apiState.updatedAt).toLocaleString('pt-BR') : 'não disponível'}</span></div>
            </article>
            <article className="panel testimonial-panel">
              <div className="section-kicker">VOZES DA COMUNIDADE</div><h2>Depoimentos autorizados</h2>
              <p className="panel-subtitle">Nenhuma fala é exibida sem consentimento explícito. Os registros ficam somente neste dispositivo.</p>
              {testimonials.length ? <div className="testimonial-list">{testimonials.map((testimonial) => <details className="testimonial-entry" key={testimonial.id}>
                <summary><span><strong>{testimonial.author}</strong><small>Depoimento registrado com autorização</small></span><ChevronDown size={16} /></summary>
                <blockquote><p>“{testimonial.quote}”</p><footer><span>Autorização confirmada pelo responsável</span><button type="button" aria-label={`Remover depoimento de ${testimonial.author}`} onClick={() => {
                const nextTestimonials = testimonials.filter((entry) => entry.id !== testimonial.id)
                try {
                  saveStoredValue(STORAGE_KEYS.testimonials, nextTestimonials)
                  setTestimonials(nextTestimonials)
                } catch (error) {
                  setTestimonialMessage(error instanceof Error ? error.message : 'Erro ao remover o depoimento.')
                }
              }}><X size={14} /></button></footer></blockquote>
              </details>)}</div> : <div className="empty-testimonials"><Heart size={20} /><span>Adicione somente relatos com autorização verificável.</span></div>}
              <form className="testimonial-form" onSubmit={handleAddTestimonial}>
              <label>Identificação (opcional)<input value={testimonialDraft.author} onChange={(event) => setTestimonialDraft((current) => ({ ...current, author: event.target.value }))} placeholder="Participante (anônimo)" /></label>
              <label>Depoimento autorizado<textarea value={testimonialDraft.quote} onChange={(event) => setTestimonialDraft((current) => ({ ...current, quote: event.target.value }))} rows={3} /></label>
              <label className="consent-check"><input type="checkbox" checked={testimonialDraft.consent} onChange={(event) => setTestimonialDraft((current) => ({ ...current, consent: event.target.checked }))} /> Tenho autorização explícita para publicar este depoimento.</label>
              <button className="secondary-button" type="submit"><Plus size={15} /> Registrar depoimento</button>
              {testimonialMessage && <span className="form-message" role="status">{testimonialMessage}</span>}
              </form>
            </article>
          </section>

          <section className="results-grid" aria-label="Resultados da iniciativa">
            <article className="panel result-panel">
              <div className="panel-header compact-header"><div><div className="section-kicker">RESULTADOS NA PRÁTICA</div><h2>O que floresceu</h2></div><span className="result-count">{selectedArea?.label ?? 'Ciclo completo'}</span></div>
              <div className="achievement-list">
                {(areaFilter === 'todas' || areaFilter === 'compostagem') && <div className="achievement-row"><span className="achievement-icon achievement-icon-green"><Sprout size={17} /></span><span className="achievement-copy"><strong>Compostagem que cria raízes</strong><small>3 composteiras domésticas e 1 comunitária na horta.</small></span><span className="achievement-number">04</span></div>}
                <div className="achievement-row"><span className="achievement-icon achievement-icon-yellow"><Users size={17} /></span><span className="achievement-copy"><strong>Conhecimento multiplicado</strong><small>Voluntários preparados para replicar as oficinas.</small></span><span className="achievement-number">06</span></div>
                {(areaFilter === 'todas' || areaFilter === 'doacao') && <div className="achievement-row"><span className="achievement-icon achievement-icon-blue"><Heart size={17} /></span><span className="achievement-copy"><strong>Uma rede de cuidado</strong><small>Fluxo de excedentes conectado a famílias vulneráveis.</small></span><span className="achievement-number">02</span></div>}
              </div>
            </article>
            <article className="quote-card">
              <div className="quote-top"><span className="quote-icon"><Sparkles size={16} /></span><span>SÍNTESE DO PROJETO</span></div>
              <blockquote>Educação prática e soluções simples podem transformar a relação da comunidade com os alimentos.</blockquote>
              <div className="quote-divider" />
              <div className="next-step"><span className="next-step-icon"><ArrowUpRight size={16} /></span><span><strong>Próxima estação</strong><small>Ampliar parcerias e acompanhar os resultados por 6 meses.</small></span></div>
              <div className="quote-flower" aria-hidden="true">✿</div>
            </article>
          </section>

          <section className="detail-grid" aria-label="Frentes de atuação e desenvolvimento">
            <article className="panel action-panel">
              <div className="panel-header compact-header">
                <div><div className="section-kicker">COMO A MUDANÇA ACONTECEU</div><h2>Aprender fazendo</h2></div>
                <span className="result-count">3 frentes integradas</span>
              </div>
              <div className="action-columns">
                <div className="action-column">
                  <span className="action-icon action-education"><BookOpen size={16} /></span>
                  <strong>Educação alimentar</strong>
                  <p>Alimentação saudável, segurança dos alimentos e leitura de rótulos em linguagem acessível.</p>
                </div>
                <div className="action-column">
                  <span className="action-icon action-reuse"><Recycle size={16} /></span>
                  <strong>Reaproveitar com criatividade</strong>
                  <p>Receitas com cascas, talos, sobras e preparações com hortaliças integrais.</p>
                </div>
                <div className="action-column">
                  <span className="action-icon action-community"><Earth size={16} /></span>
                  <strong>Cuidar em comunidade</strong>
                  <p>Compostagem doméstica, horta comunitária e doação de excedentes alimentares.</p>
                </div>
              </div>
              <div className="materials-strip"><span className="materials-icon"><BookOpen size={14} /></span><span><strong>Materiais para continuar:</strong> manual de reaproveitamento, fichas de receitas, infográficos, checklists e vídeos curtos.</span></div>
            </article>
            <article className="panel role-panel">
              <div className="section-kicker">PROTAGONISMO E APRENDIZADO</div>
              <h2>Coordenação de ponta a ponta</h2>
              <p>Da escuta inicial ao relatório final, a atuação conectou conteúdo educativo e ação comunitária, reforçando o compromisso com a saúde coletiva.</p>
              <div className="role-tags">
                <span><Check size={12} /> Planejamento e diagnóstico</span>
                <span><Check size={12} /> Oficinas e comunicação educativa</span>
                <span><Check size={12} /> Compostagem e logística de doação</span>
              </div>
              <div className="skills-box"><strong>Competências desenvolvidas</strong><span>Gestão de projetos <i /> Comunicação educativa <i /> Metodologias participativas <i /> Nutrição e avaliação de impacto</span></div>
            </article>
          </section>

          <section className="learning-grid" id="aprendizados">
            <article className="panel challenge-panel">
              <div className="section-kicker">O QUE O CAMINHO ENSINOU</div>
              <h2>Desafios que viraram aprendizado</h2>
              <div className="challenge-list">
                <div><span className="challenge-dot" /><span><strong>Resistência inicial</strong><small>Respeitar o ritmo de cada família na mudança de hábitos.</small></span></div>
                <div><span className="challenge-dot" /><span><strong>Espaço e utensílios limitados</strong><small>Adaptar as oficinas culinárias aos recursos disponíveis.</small></span></div>
                <div><span className="challenge-dot" /><span><strong>Acompanhamento curto</strong><small>Onze semanas não permitem medir mudanças de longo prazo.</small></span></div>
              </div>
            </article>
            <article className="panel future-panel">
              <div className="section-kicker">PRÓXIMOS PASSOS</div>
              <h2>Fazer a rede crescer</h2>
              <div className="future-list">
                <div><ArrowUpRight size={14} /><span>Estender o acompanhamento por pelo menos seis meses.</span></div>
                <div><ArrowUpRight size={14} /><span>Conectar restaurantes locais e banco de alimentos à rede de doação.</span></div>
                <div><ArrowUpRight size={14} /><span>Incluir planejamento de compras e armazenamento para evitar perdas.</span></div>
                <div><ArrowUpRight size={14} /><span>Criar vídeos curtos para apoiar a replicação das oficinas.</span></div>
              </div>
            </article>
          </section>

          <section className="panel final-actions" aria-label="Compartilhar e exportar relatório">
            <div><div className="section-kicker">RELATÓRIO DO PROJETO</div><h2>Compartilhe os resultados com transparência</h2><p className="panel-subtitle">O resumo inclui filtros, data de geração e notas sobre estimativas e autoavaliações.</p></div>
            <div className="final-action-buttons">
              <button className="secondary-button" type="button" onClick={() => void handleShareReport()}><Share2 size={15} /> Compartilhar resumo</button>
              <button className="secondary-button" type="button" onClick={handlePrintReport}><Printer size={15} /> Imprimir / PDF</button>
              <button className="primary-button" type="button" onClick={exportSummary}><Download size={15} /> Exportar CSV filtrado</button>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span><span className="footer-mark"><Sprout size={15} /></span> Raiz &amp; Cuidado <span className="footer-separator">·</span> Projeto de extensão universitária</span>
            <span>{academicContext.institution} · {academicContext.course} · Guarujá, SP</span>
          </footer>
        </div>
      </main>
      {measurementDialogOpen && <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setMeasurementDialogOpen(false)
      }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="measurement-dialog-title" onKeyDown={(event) => {
          if (event.key === 'Escape') setMeasurementDialogOpen(false)
        }}>
          <button className="modal-close" type="button" autoFocus aria-label="Fechar registro de medição" onClick={() => setMeasurementDialogOpen(false)}><X size={18} /></button>
          <span className="section-kicker">NOVA MEDIÇÃO</span><h2 id="measurement-dialog-title">Registrar dado observado</h2>
          <p>Use a data real da coleta. {adminState.isAdmin ? 'Como administrador, o registro será publicado no Supabase.' : 'Este registro fica salvo apenas neste navegador; entre como administrador para publicar no Supabase.'}</p>
          <form className="measurement-form" onSubmit={handleAddMeasurement}>
            <label>Indicador<select value={measurementDraft.indicatorId} onChange={(event) => setMeasurementDraft((current) => ({ ...current, indicatorId: event.target.value }))}>
              {indicatorDefinitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.name}</option>)}
            </select></label>
            <label>Resultado<input type="number" min="0" step="any" required value={measurementDraft.value} onChange={(event) => setMeasurementDraft((current) => ({ ...current, value: event.target.value }))} /></label>
            <label>Meta para esta medição (opcional)<input type="number" min="0" step="any" value={measurementDraft.target} onChange={(event) => setMeasurementDraft((current) => ({ ...current, target: event.target.value }))} /></label>
            <label>Data da medição<input type="date" required value={measurementDraft.date} onChange={(event) => setMeasurementDraft((current) => ({ ...current, date: event.target.value }))} /></label>
            <label className="measurement-note">Nota ou método de coleta (opcional)<textarea rows={3} value={measurementDraft.note} onChange={(event) => setMeasurementDraft((current) => ({ ...current, note: event.target.value }))} /></label>
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setMeasurementDialogOpen(false)}>Cancelar</button><button className="primary-button" type="submit"><Check size={15} /> Salvar medição</button></div>
          </form>
        </section>
      </div>}
      {selectedRecipe && <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setSelectedRecipeId(null)
      }}>
        <section className="modal-card recipe-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-dialog-title" onKeyDown={(event) => {
          if (event.key === 'Escape') setSelectedRecipeId(null)
        }}>
          <button className="modal-close" type="button" autoFocus aria-label="Fechar ficha de receita" onClick={() => setSelectedRecipeId(null)}><X size={18} /></button>
          <span className="section-kicker">FICHA DE RECEITA · {selectedRecipe.time}</span><h2 id="recipe-dialog-title">{selectedRecipe.title}</h2>
          <p>{selectedRecipe.category}</p>
          <h3>Ingredientes</h3><ul>{selectedRecipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
          <h3>Preparo</h3><ol>{selectedRecipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="safety-note"><TriangleAlert size={16} /><span><strong>Segurança alimentar:</strong> {selectedRecipe.safety}</span></div>
          <p className="resource-caveat">Esta é uma ficha complementar criada para a dashboard; o manual original citado no relato ainda não foi disponibilizado.</p>
        </section>
      </div>}
      {adminDialogOpen && <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setAdminDialogOpen(false)
      }}>
        <section className="modal-card admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
          <button className="modal-close" type="button" autoFocus aria-label="Fechar acesso administrativo" onClick={() => setAdminDialogOpen(false)}><X size={18} /></button>
          <span className="section-kicker">ÁREA RESTRITA</span>
          <h2 id="admin-dialog-title">Acesso do responsável</h2>
          <p>Somente contas cadastradas previamente como administradoras podem alterar indicadores e metas. Não há cadastro público.</p>
          <form className="measurement-form" onSubmit={(event) => void handleAdminSignIn(event)}>
            <label className="measurement-note">E-mail<input type="email" autoComplete="username" required value={adminCredentials.email} onChange={(event) => setAdminCredentials((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="measurement-note">Senha<input type="password" autoComplete="current-password" required value={adminCredentials.password} onChange={(event) => setAdminCredentials((current) => ({ ...current, password: event.target.value }))} /></label>
            {adminState.error && <p className="auth-error" role="alert">{adminState.error}</p>}
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setAdminDialogOpen(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={adminBusy}>{adminBusy ? 'Verificando…' : 'Entrar'}</button></div>
          </form>
        </section>
      </div>}
      {menuOpen && <button className="mobile-backdrop" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}

export default App
