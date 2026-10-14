import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lectura de variables de entorno públicas para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function getCleanSupabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');
}

/**
 * Comprueba si las variables de Supabase están configuradas con valores válidos
 */
export function isSupabaseConfigured(): boolean {
  const url = getCleanSupabaseUrl();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return false;
  if (
    url.includes('tu-proyecto') || 
    url.includes('TU_PROYECTO') ||
    key.includes('tu-anon-key') ||
    key.includes('TU_ANON_KEY')
  ) {
    return false;
  }
  return true;
}

// Cliente singleton de Supabase
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    const url = getCleanSupabaseUrl();
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

export const TABLES = {
  RESERVAS: 'reservas',
  SERVICIOS: 'servicios',
  BLOQUEOS: 'bloqueos_horario',
  CONFIGURACION: 'configuracion',
} as const;
