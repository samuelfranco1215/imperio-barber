// Store y gestión de datos de Imperio Barber con persistencia en Supabase y respaldo en localStorage
import { getSupabase, isSupabaseConfigured, TABLES } from "@/lib/supabase";

export interface BarberService {
  id: number;
  name: string;
  description: string;
  price: number; // en pesos colombianos (COP)
  duration: number; // en minutos
  active: boolean;
  category?: string;
}

export interface BarberReservation {
  id: string; // ej: IMP-4821
  clientName: string;
  phone: string;
  serviceId: number;
  serviceName?: string;
  price?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'transfer';
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
}

export interface DaySchedule {
  open: string;  // e.g. "08:00"
  close: string; // e.g. "20:00"
  isOpen: boolean;
}

export interface ScheduleConfig {
  mondayToSaturday: DaySchedule;
  sunday: DaySchedule;
  slotDurationMinutes: number;
  toleranceMinutes?: number; // minutos de tolerancia para que el cliente llegue (ej: 10 min)
}

export interface BlockedTimeRange {
  id: string; // ej: BLK-1024
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00" (24h)
  endTime: string; // "16:00" (24h)
  reason?: string; // ej: "Almuerzo", "Cita médica"
  createdAt: string;
}

export interface ServiceStatus {
  isPaused: boolean; // true = Modo "No hay servicio" (reservas cerradas)
  pauseMessage: string;
  updatedAt?: string;
}

export const DEFAULT_SERVICE_STATUS: ServiceStatus = {
  isPaused: false,
  pauseMessage: "Por el momento no hay servicio disponible. Intenta más tarde.",
};

// Datos de contacto de Imperio Barber
export const BUSINESS_INFO = {
  name: "Imperio Barber",
  phone: "320 3335586",
  phoneClean: "573203335586", // Con prefijo Colombia para WhatsApp
  phoneFormatted: "+57 320 3335586",
  phoneCall: "+573203335586",
  address: "Carrera 12 #8-56",
  city: "El Cerrito, Valle del Cauca",
  googleMapsQuery: "Carrera 12 #8-56, El Cerrito",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Carrera+12+%238-56,+El+Cerrito",
  googleMapsEmbedUrl: "https://maps.google.com/maps?q=Carrera%2012%20%238-56,%20El%20Cerrito&t=&z=16&ie=UTF8&iwloc=&output=embed",
  hoursTextMonSat: "Lunes a Sábado: 8:00 AM - 8:00 PM",
  hoursTextSun: "Domingos: 8:00 AM - 2:00 PM",
  transferAccount: "320 3335586",
  transferBanks: "Nequi, Daviplata o Bancolombia",
};

// Servicios por defecto iniciales
export const DEFAULT_SERVICES: BarberService[] = [
  {
    id: 1,
    name: "Corte Clásico",
    description: "Corte tradicional a tijera o máquina, perfilado de patillas y lavado refrescante.",
    price: 25000,
    duration: 30,
    active: true,
  },
  {
    id: 2,
    name: "Corte Fade / Degradado",
    description: "Corte degradado moderno (skin fade, mid fade o taper) con terminaciones milimétricas y styling.",
    price: 30000,
    duration: 40,
    active: true,
  },
  {
    id: 3,
    name: "Arreglo & Perfilado de Barba",
    description: "Arreglo y perfilado de barba.",
    price: 18000,
    duration: 25,
    active: true,
  },
  {
    id: 4,
    name: "Combo Imperio (Corte + Barba)",
    description: "Nuestra experiencia insignia. Corte degradado o clásico con arreglo de barba completo y toalla caliente.",
    price: 42000,
    duration: 60,
    active: true,
  },
  {
    id: 5,
    name: "Corte Niño",
    description: "Corte con paciencia y estilo para los consentidos de la casa (hasta los 12 años).",
    price: 20000,
    duration: 30,
    active: true,
  },
  {
    id: 7,
    name: "Perfilado de Cejas con Navaja",
    description: "Diseño y limpieza simétrica de cejas masculinas con navaja y gel calmante.",
    price: 8000,
    duration: 15,
    active: true,
  }
];

// Horario por defecto:
export const DEFAULT_SCHEDULE: ScheduleConfig = {
  mondayToSaturday: {
    open: "08:00",
    close: "20:00",
    isOpen: true,
  },
  sunday: {
    open: "08:00",
    close: "14:00",
    isOpen: true,
  },
  slotDurationMinutes: 30,
  toleranceMinutes: 10,
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_RESERVATIONS: BarberReservation[] = [
  {
    id: "IMP-1042",
    clientName: "Carlos Pérez",
    phone: "3001234567",
    serviceId: 2,
    serviceName: "Corte Fade / Degradado",
    price: 30000,
    date: "2026-10-12",
    time: "10:00",
    status: "completed",
    paymentMethod: "cash",
    notes: "Cliente frecuente",
    createdAt: "2026-10-12T10:00:00.000Z",
  },
  {
    id: "IMP-1043",
    clientName: "Andrés Gómez",
    phone: "3119876543",
    serviceId: 4,
    serviceName: "Combo Imperio (Corte + Barba)",
    price: 42000,
    date: "2026-10-12",
    time: "15:30",
    status: "pending",
    paymentMethod: "transfer",
    notes: "",
    createdAt: "2026-10-12T11:00:00.000Z",
  },
  {
    id: "IMP-1044",
    clientName: "Mateo Ramírez",
    phone: "3204567890",
    serviceId: 1,
    serviceName: "Corte Clásico",
    price: 25000,
    date: "2026-10-12",
    time: "17:00",
    status: "pending",
    paymentMethod: "cash",
    notes: "Traerá a su hijo después",
    createdAt: "2026-10-12T12:00:00.000Z",
  }
];

// Llaves de almacenamiento en localStorage (Caché local rápido)
const STORAGE_KEYS = {
  SERVICES: "imperio_barber_services_v3",
  RESERVATIONS: "imperio_barber_reservations_v2",
  SCHEDULE: "imperio_barber_schedule_v2",
  SERVICE_STATUS: "imperio_barber_service_status_v1",
  BLOCKED_SLOTS: "imperio_barber_blocked_slots_v1",
};

// Disparar evento para mantener componentes sincronizados en la misma pestaña
export function notifyStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("imperio_store_updated"));
  }
}

export function isSupabaseActive(): boolean {
  return isSupabaseConfigured();
}

// ==============================================================================
// MAPEOS DB <-> TYPESCRIPT
// ==============================================================================

function mapServiceFromDb(row: any): BarberService {
  return {
    id: Number(row.id),
    name: row.name || "",
    description: row.description || "",
    price: Number(row.price) || 0,
    duration: Number(row.duration) || 30,
    active: row.active ?? true,
    category: row.category || undefined,
  };
}

function mapServiceToDb(s: BarberService) {
  return {
    id: s.id,
    name: s.name,
    description: s.description || "",
    price: s.price,
    duration: s.duration,
    active: s.active,
    category: s.category || null,
  };
}

function mapReservationFromDb(row: any): BarberReservation {
  return {
    id: row.id,
    clientName: row.client_name || "",
    phone: row.phone || "",
    serviceId: Number(row.service_id) || 0,
    serviceName: row.service_name || "",
    price: Number(row.price) || 0,
    date: row.date || "",
    time: row.time || "",
    status: row.status || "pending",
    paymentMethod: row.payment_method || "cash",
    cancellationReason: row.cancellation_reason || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapReservationToDb(r: BarberReservation) {
  return {
    id: r.id,
    client_name: r.clientName,
    phone: r.phone,
    service_id: r.serviceId,
    service_name: r.serviceName || null,
    price: r.price || 0,
    date: r.date,
    time: r.time,
    status: r.status,
    payment_method: r.paymentMethod || "cash",
    cancellation_reason: r.cancellationReason || "",
    notes: r.notes || "",
    created_at: r.createdAt || new Date().toISOString(),
  };
}

function mapBlockedRangeFromDb(row: any): BlockedTimeRange {
  return {
    id: row.id,
    date: row.date || "",
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    reason: row.reason || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapBlockedRangeToDb(b: BlockedTimeRange) {
  return {
    id: b.id,
    date: b.date,
    start_time: b.startTime,
    end_time: b.endTime,
    reason: b.reason || "Horario reservado por el barbero",
    created_at: b.createdAt || new Date().toISOString(),
  };
}

// ==============================================================================
// 1. SERVICIOS
// ==============================================================================

export function getStoredServices(): BarberService[] {
  if (typeof window === "undefined") return DEFAULT_SERVICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
      return DEFAULT_SERVICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SERVICES;
  } catch (err) {
    console.error("Error al leer servicios locales:", err);
    return DEFAULT_SERVICES;
  }
}

export function setLocalServices(services: BarberService[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  } catch (err) {
    console.error("Error al persistir servicios locales:", err);
  }
}

export async function fetchStoredServices(): Promise<BarberService[]> {
  const local = getStoredServices();
  const client = getSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from(TABLES.SERVICIOS)
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.warn("Supabase servicios select error:", error.message);
      return local;
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapServiceFromDb);
      setLocalServices(mapped);
      return mapped;
    } else {
      // Si la tabla está vacía en Supabase, auto-sembrar los servicios por defecto
      const dbDefaults = DEFAULT_SERVICES.map(mapServiceToDb);
      await client.from(TABLES.SERVICIOS).insert(dbDefaults);
      setLocalServices(DEFAULT_SERVICES);
      return DEFAULT_SERVICES;
    }
  } catch (err) {
    console.error("Error al consultar servicios en Supabase:", err);
    return local;
  }
}

export async function saveStoredServices(services: BarberService[]): Promise<void> {
  setLocalServices(services);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    const dbPayload = services.map(mapServiceToDb);
    const { error } = await client
      .from(TABLES.SERVICIOS)
      .upsert(dbPayload, { onConflict: "id" });
    if (error) console.error("Error al guardar servicios en Supabase:", error);
  } catch (err) {
    console.error("Error al guardar servicios en Supabase:", err);
  }
}

export async function deleteStoredService(id: number): Promise<void> {
  const current = getStoredServices().filter(s => s.id !== id);
  setLocalServices(current);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(TABLES.SERVICIOS).delete().eq("id", id);
  } catch (err) {
    console.error("Error al eliminar servicio en Supabase:", err);
  }
}

// ==============================================================================
// 2. RESERVAS
// ==============================================================================

export function getStoredReservations(): BarberReservation[] {
  if (typeof window === "undefined") return DEFAULT_RESERVATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
      return DEFAULT_RESERVATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_RESERVATIONS;
  } catch (err) {
    console.error("Error al leer reservas locales:", err);
    return DEFAULT_RESERVATIONS;
  }
}

export function setLocalReservations(reservations: BarberReservation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  } catch (err) {
    console.error("Error al persistir reservas locales:", err);
  }
}

export async function fetchStoredReservations(): Promise<BarberReservation[]> {
  const local = getStoredReservations();
  const client = getSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from(TABLES.RESERVAS)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase reservas select error:", error.message);
      return local;
    }

    if (Array.isArray(data)) {
      const mapped = data.map(mapReservationFromDb);
      setLocalReservations(mapped);
      return mapped;
    }
    return local;
  } catch (err) {
    console.error("Error al consultar reservas en Supabase:", err);
    return local;
  }
}

export async function saveStoredReservations(reservations: BarberReservation[]): Promise<void> {
  setLocalReservations(reservations);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    if (reservations.length > 0) {
      const dbPayload = reservations.map(mapReservationToDb);
      await client.from(TABLES.RESERVAS).upsert(dbPayload, { onConflict: "id" });
    }
  } catch (err) {
    console.error("Error al guardar reservas en Supabase:", err);
  }
}

export async function addReservation(
  reservation: Omit<BarberReservation, "id" | "createdAt">
): Promise<BarberReservation> {
  const all = getStoredReservations();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newReservation: BarberReservation = {
    ...reservation,
    id: `IMP-${randomSuffix}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReservation, ...all];
  setLocalReservations(updated);
  notifyStoreUpdate();

  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client
        .from(TABLES.RESERVAS)
        .insert(mapReservationToDb(newReservation));
      if (error) {
        console.error("Error al insertar reserva en Supabase:", error);
      }
    } catch (err) {
      console.error("Error al conectar con Supabase para reserva:", err);
    }
  }

  return newReservation;
}

export async function updateReservationStatus(
  id: string, 
  newStatus: 'pending' | 'completed' | 'cancelled',
  cancellationReason?: string
): Promise<void> {
  const all = getStoredReservations();
  const updated = all.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status: newStatus,
        ...(cancellationReason !== undefined ? { cancellationReason } : {})
      };
    }
    return r;
  });
  setLocalReservations(updated);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    const updatePayload: Record<string, any> = { status: newStatus };
    if (cancellationReason !== undefined) {
      updatePayload.cancellation_reason = cancellationReason;
    }
    const { error } = await client
      .from(TABLES.RESERVAS)
      .update(updatePayload)
      .eq("id", id);
    if (error) {
      console.error("Error al actualizar estado en Supabase:", error);
    }
  } catch (err) {
    console.error("Error al conectar con Supabase para actualizar reserva:", err);
  }
}

export async function deleteStoredReservation(id: string): Promise<void> {
  const all = getStoredReservations().filter(r => r.id !== id);
  setLocalReservations(all);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(TABLES.RESERVAS).delete().eq("id", id);
  } catch (err) {
    console.error("Error al eliminar reserva en Supabase:", err);
  }
}

// ==============================================================================
// 3. HORARIOS BASE
// ==============================================================================

export function getStoredSchedule(): ScheduleConfig {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(DEFAULT_SCHEDULE));
      return DEFAULT_SCHEDULE;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.mondayToSaturday && parsed.sunday) return parsed;
    return DEFAULT_SCHEDULE;
  } catch (err) {
    console.error("Error al leer horarios:", err);
    return DEFAULT_SCHEDULE;
  }
}

export function setLocalSchedule(schedule: ScheduleConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (err) {
    console.error("Error al persistir horarios:", err);
  }
}

export async function fetchStoredSchedule(): Promise<ScheduleConfig> {
  const local = getStoredSchedule();
  const client = getSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from(TABLES.CONFIGURACION)
      .select("value")
      .eq("key", "schedule")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Supabase schedule select error:", error.message);
      return local;
    }

    if (data && data.value) {
      const scheduleVal = data.value as ScheduleConfig;
      setLocalSchedule(scheduleVal);
      return scheduleVal;
    } else {
      // Auto-sembrar configuración por defecto si no existe
      await client.from(TABLES.CONFIGURACION).insert({
        key: "schedule",
        value: DEFAULT_SCHEDULE,
      });
      return DEFAULT_SCHEDULE;
    }
  } catch (err) {
    console.error("Error al consultar horario en Supabase:", err);
    return local;
  }
}

export async function saveStoredSchedule(schedule: ScheduleConfig): Promise<void> {
  setLocalSchedule(schedule);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(TABLES.CONFIGURACION).upsert({
      key: "schedule",
      value: schedule,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  } catch (err) {
    console.error("Error al guardar horario en Supabase:", err);
  }
}

// ==============================================================================
// 4. ESTADO DEL SERVICIO (MODO "NO HAY SERVICIO" / PAUSAR RESERVAS)
// ==============================================================================

export function getStoredServiceStatus(): ServiceStatus {
  if (typeof window === "undefined") return DEFAULT_SERVICE_STATUS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICE_STATUS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICE_STATUS, JSON.stringify(DEFAULT_SERVICE_STATUS));
      return DEFAULT_SERVICE_STATUS;
    }
    const parsed = JSON.parse(raw);
    return {
      isPaused: Boolean(parsed.isPaused),
      pauseMessage: parsed.pauseMessage || DEFAULT_SERVICE_STATUS.pauseMessage,
      updatedAt: parsed.updatedAt,
    };
  } catch (err) {
    console.error("Error al leer estado del servicio:", err);
    return DEFAULT_SERVICE_STATUS;
  }
}

export function setLocalServiceStatus(status: ServiceStatus): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICE_STATUS, JSON.stringify(status));
  } catch (err) {
    console.error("Error al persistir estado de servicio:", err);
  }
}

export async function fetchStoredServiceStatus(): Promise<ServiceStatus> {
  const local = getStoredServiceStatus();
  const client = getSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from(TABLES.CONFIGURACION)
      .select("value")
      .eq("key", "service_status")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Supabase service_status select error:", error.message);
      return local;
    }

    if (data && data.value) {
      const statusVal = data.value as ServiceStatus;
      const clean: ServiceStatus = {
        isPaused: Boolean(statusVal.isPaused),
        pauseMessage: statusVal.pauseMessage || DEFAULT_SERVICE_STATUS.pauseMessage,
        updatedAt: statusVal.updatedAt,
      };
      setLocalServiceStatus(clean);
      return clean;
    } else {
      // Auto-sembrar status por defecto si no existe
      await client.from(TABLES.CONFIGURACION).insert({
        key: "service_status",
        value: DEFAULT_SERVICE_STATUS,
      });
      return DEFAULT_SERVICE_STATUS;
    }
  } catch (err) {
    console.error("Error al consultar estado de servicio en Supabase:", err);
    return local;
  }
}

export async function saveStoredServiceStatus(status: Partial<ServiceStatus>): Promise<void> {
  const current = getStoredServiceStatus();
  const updated: ServiceStatus = {
    ...current,
    ...status,
    updatedAt: new Date().toISOString(),
  };
  setLocalServiceStatus(updated);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(TABLES.CONFIGURACION).upsert({
      key: "service_status",
      value: updated,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  } catch (err) {
    console.error("Error al guardar estado de servicio en Supabase:", err);
  }
}

// ==============================================================================
// 5. HORARIOS BLOQUEADOS POR EL ADMIN
// ==============================================================================

export function getStoredBlockedRanges(): BlockedTimeRange[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error al leer horarios bloqueados:", err);
    return [];
  }
}

export function setLocalBlockedRanges(ranges: BlockedTimeRange[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(ranges));
  } catch (err) {
    console.error("Error al persistir horarios bloqueados:", err);
  }
}

export async function fetchStoredBlockedRanges(): Promise<BlockedTimeRange[]> {
  const local = getStoredBlockedRanges();
  const client = getSupabase();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from(TABLES.BLOQUEOS)
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.warn("Supabase bloqueos select error:", error.message);
      return local;
    }

    if (Array.isArray(data)) {
      const mapped = data.map(mapBlockedRangeFromDb);
      setLocalBlockedRanges(mapped);
      return mapped;
    }
    return local;
  } catch (err) {
    console.error("Error al consultar bloqueos en Supabase:", err);
    return local;
  }
}

export async function saveStoredBlockedRanges(ranges: BlockedTimeRange[]): Promise<void> {
  setLocalBlockedRanges(ranges);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    const dbPayload = ranges.map(mapBlockedRangeToDb);
    if (dbPayload.length > 0) {
      await client.from(TABLES.BLOQUEOS).upsert(dbPayload, { onConflict: "id" });
    }
  } catch (err) {
    console.error("Error al guardar bloqueos en Supabase:", err);
  }
}

export async function addBlockedRange(
  range: Omit<BlockedTimeRange, "id" | "createdAt">
): Promise<BlockedTimeRange> {
  const current = getStoredBlockedRanges();
  const newRange: BlockedTimeRange = {
    ...range,
    id: `BLK-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newRange];
  setLocalBlockedRanges(updated);
  notifyStoreUpdate();

  const client = getSupabase();
  if (client) {
    try {
      await client.from(TABLES.BLOQUEOS).insert(mapBlockedRangeToDb(newRange));
    } catch (err) {
      console.error("Error al guardar bloqueo en Supabase:", err);
    }
  }

  return newRange;
}

export async function removeBlockedRange(id: string): Promise<void> {
  const current = getStoredBlockedRanges().filter(r => r.id !== id);
  setLocalBlockedRanges(current);
  notifyStoreUpdate();

  const client = getSupabase();
  if (!client) return;

  try {
    await client.from(TABLES.BLOQUEOS).delete().eq("id", id);
  } catch (err) {
    console.error("Error al eliminar bloqueo en Supabase:", err);
  }
}

// ==============================================================================
// 6. SINCRONIZACIÓN Y TIEMPO REAL CON SUPABASE
// ==============================================================================

export async function syncAllFromSupabase(): Promise<{
  services: BarberService[];
  reservations: BarberReservation[];
  schedule: ScheduleConfig;
  serviceStatus: ServiceStatus;
  blockedRanges: BlockedTimeRange[];
}> {
  const [sRes, rRes, schRes, statRes, bRes] = await Promise.allSettled([
    fetchStoredServices(),
    fetchStoredReservations(),
    fetchStoredSchedule(),
    fetchStoredServiceStatus(),
    fetchStoredBlockedRanges(),
  ]);

  const services = sRes.status === "fulfilled" ? sRes.value : getStoredServices();
  const reservations = rRes.status === "fulfilled" ? rRes.value : getStoredReservations();
  const schedule = schRes.status === "fulfilled" ? schRes.value : getStoredSchedule();
  const serviceStatus = statRes.status === "fulfilled" ? statRes.value : getStoredServiceStatus();
  const blockedRanges = bRes.status === "fulfilled" ? bRes.value : getStoredBlockedRanges();

  notifyStoreUpdate();

  return { services, reservations, schedule, serviceStatus, blockedRanges };
}

let activeRealtimeChannel: any = null;

export function initSupabaseRealtime(): (() => void) {
  if (typeof window === "undefined") return () => {};
  const client = getSupabase();
  if (!client) return () => {};

  if (activeRealtimeChannel) {
    return () => {};
  }

  try {
    activeRealtimeChannel = client
      .channel("imperio_realtime_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.RESERVAS },
        async () => {
          await fetchStoredReservations();
          notifyStoreUpdate();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.SERVICIOS },
        async () => {
          await fetchStoredServices();
          notifyStoreUpdate();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.BLOQUEOS },
        async () => {
          await fetchStoredBlockedRanges();
          notifyStoreUpdate();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.CONFIGURACION },
        async () => {
          await Promise.allSettled([fetchStoredServiceStatus(), fetchStoredSchedule()]);
          notifyStoreUpdate();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("⚡ Supabase Realtime activo para Imperio Barber");
        }
      });
  } catch (err) {
    console.error("Error al inicializar Supabase Realtime:", err);
  }

  return () => {
    if (activeRealtimeChannel && client) {
      client.removeChannel(activeRealtimeChannel);
      activeRealtimeChannel = null;
    }
  };
}

// Auto-inicializar Realtime en el navegador si Supabase está configurado
if (typeof window !== "undefined") {
  if (isSupabaseConfigured()) {
    initSupabaseRealtime();
    // Primera carga en segundo plano
    syncAllFromSupabase().catch(() => {});
  }
}

// ==============================================================================
// 7. GENERADOR DE TURNOS DISPONIBLES
// ==============================================================================

export interface GeneratedSlot {
  time: string; // "08:00"
  time12: string; // "8:00 AM"
  isOccupied: boolean;
  isPast: boolean;
  isBlocked: boolean;
  blockReason?: string;
  isAvailable: boolean;
}

export function computeSlotsForDate(
  dateStr: string,
  reservations: BarberReservation[],
  schedule: ScheduleConfig,
  blockedRanges?: BlockedTimeRange[]
): { isOpen: boolean; slots: GeneratedSlot[]; reason?: string } {
  if (!dateStr) return { isOpen: false, slots: [] };

  const ranges = blockedRanges !== undefined ? blockedRanges : getStoredBlockedRanges();
  const dayBlocks = ranges.filter(r => r.date === dateStr);

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  const daySchedule = dayOfWeek === 0 ? schedule.sunday : schedule.mondayToSaturday;

  if (!daySchedule.isOpen) {
    return {
      isOpen: false,
      slots: [],
      reason: dayOfWeek === 0 ? "Los domingos la barbería permanece cerrada." : "La barbería permanece cerrada este día."
    };
  }

  const [openH, openM] = daySchedule.open.split(':').map(Number);
  const [closeH, closeM] = daySchedule.close.split(':').map(Number);

  const startMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;
  const step = schedule.slotDurationMinutes || 30;

  const activeBookings = reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
  const bookedTimes = new Set(activeBookings.map(r => r.time));

  let isToday = false;
  let currentTotalMinutes = 0;
  if (typeof window !== "undefined") {
    const todayStr = getTodayDateString();
    isToday = dateStr === todayStr;
    const now = new Date();
    currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  }

  const slots: GeneratedSlot[] = [];

  for (let m = startMinutes; m < endMinutes; m += step) {
    const slotH = Math.floor(m / 60);
    const slotM = m % 60;
    const timeStr = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;
    
    const hour12 = slotH % 12 === 0 ? 12 : slotH % 12;
    const ampm = slotH >= 12 ? 'PM' : 'AM';
    const time12 = `${hour12}:${String(slotM).padStart(2, '0')} ${ampm}`;

    const isOccupied = bookedTimes.has(timeStr);
    const isPast = isToday && m <= currentTotalMinutes;

    const matchingBlock = dayBlocks.find(b => timeStr >= b.startTime && timeStr < b.endTime);
    const isBlocked = !!matchingBlock;
    const blockReason = matchingBlock?.reason || "Horario reservado por el barbero";

    const isAvailable = !isOccupied && !isPast && !isBlocked;

    slots.push({
      time: timeStr,
      time12,
      isOccupied,
      isPast,
      isBlocked,
      blockReason: isBlocked ? blockReason : undefined,
      isAvailable,
    });
  }

  return {
    isOpen: true,
    slots,
  };
}

// ==============================================================================
// 8. FORMATEADORES
// ==============================================================================

export function formatPriceCOP(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return "$0 COP";
  return `$${amount.toLocaleString('es-CO')} COP`;
}

export function formatPriceSimpleCOP(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return "$0";
  return `$${amount.toLocaleString('es-CO')}`;
}

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day, 12, 0, 0);
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hour12}:${m} ${ampm}`;
}

// ==============================================================================
// 9. GENERADORES DE ENLACES DE WHATSAPP
// ==============================================================================

export function getWhatsAppReservationUrl(reservation: BarberReservation): string {
  const serviceText = reservation.serviceName || "Servicio de Barbería";
  const priceText = reservation.price ? formatPriceCOP(reservation.price) : "";
  const dateFormatted = formatDateSpanish(reservation.date);
  const timeFormatted = formatTime12h(reservation.time);
  const paymentText = reservation.paymentMethod === 'transfer'
    ? "📲 Transferencia (Nequi / Daviplata / Bancolombia)"
    : "💵 Efectivo (en la barbería)";

  const message = `¡Hola Imperio Barber! 💈 Acabo de reservar mi turno online:%0A%0A` +
    `🔖 *Código de Reserva:* ${reservation.id}%0A` +
    `✂️ *Servicio:* ${serviceText}%0A` +
    `📅 *Fecha:* ${dateFormatted} (${reservation.date})%0A` +
    `⏰ *Hora:* ${timeFormatted}%0A` +
    `👤 *Cliente:* ${reservation.clientName}%0A` +
    `📱 *WhatsApp:* +57 ${reservation.phone}%0A` +
    `💳 *Método de Pago:* ${paymentText}%0A` +
    (priceText ? `💵 *Total:* ${priceText}%0A` : "") +
    (reservation.notes ? `📝 *Notas:* ${reservation.notes}%0A` : "") +
    `%0A¡Por favor me confirman la cita! Muchas gracias.`;

  return `https://wa.me/${BUSINESS_INFO.phoneClean}?text=${message}`;
}

export function getGeneralWhatsAppUrl(): string {
  const message = `¡Hola Imperio Barber! 💈 Quisiera hacer una consulta o agendar una cita.`;
  return `https://wa.me/${BUSINESS_INFO.phoneClean}?text=${encodeURIComponent(message)}`;
}

export function getClientContactWhatsAppUrl(clientPhone: string, clientName: string, reservationCode: string): string {
  let cleaned = clientPhone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = `57${cleaned}`;
  }
  const message = `¡Hola ${clientName}! Te escribimos desde Imperio Barber sobre tu reserva *${reservationCode}*.`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function getCancellationMessageText(
  reservation: BarberReservation,
  reason: string
): string {
  const dateFormatted = formatDateSpanish(reservation.date);
  const timeFormatted = formatTime12h(reservation.time);
  const serviceText = reservation.serviceName || "Servicio de Barbería";
  const cleanReason = reason.trim() || "Inconveniente imprevisto";

  return `Hola ${reservation.clientName}, te escribimos de Imperio Barber.\n\n` +
    `Lamentamos informarte que tu reserva del ${dateFormatted} a las ${timeFormatted} para ${serviceText} fue cancelada.\n\n` +
    `Motivo: ${cleanReason}.\n\n` +
    `Si deseas, puedes reprogramarla fácilmente desde nuestra página o escribiéndonos. ¡Estamos atentos!`;
}

export function getCancellationWhatsAppUrl(
  reservation: BarberReservation,
  reason: string
): string {
  let cleaned = (reservation.phone || "").replace(/\D/g, "");
  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    cleaned = `57${cleaned}`;
  }
  const text = getCancellationMessageText(reservation, reason);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}
