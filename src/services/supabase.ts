import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IndicatorDefinition, Measurement } from '../data/project'
import type { DashboardSnapshot } from './dashboardApi'
import { SUPABASE_CONFIGURED } from './backendConfig'

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Database = {
  public: {
    Tables: {
      dashboard_indicators: {
        Row: {
          id: string
          value: number
          target: number | null
          source: string
          is_published: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          value: number
          target?: number | null
          source: string
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['dashboard_indicators']['Insert']>
        Relationships: []
      }
      project_measurements: {
        Row: {
          id: string
          indicator_id: string
          value: number
          target: number | null
          measured_on: string
          is_published: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          indicator_id: string
          value: number
          target?: number | null
          measured_on: string
          is_published?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['project_measurements']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_project_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      admin_add_project_measurement: {
        Args: { p_indicator_id: string; p_value: number; p_target: number | null; p_measured_on: string }
        Returns: string
      }
      admin_update_indicator_targets: { Args: { p_targets: Json }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_CONFIGURED) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar o Supabase.')
  }

  if (!client) {
    client = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
      {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      },
    )
  }
  return client
}

export async function fetchSupabaseSnapshot(
  definitions: IndicatorDefinition[],
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  const supabase = getSupabaseClient()
  const [indicatorResult, measurementResult] = await Promise.all([
    supabase.from('dashboard_indicators')
      .select('id,value,target,updated_at')
      .eq('is_published', true)
      .abortSignal(signal ?? new AbortController().signal),
    supabase.from('project_measurements')
      .select('id,indicator_id,value,target,measured_on')
      .eq('is_published', true)
      .order('measured_on', { ascending: true })
      .abortSignal(signal ?? new AbortController().signal),
  ])

  if (indicatorResult.error) throw new Error(`Não foi possível carregar os indicadores do Supabase: ${indicatorResult.error.message}`)
  if (measurementResult.error) throw new Error(`Não foi possível carregar o histórico do Supabase: ${measurementResult.error.message}`)

  const knownIds = new Set(definitions.map(({ id }) => id))
  const indicators: DashboardSnapshot['indicators'] = {}
  const targets: DashboardSnapshot['targets'] = {}
  let updatedAt = ''

  for (const row of indicatorResult.data) {
    if (!knownIds.has(row.id)) continue
    if (!Number.isFinite(row.value) || row.value < 0 || Number.isNaN(Date.parse(row.updated_at))) {
      throw new Error(`O indicador "${row.id}" recebido do Supabase tem dados inválidos.`)
    }
    indicators[row.id] = row.value
    if (row.target !== null) {
      if (!Number.isFinite(row.target) || row.target < 0) {
        throw new Error(`A meta do indicador "${row.id}" recebida do Supabase é inválida.`)
      }
      targets[row.id] = row.target
    }
    if (!updatedAt || row.updated_at > updatedAt) updatedAt = row.updated_at
  }

  const measurements: Measurement[] = measurementResult.data.map((row) => {
    if (!knownIds.has(row.indicator_id) || !Number.isFinite(row.value) || row.value < 0 || Number.isNaN(Date.parse(row.measured_on))) {
      throw new Error(`A medição "${row.id}" recebida do Supabase tem dados inválidos.`)
    }
    if (row.target !== null && (!Number.isFinite(row.target) || row.target < 0)) {
      throw new Error(`A meta da medição "${row.id}" recebida do Supabase é inválida.`)
    }
    return {
      id: row.id,
      indicatorId: row.indicator_id,
      value: row.value,
      ...(row.target === null ? {} : { target: row.target }),
      date: row.measured_on,
    }
  })

  if (!updatedAt) throw new Error('O Supabase não retornou indicadores publicados.')
  return { updatedAt, indicators, targets, measurements }
}

export async function signInProjectAdmin(email: string, password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Não foi possível entrar: ${error.message}`)
}

export async function signOutProjectAdmin(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) throw new Error(`Não foi possível sair da sessão: ${error.message}`)
}

export async function getProjectAdminStatus(): Promise<{ email?: string; isAdmin: boolean }> {
  const { data: sessionResult, error: sessionError } = await getSupabaseClient().auth.getSession()
  if (sessionError) throw new Error(`Não foi possível verificar a sessão: ${sessionError.message}`)
  if (!sessionResult.session) return { isAdmin: false }

  const { data, error } = await getSupabaseClient().rpc('is_project_admin')
  if (error) throw new Error(`Não foi possível verificar a permissão administrativa: ${error.message}`)
  return { email: sessionResult.session.user.email, isAdmin: data }
}

export async function saveSupabaseTargets(targets: Record<string, number | null>): Promise<void> {
  const { error } = await getSupabaseClient().rpc('admin_update_indicator_targets', { p_targets: targets })
  if (error) throw new Error(`Não foi possível salvar as metas no Supabase: ${error.message}`)
}

export async function saveSupabaseMeasurement(measurement: Omit<Measurement, 'id' | 'note'>): Promise<void> {
  const { error } = await getSupabaseClient().rpc('admin_add_project_measurement', {
    p_indicator_id: measurement.indicatorId,
    p_value: measurement.value,
    p_target: measurement.target ?? null,
    p_measured_on: measurement.date,
  })
  if (error) throw new Error(`Não foi possível salvar a medição no Supabase: ${error.message}`)
}
