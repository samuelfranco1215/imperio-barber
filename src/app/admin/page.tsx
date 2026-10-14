"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { 
  BarberService, 
  BarberReservation, 
  ScheduleConfig,
  ServiceStatus,
  DEFAULT_SERVICE_STATUS,
  getStoredServices, 
  saveStoredServices,
  getStoredReservations, 
  saveStoredReservations,
  updateReservationStatus,
  getStoredSchedule, 
  saveStoredSchedule,
  getStoredServiceStatus,
  saveStoredServiceStatus,
  DEFAULT_SERVICES,
  DEFAULT_SCHEDULE,
  getTodayDateString,
  formatPriceCOP, 
  formatPriceSimpleCOP,
  formatDateSpanish, 
  formatTime12h, 
  getClientContactWhatsAppUrl,
  getCancellationWhatsAppUrl,
  getCancellationMessageText,
  BUSINESS_INFO,
  BlockedTimeRange,
  getStoredBlockedRanges,
  saveStoredBlockedRanges,
  addBlockedRange,
  removeBlockedRange,
  syncAllFromSupabase,
  deleteStoredService,
  deleteStoredReservation,
  isSupabaseActive
} from "@/data/barberStore";
import { gallery } from "@/data/mockData";
import { 
  LayoutDashboard, 
  Settings, 
  Clock, 
  Image as ImageIcon, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Phone, 
  MessageCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Filter, 
  Search, 
  Calendar as CalendarIcon, 
  Scissors, 
  Check, 
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Ban,
  Lock,
  Unlock,
  Menu,
  X,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle
} from "lucide-react";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"reservations" | "services" | "schedule" | "blocks" | "gallery">("reservations");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados del Store
  const [reservations, setReservations] = useState<BarberReservation[]>([]);
  const [services, setServices] = useState<BarberService[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(DEFAULT_SERVICE_STATUS);
  const [blockedRanges, setBlockedRanges] = useState<BlockedTimeRange[]>([]);

  // Estados para nuevo bloqueo de horas
  const [newBlockDate, setNewBlockDate] = useState<string>("");
  const [newBlockStart, setNewBlockStart] = useState<string>("14:00");
  const [newBlockEnd, setNewBlockEnd] = useState<string>("16:00");
  const [newBlockReason, setNewBlockReason] = useState<string>("Almuerzo / Diligencia personal");

  // Filtros de Reservas - inicializados en useEffect para compatibilidad con SSR
  const [todayStr, setTodayStr] = useState<string>("");
  const [tomorrowStr, setTomorrowStr] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>("");
  const [dateFilterMode, setDateFilterMode] = useState<"today" | "tomorrow" | "all" | "custom">("today");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para cancelar reserva con motivo y WhatsApp
  const [cancellingReservation, setCancellingReservation] = useState<BarberReservation | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("Inconveniente de fuerza mayor");

  // Notificación toast rápida
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar datos y sincronizar con Supabase
  const refreshData = async () => {
    // 1. Cargar caché inmediato
    setReservations(getStoredReservations());
    setServices(getStoredServices());
    setSchedule(getStoredSchedule());
    setServiceStatus(getStoredServiceStatus());
    setBlockedRanges(getStoredBlockedRanges());

    // 2. Traer la versión compartida de Supabase
    if (isSupabaseActive()) {
      setIsSyncing(true);
      try {
        const synced = await syncAllFromSupabase();
        if (synced) {
          setReservations(synced.reservations);
          setServices(synced.services);
          setSchedule(synced.schedule);
          setServiceStatus(synced.serviceStatus);
          setBlockedRanges(synced.blockedRanges);
        }
      } catch (err) {
        console.error("Error sincronizando admin con Supabase:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleToggleServiceStatus = async () => {
    const nextPaused = !serviceStatus.isPaused;
    setServiceStatus(prev => ({ ...prev, isPaused: nextPaused }));
    await saveStoredServiceStatus({ isPaused: nextPaused });
    if (nextPaused) {
      showToast("🔴 Modo 'No hay servicio' activado. Reservas pausadas.");
    } else {
      showToast("🟢 Servicio reanudado. Reservas abiertas normalmente.");
    }
  };

  useEffect(() => {
    const t = getTodayDateString();
    setTodayStr(t);
    setCustomDate(t);

    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setTomorrowStr(`${y}-${m}-${day}`);

    refreshData();
    window.addEventListener("imperio_store_updated", refreshData);
    window.addEventListener("storage", refreshData);
    return () => {
      window.removeEventListener("imperio_store_updated", refreshData);
      window.removeEventListener("storage", refreshData);
    };
  }, []);

  // Filtrado de reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      // Filtro de fecha
      if (dateFilterMode === "today" && res.date !== todayStr) return false;
      if (dateFilterMode === "tomorrow" && res.date !== tomorrowStr) return false;
      if (dateFilterMode === "custom" && customDate && res.date !== customDate) return false;

      // Filtro de estado
      if (statusFilter !== "all" && res.status !== statusFilter) return false;

      // Filtro de búsqueda (nombre, teléfono o código)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = res.clientName.toLowerCase().includes(q);
        const matchesPhone = res.phone.includes(q);
        const matchesCode = res.id.toLowerCase().includes(q);
        const matchesService = (res.serviceName || "").toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCode && !matchesService) return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordenar por fecha y luego por hora
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [reservations, dateFilterMode, customDate, todayStr, tomorrowStr, statusFilter, searchQuery]);

  // Estadísticas simples solicitadas por el admin:
  // - Reservas de hoy
  // - Completadas
  // - Canceladas
  const stats = useMemo(() => {
    const todayTotal = reservations.filter(r => r.date === todayStr).length;
    const todayPending = reservations.filter(r => r.date === todayStr && r.status === "pending").length;
    
    const list = filteredReservations;
    const completedTotal = list.filter(r => r.status === "completed").length;
    const cancelledTotal = list.filter(r => r.status === "cancelled").length;
    const pendingTotal = list.filter(r => r.status === "pending").length;
    const revenue = list
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + (r.price || 0), 0);

    return { 
      todayTotal, 
      todayPending,
      completedTotal, 
      cancelledTotal, 
      pendingTotal,
      revenue,
      totalFiltered: list.length
    };
  }, [reservations, filteredReservations, todayStr]);

  // Verificar si una reserva de hoy superó el tiempo de tolerancia
  const checkToleranceOverdue = (res: BarberReservation): { overdue: boolean; lateMinutes: number } => {
    if (res.status !== 'pending' || res.date !== todayStr) {
      return { overdue: false, lateMinutes: 0 };
    }
    try {
      const parts = res.time.split(':');
      if (parts.length < 2) return { overdue: false, lateMinutes: 0 };
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const turnoMins = h * 60 + m;
      const tolerance = schedule.toleranceMinutes || 10;
      const diff = currentMins - turnoMins;
      if (diff > tolerance) {
        return { overdue: true, lateMinutes: diff };
      }
    } catch {}
    return { overdue: false, lateMinutes: 0 };
  };

  const handleLiberateTurnSlot = (res: BarberReservation, lateMinutes: number) => {
    setCancellingReservation(res);
    const tol = schedule.toleranceMinutes || 10;
    setCancellationReason(`Tiempo de tolerancia (${tol} min) superado. El cliente no asistió al turno (+${lateMinutes} min de retraso).`);
  };

  // Agregar y eliminar bloqueos de horarios específicos
  const handleAddBlockedRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateToUse = newBlockDate || todayStr;
    if (!dateToUse) {
      alert("Por favor selecciona una fecha.");
      return;
    }
    if (!newBlockStart || !newBlockEnd) {
      alert("Por favor selecciona las horas de inicio y fin.");
      return;
    }
    if (newBlockStart >= newBlockEnd) {
      alert("La hora de inicio debe ser anterior a la hora de fin (ejemplo: 14:00 a 16:00).");
      return;
    }

    await addBlockedRange({
      date: dateToUse,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      reason: newBlockReason.trim() || "Horario reservado por el barbero",
    });

    showToast(`Horario bloqueado: ${formatTime12h(newBlockStart)} a ${formatTime12h(newBlockEnd)}.`);
    setBlockedRanges(getStoredBlockedRanges());
  };

  const handleRemoveBlockedRange = async (id: string) => {
    if (confirm("¿Deseas desbloquear este horario para que los clientes puedan volver a reservar?")) {
      await removeBlockedRange(id);
      setBlockedRanges(getStoredBlockedRanges());
      showToast("Horario desbloqueado exitosamente.");
    }
  };

  // Actualizar estado de una reserva directamente (atendida o pendiente)
  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    await updateReservationStatus(id, newStatus);
    const statusLabel = newStatus === 'completed' ? 'atendida' : newStatus === 'cancelled' ? 'cancelada' : 'pendiente';
    showToast(`Reserva ${id} marcada como ${statusLabel}.`);
  };

  // Abrir ventana para cancelar y escribir motivo
  const handleStartCancellation = (res: BarberReservation) => {
    setCancellingReservation(res);
    setCancellationReason("Inconveniente de fuerza mayor");
  };

  // Confirmar cancelación, persistir motivo y abrir WhatsApp automáticamente
  const handleConfirmCancellation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cancellingReservation) return;

    const reason = cancellationReason.trim() || "Inconveniente de fuerza mayor";
    await updateReservationStatus(cancellingReservation.id, "cancelled", reason);

    const whatsappUrl = getCancellationWhatsAppUrl(cancellingReservation, reason);
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    showToast(`Reserva ${cancellingReservation.id} cancelada. Abriendo WhatsApp con el cliente...`);
    setCancellingReservation(null);
    setCancellationReason("");
  };

  // Reenviar mensaje de cancelación por WhatsApp
  const handleResendCancellationWhatsApp = (res: BarberReservation) => {
    const reason = res.cancellationReason || "Inconveniente de fuerza mayor";
    const whatsappUrl = getCancellationWhatsAppUrl(res, reason);
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    showToast(`Abriendo WhatsApp con motivo para ${res.clientName}...`);
  };

  // Eliminar una reserva
  const handleDeleteReservation = async (id: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la reserva ${id}?`)) {
      await deleteStoredReservation(id);
      setReservations(getStoredReservations());
      showToast(`Reserva ${id} eliminada.`);
    }
  };

  // -------------------------------------------------------------
  // ESTADOS Y ACCIONES PARA SERVICIOS
  // -------------------------------------------------------------
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    description: "",
    price: 25000,
    duration: 30,
    active: true,
  });

  const handleStartEditService = (service: BarberService) => {
    setEditingService(service);
    setIsCreatingService(false);
    setServiceFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      active: service.active,
    });
  };

  const handleStartCreateService = () => {
    setIsCreatingService(true);
    setEditingService(null);
    setServiceFormData({
      name: "",
      description: "",
      price: 20000,
      duration: 30,
      active: true,
    });
  };

  const handleSaveServiceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name.trim()) {
      alert("Ingresa un nombre para el servicio.");
      return;
    }

    if (editingService) {
      // Actualizar existente
      const updated = services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...serviceFormData, name: serviceFormData.name.trim(), description: serviceFormData.description.trim() } 
          : s
      );
      setServices(updated);
      await saveStoredServices(updated);
      setEditingService(null);
      showToast(`Servicio "${serviceFormData.name}" actualizado.`);
    } else if (isCreatingService) {
      // Crear nuevo
      const newId = Math.max(...services.map(s => s.id), 0) + 1;
      const newService: BarberService = {
        id: newId,
        name: serviceFormData.name.trim(),
        description: serviceFormData.description.trim(),
        price: Number(serviceFormData.price) || 20000,
        duration: Number(serviceFormData.duration) || 30,
        active: serviceFormData.active,
      };
      const updated = [...services, newService];
      setServices(updated);
      await saveStoredServices(updated);
      setIsCreatingService(false);
      showToast(`Servicio "${newService.name}" creado con éxito.`);
    }
  };

  const handleToggleServiceActive = async (id: number) => {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setServices(updated);
    await saveStoredServices(updated);
    showToast("Estado del servicio actualizado.");
  };

  const handleDeleteService = async (id: number, name: string) => {
    if (confirm(`¿Deseas eliminar el servicio "${name}"?`)) {
      await deleteStoredService(id);
      setServices(getStoredServices());
      showToast(`Servicio "${name}" eliminado.`);
    }
  };

  const handleResetServices = async () => {
    if (confirm("¿Restablecer todos los servicios a la configuración original de Imperio Barber?")) {
      await saveStoredServices(DEFAULT_SERVICES);
      setServices(DEFAULT_SERVICES);
      showToast("Servicios restablecidos a los valores por defecto.");
    }
  };

  // -------------------------------------------------------------
  // ESTADOS Y ACCIONES PARA HORARIOS
  // -------------------------------------------------------------
  const [scheduleForm, setScheduleForm] = useState<ScheduleConfig>(schedule);

  useEffect(() => {
    setScheduleForm(schedule);
  }, [schedule]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoredSchedule(scheduleForm);
    setSchedule(scheduleForm);
    showToast("¡Horarios de atención guardados exitosamente!");
  };

  const handleResetSchedule = async () => {
    if (confirm("¿Restablecer horarios por defecto (Lunes-Sábado 8am-8pm, Domingos 8am-2pm)?")) {
      await saveStoredSchedule(DEFAULT_SCHEDULE);
      setSchedule(DEFAULT_SCHEDULE);
      setScheduleForm(DEFAULT_SCHEDULE);
      showToast("Horarios restablecidos por defecto.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col md:flex-row selection:bg-amber-500/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-zinc-950 px-5 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-zinc-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra superior móvil */}
      <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-30 sticky top-0">
        <div>
          <span className="font-extrabold text-amber-500 tracking-wider text-lg">{BUSINESS_INFO.name.toUpperCase()}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin</span>
            {isSupabaseActive() ? (
              <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                🟢 Supabase
              </span>
            ) : (
              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                🟡 Local
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            title="Sincronizar"
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar de Navegación */}
      <aside className={`
        ${mobileMenuOpen ? 'flex' : 'hidden'} md:flex
        w-full md:w-68 bg-zinc-900/95 md:bg-zinc-900 border-r border-zinc-800 p-6 flex-col z-20 shrink-0
      `}>
        <div className="hidden md:block mb-8">
          <Link href="/" className="inline-block group">
            <h2 className="text-xl font-black tracking-wider text-amber-500 group-hover:text-amber-400 transition-colors">
              {BUSINESS_INFO.name.toUpperCase()}
            </h2>
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-0.5">
              Panel Administrador
            </p>
          </Link>

          {/* Indicador de estado del servicio en la barra lateral */}
          <div className="mt-3 space-y-2">
            {serviceStatus.isPaused ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>No hay servicio (Cerrado)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Servicio Activo</span>
              </div>
            )}

            {/* Estado de Supabase */}
            <div className="flex items-center justify-between pt-1">
              {isSupabaseActive() ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>Supabase Compartido</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium" title="Agrega tus credenciales en .env.local">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Modo Local (.env.local)</span>
                </div>
              )}
              <button
                onClick={() => refreshData()}
                title="Sincronizar ahora"
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-400" : ""}`} />
              </button>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          <button 
            onClick={() => { setActiveTab("reservations"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-semibold ${
              activeTab === "reservations" 
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold" 
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" /> 
            <span>Reservas</span>
            {reservations.filter(r => r.status === 'pending').length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "reservations" ? "bg-zinc-950 text-amber-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {reservations.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab("services"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-semibold ${
              activeTab === "services" 
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold" 
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <Scissors className="w-5 h-5" /> 
            <span>Servicios & Precios</span>
          </button>

          <button 
            onClick={() => { setActiveTab("schedule"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-semibold ${
              activeTab === "schedule" 
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold" 
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <Clock className="w-5 h-5" /> 
            <span>Horarios de Atención</span>
          </button>

          <button 
            onClick={() => { setActiveTab("blocks"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-semibold ${
              activeTab === "blocks" 
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold" 
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <Ban className="w-5 h-5" /> 
            <span>Bloquear Horas</span>
            {blockedRanges.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "blocks" ? "bg-zinc-950 text-amber-400" : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {blockedRanges.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab("gallery"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm font-semibold ${
              activeTab === "gallery" 
                ? "bg-amber-500 text-zinc-950 shadow-md font-bold" 
                : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <ImageIcon className="w-5 h-5" /> 
            <span>Galería</span>
          </button>
        </nav>
        
        <div className="pt-6 border-t border-zinc-800 space-y-2">
          <Link 
            href="/book" 
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-zinc-800/60 rounded-xl transition-colors font-medium"
          >
            <CalendarIcon className="w-4 h-4" /> Probar vista de cliente
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" /> Volver a la página web
          </Link>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-h-screen overflow-y-auto">
        
        {/* BANNER DE CONTROL: CERRAR RESERVAS / NO HAY SERVICIO */}
        <div className={`mb-8 p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
          serviceStatus.isPaused 
            ? "bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] ring-1 ring-red-500/30"
            : "bg-zinc-900/90 border-zinc-800 shadow-lg"
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl shrink-0 transition-colors ${
                serviceStatus.isPaused 
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {serviceStatus.isPaused ? (
                  <PowerOff className="w-7 h-7 text-red-400 animate-pulse" />
                ) : (
                  <Power className="w-7 h-7 text-emerald-400" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] uppercase font-black tracking-wider px-3 py-0.5 rounded-full ${
                    serviceStatus.isPaused
                      ? "bg-red-500 text-zinc-950"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {serviceStatus.isPaused ? "● MODO NO HAY SERVICIO ACTIVO" : "● RESERVAS ONLINE ABIERTAS"}
                  </span>
                  {serviceStatus.isPaused && (
                    <span className="text-xs text-red-300 font-semibold bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-800/40">
                      Clientes bloqueados
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-white text-lg sm:text-xl">
                  {serviceStatus.isPaused 
                    ? "El barbero no va a trabajar hoy (Reservas cerradas)" 
                    : "Atención normal activa (Clientes pueden reservar)"}
                </h3>
                
                <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {serviceStatus.isPaused 
                    ? "Los clientes no pueden agendar turnos y en toda la página ven el aviso: «Por el momento no hay servicio disponible. Intenta más tarde.»"
                    : "Usa este botón si hoy no vas a trabajar, por imprevistos o descanso, para pausar las citas online de inmediato."}
                </p>
              </div>
            </div>

            {/* BOTÓN O INTERRUPTOR CLARO */}
            <div className="shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={handleToggleServiceStatus}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all duration-200 shadow-xl ${
                  serviceStatus.isPaused
                    ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/25 hover:scale-102"
                    : "bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/40 hover:scale-102"
                }`}
              >
                {serviceStatus.isPaused ? (
                  <>
                    <Power className="w-5 h-5 stroke-[2.5]" />
                    <span>Reanudar Servicio / Abrir Reservas</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="w-5 h-5 stroke-[2.5]" />
                    <span>Cerrar Reservas / No Hay Servicio Hoy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cabecera del tab */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {activeTab === "reservations" && "Gestión de Reservas"}
              {activeTab === "services" && "Servicios y Precios (COP)"}
              {activeTab === "schedule" && "Horarios de Atención"}
              {activeTab === "blocks" && "Bloqueo de Horarios Específicos"}
              {activeTab === "gallery" && "Galería de Trabajos"}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              {activeTab === "reservations" && "Supervisa turnos, atiende clientes y cancela citas en tiempo real."}
              {activeTab === "services" && "Añade nuevos servicios, ajusta precios en pesos y tiempos estimados."}
              {activeTab === "schedule" && "Modifica los rangos de atención y tiempo de tolerancia de llegada."}
              {activeTab === "blocks" && "Bloquea rangos de horas concretas (ej. 2:00 PM a 4:00 PM) para diligencias o almuerzo."}
              {activeTab === "gallery" && "Revisa las imágenes destacadas de la barbería."}
            </p>
          </div>

          {activeTab === "services" && !isCreatingService && !editingService && (
            <button
              onClick={handleStartCreateService}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Servicio</span>
            </button>
          )}
        </header>

        {/* =========================================================
            TAB 1: GESTIÓN DE RESERVAS
           ========================================================= */}
        {activeTab === "reservations" && (
          <div className="space-y-6">
            
            {/* Tarjetas de Estadísticas Simples */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Reservas de Hoy</span>
                  <CalendarIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{stats.todayTotal}</div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {stats.todayPending} pendientes por atender
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Completadas</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.completedTotal}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Clientes atendidos</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-red-500/40 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Canceladas</span>
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-400">{stats.cancelledTotal}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Citas anuladas</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Ingresos Atendidos</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {formatPriceSimpleCOP(stats.revenue)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Total facturado
                </div>
              </div>
            </div>

            {/* Filtros de Fecha, Estado y Búsqueda */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                
                {/* Selector de Filtro de Fecha */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Fecha:</span>
                  <button
                    onClick={() => setDateFilterMode("today")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dateFilterMode === "today" 
                        ? "bg-amber-500 text-zinc-950" 
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setDateFilterMode("tomorrow")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dateFilterMode === "tomorrow" 
                        ? "bg-amber-500 text-zinc-950" 
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    Mañana
                  </button>
                  <button
                    onClick={() => setDateFilterMode("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dateFilterMode === "all" 
                        ? "bg-amber-500 text-zinc-950" 
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    Todas las fechas
                  </button>

                  <div className="flex items-center gap-1.5 ml-1">
                    <input 
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value);
                        setDateFilterMode("custom");
                      }}
                      className={`bg-zinc-950 border px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none ${
                        dateFilterMode === "custom" ? "border-amber-500 ring-1 ring-amber-500" : "border-zinc-700"
                      }`}
                    />
                  </div>
                </div>

                {/* Filtro de Estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Estado:</span>
                  {(["all", "pending", "completed", "cancelled"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        statusFilter === st 
                          ? "bg-zinc-100 text-zinc-950 font-bold" 
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {st === "all" ? "Todos" : st === "pending" ? "Pendientes" : st === "completed" ? "Atendidas" : "Canceladas"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador en tiempo real */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, WhatsApp (ej. 320...), servicio o código (#IMP)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Listado / Tabla de Reservas */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
              
              {/* Vista Móvil: Tarjetas */}
              <div className="md:hidden divide-y divide-zinc-800">
                {filteredReservations.map(res => {
                  const { overdue, lateMinutes } = checkToleranceOverdue(res);
                  return (
                  <div key={res.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-amber-400 text-sm">{res.id}</span>
                          <span className="text-xs text-zinc-400 font-medium">{res.date}</span>
                        </div>
                        <h4 className="font-bold text-white text-base mt-0.5">{res.clientName}</h4>
                      </div>

                      {/* Badge de estado */}
                      <div>
                        {res.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pendiente
                          </span>
                        )}
                        {res.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Atendida
                          </span>
                        )}
                        {res.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alerta de tolerancia superada */}
                    {overdue && (
                      <div className="bg-amber-500/15 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2">
                        <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Tolerancia superada (+{lateMinutes}m tarde)</span>
                        </div>
                        <button
                          onClick={() => handleLiberateTurnSlot(res, lateMinutes)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-lg shadow shrink-0 flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" /> Liberar Turno
                        </button>
                      </div>
                    )}

                    <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Servicio:</span>
                        <span className="font-medium text-white">{res.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Hora:</span>
                        <span className="font-bold text-amber-400">{formatTime12h(res.time)} ({res.time})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Precio & Pago:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-400">{formatPriceCOP(res.price || 0)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            res.paymentMethod === 'transfer'
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {res.paymentMethod === 'transfer' ? "📲 Transf." : "💵 Efectivo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Teléfono:</span>
                        <span className="text-zinc-300 font-medium">+57 {res.phone}</span>
                      </div>
                      {res.notes && (
                        <div className="pt-1 text-zinc-400 italic">
                          "{res.notes}"
                        </div>
                      )}
                      {res.status === "cancelled" && res.cancellationReason && (
                        <div className="pt-1.5 pb-0.5 text-xs text-red-300 bg-red-950/40 p-2.5 rounded-xl border border-red-900/40">
                          <span className="font-bold text-red-400">Motivo cancelación:</span> {res.cancellationReason}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción móvil */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {/* WhatsApp al cliente */}
                      <a
                        href={getClientContactWhatsAppUrl(res.phone, res.clientName, res.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-2 px-3 rounded-xl text-xs font-bold transition-all border border-emerald-500/30"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Llamar al cliente */}
                      <a
                        href={`tel:+57${res.phone}`}
                        className="flex items-center justify-center gap-1 bg-zinc-800 text-zinc-300 py-2 px-3 rounded-xl text-xs font-bold transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* Cambiar Estado */}
                      {res.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(res.id, "completed")}
                            className="bg-emerald-500 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Atendida
                          </button>
                          <button
                            onClick={() => handleStartCancellation(res)}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </>
                      )}

                      {res.status === "cancelled" && (
                        <>
                          <button
                            onClick={() => handleResendCancellationWhatsApp(res)}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-1.5"
                            title="Reenviar motivo por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Reenviar WhatsApp
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(res.id, "pending")}
                            className="bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"
                            title="Restablecer a pendiente"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                          </button>
                        </>
                      )}

                      {res.status === "completed" && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, "pending")}
                          className="bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"
                          title="Restablecer a pendiente"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Vista Desktop: Tabla completa */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-4">Código / Hora</th>
                      <th className="p-4">Cliente & WhatsApp</th>
                      <th className="p-4">Servicio & Valor</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {filteredReservations.map(res => {
                      const { overdue, lateMinutes } = checkToleranceOverdue(res);
                      return (
                      <tr key={res.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-extrabold text-amber-400 text-sm">{res.id}</div>
                          <div className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500"/> {formatTime12h(res.time)}
                          </div>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold mt-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" /> +{lateMinutes}m tarde
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-white">{res.clientName}</div>
                          <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" /> +57 {res.phone}
                          </div>
                          {res.notes && (
                            <div className="text-[11px] text-zinc-500 italic mt-1 max-w-[200px] truncate" title={res.notes}>
                              Nota: {res.notes}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-zinc-200">{res.serviceName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-amber-400">
                              {formatPriceCOP(res.price || 0)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              res.paymentMethod === 'transfer'
                                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {res.paymentMethod === 'transfer' ? "📲 Transf." : "💵 Efectivo"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-zinc-300 capitalize">
                          {res.date === todayStr ? (
                            <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Hoy</span>
                          ) : res.date === tomorrowStr ? (
                            <span className="font-medium text-zinc-300">Mañana</span>
                          ) : (
                            formatDateSpanish(res.date)
                          )}
                          <div className="text-zinc-500 text-[11px] mt-0.5">{res.date}</div>
                        </td>

                        <td className="p-4">
                          {res.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Pendiente
                            </span>
                          )}
                          {res.status === "completed" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Atendida
                            </span>
                          )}
                          {res.status === "cancelled" && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5" />
                                Cancelada
                              </span>
                              {res.cancellationReason && (
                                <div className="text-[11px] text-zinc-400 mt-1 max-w-[180px] truncate" title={`Motivo: ${res.cancellationReason}`}>
                                  <span className="text-red-400 font-semibold">Motivo:</span> {res.cancellationReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Liberar turno si superó la tolerancia */}
                            {res.status === "pending" && overdue && (
                              <button 
                                onClick={() => handleLiberateTurnSlot(res, lateMinutes)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors flex items-center gap-1 shadow"
                                title="Liberar turno por tolerancia superada"
                              >
                                <Clock className="w-3.5 h-3.5" /> Liberar
                              </button>
                            )}

                            {/* Contactar por WhatsApp */}
                            <a 
                              href={getClientContactWhatsAppUrl(res.phone, res.clientName, res.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                              title="Escribir por WhatsApp al cliente"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            {/* Contactar por llamada */}
                            <a 
                              href={`tel:+57${res.phone}`}
                              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                              title="Llamar al cliente"
                            >
                              <Phone className="w-4 h-4" />
                            </a>

                            {/* Botón Marcar Atendida */}
                            {res.status !== "completed" && (
                              <button 
                                onClick={() => handleUpdateStatus(res.id, "completed")}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                                title="Marcar como atendida"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Botón Cancelar con Motivo y WhatsApp */}
                            {res.status !== "cancelled" && (
                              <button 
                                onClick={() => handleStartCancellation(res)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                title="Cancelar reserva y notificar motivo por WhatsApp"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reenviar motivo por WhatsApp si está cancelada */}
                            {res.status === "cancelled" && (
                              <button 
                                onClick={() => handleResendCancellationWhatsApp(res)}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                                title="Reenviar mensaje de cancelación por WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reactivar a pendiente */}
                            {res.status !== "pending" && (
                              <button 
                                onClick={() => handleUpdateStatus(res.id, "pending")}
                                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                                title="Reactivar a pendiente"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Eliminar reserva */}
                            <button
                              onClick={() => handleDeleteReservation(res.id)}
                              className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredReservations.length === 0 && (
                <div className="p-12 text-center text-zinc-500 space-y-2">
                  <CalendarIcon className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="text-base font-semibold text-zinc-300">No se encontraron reservas con estos filtros.</p>
                  <p className="text-xs text-zinc-500">Prueba cambiando la fecha o limpiando el texto de búsqueda.</p>
                  <button 
                    onClick={() => { setDateFilterMode("all"); setStatusFilter("all"); setSearchQuery(""); }}
                    className="mt-3 text-xs text-amber-500 hover:underline"
                  >
                    Ver todas las reservas
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 2: SERVICIOS Y PRECIOS
           ========================================================= */}
        {activeTab === "services" && (
          <div className="space-y-6">

            {/* Formulario de Crear o Editar Servicio */}
            {(isCreatingService || editingService) && (
              <div className="bg-zinc-900 border-2 border-amber-500/40 p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {isCreatingService ? "Agregar Nuevo Servicio" : `Editar Servicio: ${editingService?.name}`}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Los cambios se actualizarán al instante en la página web y en el sistema de reservas.
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditingService(null); setIsCreatingService(false); }}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveServiceForm} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                        Nombre del Servicio *
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ej. Corte Fade + Diseño"
                        value={serviceFormData.name}
                        onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                        Precio en Pesos Colombianos (COP) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold">$</span>
                        <input 
                          required
                          type="number" 
                          min="0"
                          step="1000"
                          placeholder="25000"
                          value={serviceFormData.price}
                          onChange={(e) => setServiceFormData({...serviceFormData, price: parseInt(e.target.value, 10) || 0})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-8 pr-4 text-white text-sm font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Vista previa: {formatPriceCOP(serviceFormData.price)}
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                        Tiempo Estimado (Minutos) *
                      </label>
                      <input 
                        required
                        type="number" 
                        min="5"
                        max="240"
                        step="5"
                        placeholder="30"
                        value={serviceFormData.duration}
                        onChange={(e) => setServiceFormData({...serviceFormData, duration: parseInt(e.target.value, 10) || 30})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                        Estado del Servicio
                      </label>
                      <div className="flex items-center gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input 
                            type="checkbox"
                            checked={serviceFormData.active}
                            onChange={(e) => setServiceFormData({...serviceFormData, active: e.target.checked})}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-zinc-950 border-zinc-700"
                          />
                          <span className={serviceFormData.active ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                            {serviceFormData.active ? "Visible para reservar" : "Desactivado / Oculto"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Descripción Detallada
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Describe lo que incluye el servicio (lavado, toalla caliente, productos, etc.)."
                      value={serviceFormData.description}
                      onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => { setEditingService(null); setIsCreatingService(false); }}
                      className="px-5 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isCreatingService ? "Crear Servicio" : "Guardar Cambios"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Listado de Servicios Actuales */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Catálogo de Servicios Activos</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Total: {services.length} servicios registrados ({services.filter(s => s.active !== false).length} activos).
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleResetServices}
                    className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    title="Restablecer a valores por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Originales</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {services.map(s => (
                  <div 
                    key={s.id} 
                    className={`p-5 rounded-2xl border transition-all ${
                      s.active !== false 
                        ? "bg-zinc-950/70 border-zinc-800 hover:border-amber-500/40" 
                        : "bg-zinc-950/30 border-zinc-900 opacity-60"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h4 className="font-bold text-base text-white flex items-center gap-2">
                          {s.name}
                          {s.active === false && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                              Inactivo
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{s.duration} min</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
                          {formatPriceCOP(s.price)}
                        </span>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleServiceActive(s.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          s.active !== false 
                            ? "text-zinc-400 hover:text-zinc-200" 
                            : "text-amber-400 hover:text-amber-300 font-bold"
                        }`}
                      >
                        {s.active !== false ? "Pausar servicio" : "Activar servicio"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditService(s)}
                          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id, s.name)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 3: HORARIOS DE ATENCIÓN
           ========================================================= */}
        {activeTab === "schedule" && (
          <div className="max-w-3xl space-y-6">
            <form onSubmit={handleSaveSchedule} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Configuración de Horarios</h3>
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Configura los horarios en los que los clientes pueden reservar turnos. Los turnos se generarán automáticamente dentro de estos rangos.
                </p>
              </div>

              {/* LUNES A SÁBADO */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-white text-base">Lunes a Sábado</h4>
                      <p className="text-zinc-500 text-xs">Jornada habitual semanal</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input 
                      type="checkbox"
                      checked={scheduleForm.mondayToSaturday.isOpen}
                      onChange={(e) => setScheduleForm({
                        ...scheduleForm,
                        mondayToSaturday: { ...scheduleForm.mondayToSaturday, isOpen: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                    />
                    <span className={scheduleForm.mondayToSaturday.isOpen ? "text-emerald-400" : "text-red-400"}>
                      {scheduleForm.mondayToSaturday.isOpen ? "Abierto" : "Cerrado"}
                    </span>
                  </label>
                </div>

                {scheduleForm.mondayToSaturday.isOpen && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Hora Apertura (Inicio de turnos)
                      </label>
                      <input 
                        type="time"
                        value={scheduleForm.mondayToSaturday.open}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          mondayToSaturday: { ...scheduleForm.mondayToSaturday, open: e.target.value }
                        })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Actual: {formatTime12h(scheduleForm.mondayToSaturday.open)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Hora Cierre (Fin de jornada)
                      </label>
                      <input 
                        type="time"
                        value={scheduleForm.mondayToSaturday.close}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          mondayToSaturday: { ...scheduleForm.mondayToSaturday, close: e.target.value }
                        })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Actual: {formatTime12h(scheduleForm.mondayToSaturday.close)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* DOMINGOS */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-white text-base">Domingos</h4>
                      <p className="text-zinc-500 text-xs">Jornada reducida de fin de semana</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input 
                      type="checkbox"
                      checked={scheduleForm.sunday.isOpen}
                      onChange={(e) => setScheduleForm({
                        ...scheduleForm,
                        sunday: { ...scheduleForm.sunday, isOpen: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                    />
                    <span className={scheduleForm.sunday.isOpen ? "text-emerald-400" : "text-red-400"}>
                      {scheduleForm.sunday.isOpen ? "Abierto" : "Cerrado"}
                    </span>
                  </label>
                </div>

                {scheduleForm.sunday.isOpen && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Hora Apertura Domingo
                      </label>
                      <input 
                        type="time"
                        value={scheduleForm.sunday.open}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          sunday: { ...scheduleForm.sunday, open: e.target.value }
                        })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Actual: {formatTime12h(scheduleForm.sunday.open)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Hora Cierre Domingo
                      </label>
                      <input 
                        type="time"
                        value={scheduleForm.sunday.close}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          sunday: { ...scheduleForm.sunday, close: e.target.value }
                        })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        Actual: {formatTime12h(scheduleForm.sunday.close)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Intervalo de turnos */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Intervalo entre turnos (Minutos)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[20, 30, 40].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, slotDurationMinutes: mins })}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                        scheduleForm.slotDurationMinutes === mins
                          ? "border-amber-500 bg-amber-500 text-zinc-950"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      Cada {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo de tolerancia para liberar turno */}
              <div className="p-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Tiempo de tolerancia para liberar turno
                  </label>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {scheduleForm.toleranceMinutes || 10} minutos
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Si el cliente no llega en este tiempo el día de su cita, el panel te avisará con una alerta y podrás liberar el turno para atender a otro cliente.
                </p>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[5, 10, 15, 20].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, toleranceMinutes: mins })}
                      className={`py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                        (scheduleForm.toleranceMinutes || 10) === mins
                          ? "border-amber-500 bg-amber-500 text-zinc-950 shadow-md"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleResetSchedule}
                  className="text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restablecer Horarios por Defecto</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Horarios</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* =========================================================
            TAB: BLOQUEO DE HORARIOS ESPECÍFICOS
           ========================================================= */}
        {activeTab === "blocks" && (
          <div className="space-y-6">
            {/* Formulario para agregar nuevo bloqueo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex items-start gap-4 mb-6 pb-5 border-b border-zinc-800">
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl shrink-0">
                  <Ban className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Bloquear Horario Específico</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                    Inhabilita solo un rango de horas del día (ejemplo: de 2:00 PM a 4:00 PM para almuerzo, descanso o diligencias) sin suspender las reservas del resto de la jornada.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddBlockedRange} className="space-y-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Fecha del Bloqueo
                    </label>
                    <input 
                      type="date"
                      value={newBlockDate || todayStr}
                      min={todayStr}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Selecciona el día
                    </span>
                  </div>

                  {/* Hora Inicio */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Hora de Inicio
                    </label>
                    <input 
                      type="time"
                      value={newBlockStart}
                      onChange={(e) => setNewBlockStart(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-amber-400 mt-1 block font-medium">
                      Desde: {formatTime12h(newBlockStart)}
                    </span>
                  </div>

                  {/* Hora Fin */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Hora de Fin
                    </label>
                    <input 
                      type="time"
                      value={newBlockEnd}
                      onChange={(e) => setNewBlockEnd(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-amber-400 mt-1 block font-medium">
                      Hasta: {formatTime12h(newBlockEnd)}
                    </span>
                  </div>
                </div>

                {/* Motivo del bloqueo */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Motivo / Descripción (Visible en el panel)
                  </label>
                  <input 
                    type="text"
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    placeholder="Ejemplo: Almuerzo, Diligencia personal, Cita médica, Mantenimiento..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Almuerzo (2:00 PM - 4:00 PM)", "Diligencia personal", "Mantenimiento local", "Capacitación / Evento"].map((quickReason) => (
                      <button
                        key={quickReason}
                        type="button"
                        onClick={() => setNewBlockReason(quickReason)}
                        className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {quickReason}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950 hover:scale-[1.01]"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Bloquear Estas Horas</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Horarios Bloqueados */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Horarios Bloqueados Actualmente</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                    Estos turnos aparecerán como no disponibles automáticamente para los clientes.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                  {blockedRanges.length} {blockedRanges.length === 1 ? "bloqueo" : "bloqueos"}
                </span>
              </div>

              {blockedRanges.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-3">
                  <Clock className="w-12 h-12 mx-auto text-zinc-700" />
                  <p className="text-sm font-medium text-zinc-400">No hay horarios bloqueados.</p>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto">
                    Todos los turnos regulares están habilitados según el horario de atención configurado.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {blockedRanges.map((block) => (
                    <div 
                      key={block.id}
                      className="bg-zinc-950/80 border border-red-500/30 p-4 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-red-500/60 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 capitalize">
                            {formatDateSpanish(block.date)}
                          </span>
                          <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                            Bloqueado
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-extrabold text-base">
                          <Clock className="w-4 h-4 text-red-400" />
                          <span>{formatTime12h(block.startTime)} - {formatTime12h(block.endTime)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 italic">
                          "{block.reason}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">{block.date}</span>
                        <button
                          onClick={() => handleRemoveBlockedRange(block.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 text-xs font-bold transition-all border border-zinc-700 hover:border-red-500/40"
                          title="Desbloquear horario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Desbloquear</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: GALERÍA
           ========================================================= */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Galería de Trabajos</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                    Estas imágenes se muestran a los clientes en la página principal para reflejar la calidad de los cortes y barbas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map(img => (
                  <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 group">
                    <img 
                      src={img.url} 
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-medium text-white">{img.alt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL DE CANCELACIÓN CON FORMULARIO Y WHATSAPP
           ========================================================= */}
        {cancellingReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden text-left max-h-[92vh] overflow-y-auto">
              
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg sm:text-xl">
                      Cancelar Reserva
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Notificar al cliente vía WhatsApp ({cancellingReservation.id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancellingReservation(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Resumen de la cita */}
              <div className="my-4 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="font-bold text-white">{cancellingReservation.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">WhatsApp destino:</span>
                  <span className="font-bold text-emerald-400">+57 {cancellingReservation.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Servicio:</span>
                  <span className="font-medium text-zinc-200">{cancellingReservation.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Fecha y Hora:</span>
                  <span className="font-bold text-amber-400">
                    {formatDateSpanish(cancellingReservation.date)} a las {formatTime12h(cancellingReservation.time)}
                  </span>
                </div>
              </div>

              {/* Formulario de Cancelación */}
              <form onSubmit={handleConfirmCancellation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Escribe el motivo de la cancelación *
                  </label>
                  
                  {/* Opciones rápidas de un clic */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {[
                      "Inconveniente de fuerza mayor",
                      "Imprevisto personal del barbero",
                      "Corte de energía en el local",
                      "Cruce de horarios",
                      "El cliente solicitó cancelar",
                    ].map(motivo => (
                      <button
                        key={motivo}
                        type="button"
                        onClick={() => setCancellationReason(motivo)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          cancellationReason === motivo
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                            : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white hover:border-zinc-500"
                        }`}
                      >
                        {motivo}
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={3}
                    placeholder="Escribe el motivo aquí (ej. Inconveniente de fuerza mayor, corte de energía, etc.)..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                {/* Vista previa del mensaje de WhatsApp listo para enviar */}
                <div className="bg-emerald-950/20 border border-emerald-600/30 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Mensaje listo para enviar por WhatsApp:</span>
                  </div>
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-emerald-900/40 text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans select-all">
                    {getCancellationMessageText(
                      cancellingReservation,
                      cancellationReason || "Inconveniente imprevisto"
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingReservation(null)}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors"
                  >
                    Volver / No cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950 hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar y Abrir WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Cargando panel de administración...</span>
        </div>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}

