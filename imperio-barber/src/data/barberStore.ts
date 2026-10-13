// Store y gestión de datos de Imperio Barber con persistencia en localStorage

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
// Lunes a Sábado: 8:00 AM - 8:00 PM (08:00 - 20:00)
// Domingos: 8:00 AM - 2:00 PM (08:00 - 14:00)
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

// Generador de fecha hoy formateada YYYY-MM-DD
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

// Llaves de almacenamiento en localStorage
const STORAGE_KEYS = {
  SERVICES: "imperio_barber_services_v3",
  RESERVATIONS: "imperio_barber_reservations_v2",
  SCHEDULE: "imperio_barber_schedule_v2",
  SERVICE_STATUS: "imperio_barber_service_status_v1",
  BLOCKED_SLOTS: "imperio_barber_blocked_slots_v1",
};

// Disparar evento para mantener componentes sincronizados en la misma pestaña
function notifyStoreUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("imperio_store_updated"));
  }
}

// --- SERVICIOS ---
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
      // Filtrar Limpieza Facial y actualizar descripción de barba si es la versión vieja
      const cleaned: BarberService[] = parsed
        .filter((s: BarberService) => !s.name.toLowerCase().includes("limpieza facial") && s.id !== 6)
        .map((s: BarberService) => {
          if (s.id === 3 || s.name.toLowerCase().includes("barba")) {
            if (s.description.toLowerCase().includes("ritual completo")) {
              return { ...s, description: "Arreglo y perfilado de barba." };
            }
          }
          return s;
        });
      return cleaned;
    }
    return DEFAULT_SERVICES;
  } catch (err) {
    console.error("Error al leer servicios:", err);
    return DEFAULT_SERVICES;
  }
}

export function saveStoredServices(services: BarberService[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    notifyStoreUpdate();
  } catch (err) {
    console.error("Error al guardar servicios:", err);
  }
}

// --- RESERVAS ---
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
    console.error("Error al leer reservas:", err);
    return DEFAULT_RESERVATIONS;
  }
}

export function saveStoredReservations(reservations: BarberReservation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    notifyStoreUpdate();
  } catch (err) {
    console.error("Error al guardar reservas:", err);
  }
}

export function addReservation(reservation: Omit<BarberReservation, "id" | "createdAt">): BarberReservation {
  const all = getStoredReservations();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newReservation: BarberReservation = {
    ...reservation,
    id: `IMP-${randomSuffix}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReservation, ...all];
  saveStoredReservations(updated);
  return newReservation;
}

export function updateReservationStatus(
  id: string, 
  newStatus: 'pending' | 'completed' | 'cancelled',
  cancellationReason?: string
): void {
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
  saveStoredReservations(updated);
}

// --- HORARIOS ---
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

export function saveStoredSchedule(schedule: ScheduleConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    notifyStoreUpdate();
  } catch (err) {
    console.error("Error al guardar horarios:", err);
  }
}

// --- ESTADO DEL SERVICIO (MODO CERRAR RESERVAS / NO HAY SERVICIO) ---
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

export function saveStoredServiceStatus(status: Partial<ServiceStatus>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredServiceStatus();
    const updated: ServiceStatus = {
      ...current,
      ...status,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SERVICE_STATUS, JSON.stringify(updated));
    notifyStoreUpdate();
  } catch (err) {
    console.error("Error al guardar estado del servicio:", err);
  }
}

// --- HORARIOS BLOQUEADOS POR EL ADMIN ---
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

export function saveStoredBlockedRanges(ranges: BlockedTimeRange[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(ranges));
    notifyStoreUpdate();
  } catch (err) {
    console.error("Error al guardar horarios bloqueados:", err);
  }
}

export function addBlockedRange(range: Omit<BlockedTimeRange, "id" | "createdAt">): BlockedTimeRange {
  const current = getStoredBlockedRanges();
  const newRange: BlockedTimeRange = {
    ...range,
    id: `BLK-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
  };
  saveStoredBlockedRanges([...current, newRange]);
  return newRange;
}

export function removeBlockedRange(id: string): void {
  const current = getStoredBlockedRanges();
  saveStoredBlockedRanges(current.filter(r => r.id !== id));
}

// --- GENERADOR DE TURNOS DISPONIBLES ---
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

  // Parsear fecha
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

  // Parsear horas
  const [openH, openM] = daySchedule.open.split(':').map(Number);
  const [closeH, closeM] = daySchedule.close.split(':').map(Number);

  const startMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;
  const step = schedule.slotDurationMinutes || 30;

  // Reservas activas para esta fecha (excluyendo canceladas)
  const activeBookings = reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
  const bookedTimes = new Set(activeBookings.map(r => r.time));

  // Verificar si la fecha es hoy para bloquear turnos pasados en cliente
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
    
    // Formato 12 horas (ej. 8:30 AM, 1:00 PM)
    const hour12 = slotH % 12 === 0 ? 12 : slotH % 12;
    const ampm = slotH >= 12 ? 'PM' : 'AM';
    const time12 = `${hour12}:${String(slotM).padStart(2, '0')} ${ampm}`;

    const isOccupied = bookedTimes.has(timeStr);
    const isPast = isToday && m <= currentTotalMinutes;

    // Comprobar si cae en algún rango bloqueado por el administrador
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

// --- FORMATEADORES ---
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

// --- GENERADORES DE ENLACES DE WHATSAPP ---
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
  // Limpiar teléfono
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

