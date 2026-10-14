"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  BarberService, 
  BarberReservation, 
  ServiceStatus,
  DEFAULT_SERVICE_STATUS,
  getStoredServices, 
  getStoredReservations, 
  getStoredSchedule, 
  getStoredServiceStatus,
  getGeneralWhatsAppUrl,
  addReservation, 
  computeSlotsForDate, 
  getTodayDateString, 
  formatPriceCOP, 
  formatDateSpanish, 
  formatTime12h, 
  getWhatsAppReservationUrl, 
  BUSINESS_INFO,
  GeneratedSlot,
  BlockedTimeRange,
  getStoredBlockedRanges,
  fetchStoredReservations,
  syncAllFromSupabase
} from "@/data/barberStore";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Scissors, 
  User, 
  Phone, 
  CheckCircle, 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Copy, 
  MapPin, 
  MessageCircle, 
  Sparkles,
  RefreshCw,
  FileText,
  DollarSign,
  CreditCard
} from "lucide-react";

function BookingContent() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId");

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<BarberService[]>([]);
  const [reservations, setReservations] = useState<BarberReservation[]>([]);
  const [schedule, setSchedule] = useState(getStoredSchedule());
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(DEFAULT_SERVICE_STATUS);
  const [blockedRanges, setBlockedRanges] = useState<BlockedTimeRange[]>([]);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    initialServiceId ? parseInt(initialServiceId, 10) : null
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientInfo, setClientInfo] = useState({ name: "", phone: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [copiedTransferNumber, setCopiedTransferNumber] = useState(false);
  
  // Validation / Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<BarberReservation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Cargar datos del store y sincronizar con Supabase
  useEffect(() => {
    const loadData = () => {
      const storedS = getStoredServices().filter(s => s.active !== false);
      const storedR = getStoredReservations();
      const storedSch = getStoredSchedule();
      const storedStatus = getStoredServiceStatus();
      const storedBlocks = getStoredBlockedRanges();
      setServices(storedS);
      setReservations(storedR);
      setSchedule(storedSch);
      setServiceStatus(storedStatus);
      setBlockedRanges(storedBlocks);

      // Si viene por param y existe, pre-seleccionarlo
      if (initialServiceId) {
        const found = storedS.find(s => s.id === parseInt(initialServiceId, 10));
        if (found) {
          setSelectedServiceId(found.id);
        }
      }
    };

    loadData();

    // Sincronizar con Supabase en segundo plano
    syncAllFromSupabase().then(() => {
      loadData();
    }).catch(() => {});

    window.addEventListener("imperio_store_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("imperio_store_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [initialServiceId]);

  // Fechas inicializadas en useEffect para evitar new Date() en el pre-renderizado de Next.js
  const [todayStr, setTodayStr] = useState<string>("");
  const [quickDates, setQuickDates] = useState<{ label: string; dateStr: string; dayName: string }[]>([]);

  useEffect(() => {
    const t = getTodayDateString();
    setTodayStr(t);

    const list: { label: string; dateStr: string; dayName: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const str = `${year}-${month}-${day}`;

      let label = "Hoy";
      if (i === 1) label = "Mañana";
      if (i === 2) label = "Pasado Mañana";
      if (i === 3) {
        label = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
      }

      const dayName = d.toLocaleDateString('es-CO', { weekday: 'long' });
      list.push({ label, dateStr: str, dayName });
    }
    setQuickDates(list);
  }, []);

  const handleSelectService = (id: number) => {
    setSelectedServiceId(id);
    setErrorMsg(null);
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  // Calcular turnos generados para la fecha seleccionada
  const slotsData = useMemo(() => {
    if (!selectedDate) return { isOpen: false, slots: [] as GeneratedSlot[] };
    return computeSlotsForDate(selectedDate, reservations, schedule, blockedRanges);
  }, [selectedDate, reservations, schedule, blockedRanges]);

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!selectedServiceId) {
        setErrorMsg("Por favor selecciona un servicio para continuar.");
        return;
      }
      if (!selectedDate) {
        setSelectedDate(todayStr);
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2) {
      if (!selectedDate) {
        setErrorMsg("Por favor elige una fecha.");
        return;
      }
      if (!selectedTime) {
        setErrorMsg("Por favor elige un horario disponible.");
        return;
      }
      // Validar si el slot está ocupado
      const slot = slotsData.slots.find(s => s.time === selectedTime);
      if (!slot || !slot.isAvailable) {
        setErrorMsg("El turno seleccionado ya no está disponible. Por favor elige otro horario.");
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Enviar y registrar reserva
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedService || !selectedDate || !selectedTime) {
      setErrorMsg("Faltan datos de la reserva.");
      return;
    }

    // Validación de nombre
    if (!clientInfo.name.trim() || clientInfo.name.trim().length < 3) {
      setErrorMsg("Por favor ingresa tu nombre completo.");
      return;
    }

    // Validación de teléfono WhatsApp
    const cleanedPhone = clientInfo.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMsg("Por favor ingresa un número de WhatsApp válido (mínimo 10 dígitos, ej: 320 333 5586).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Doble verificación en tiempo real: comprobar que el turno no esté ocupado en Supabase
      const currentReservations = await fetchStoredReservations();
      const isAlreadyTaken = currentReservations.some(
        r => r.date === selectedDate && r.time === selectedTime && r.status !== 'cancelled'
      );

      if (isAlreadyTaken) {
        setIsSubmitting(false);
        setErrorMsg("¡Ups! Este turno fue reservado hace unos instantes en otro dispositivo. Por favor regresa y elige otro horario.");
        return;
      }

      const newBooking = await addReservation({
        clientName: clientInfo.name.trim(),
        phone: cleanedPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        paymentMethod: paymentMethod,
        notes: clientInfo.notes.trim(),
      });

      // Guardar teléfono y nombre para facilitar la consulta en /mis-reservas
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("imperio_last_phone", cleanedPhone);
          localStorage.setItem("imperio_last_name", clientInfo.name.trim());
        } catch {}
      }

      setCreatedReservation(newBooking);
      setIsSubmitting(false);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Notificación de nueva reserva al administrador
      const whatsappUrl = getWhatsAppReservationUrl(newBooking);
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMsg("Ocurrió un error al guardar tu reserva. Por favor intenta de nuevo.");
    }
  };

  const handleCopyCode = () => {
    if (!createdReservation) return;
    navigator.clipboard.writeText(createdReservation.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTransferNumber = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText("3203335586");
      setCopiedTransferNumber(true);
      setTimeout(() => setCopiedTransferNumber(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 md:p-10 selection:bg-amber-500/30">
      
      {/* Barra superior de navegación */}
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a {BUSINESS_INFO.name}
        </Link>
        {serviceStatus.isPaused ? (
          <span className="text-xs text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            Reservas Pausadas
          </span>
        ) : (
          <span className="text-xs text-amber-500/90 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Paso {step} de {step === 4 ? "4 (Listo)" : "3"}
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        
        {serviceStatus.isPaused ? (
          /* MODO ESPECIAL: NO HAY SERVICIO DISPONIBLE */
          <div className="py-8 sm:py-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <Clock className="w-10 h-10" />
            </div>

            <div className="inline-block bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Atención al Cliente
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white mb-4">
              Por el momento no hay servicio disponible
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              {serviceStatus.pauseMessage || "Por el momento no hay servicio disponible. Intenta más tarde."} El barbero no se encuentra agendando turnos en este momento. Agradecemos tu comprensión.
            </p>

            <div className="max-w-md mx-auto space-y-3">
              <a
                href={getGeneralWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-base transition-all shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Consultar por WhatsApp ({BUSINESS_INFO.phone})</span>
              </a>

              <a
                href={`tel:${BUSINESS_INFO.phoneCall}`}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3.5 px-4 rounded-xl font-semibold text-sm transition-colors border border-zinc-700"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Llamar a la Barbería</span>
              </a>

              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-block text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Volver a la página principal
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de progreso interactiva (Pasos 1 a 3) */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2.5 text-xs sm:text-sm font-semibold">
              <span className={step >= 1 ? 'text-amber-500' : 'text-zinc-600'}>
                1. Servicio
              </span>
              <span className={step >= 2 ? 'text-amber-500' : 'text-zinc-600'}>
                2. Fecha y Turno
              </span>
              <span className={step >= 3 ? 'text-amber-500' : 'text-zinc-600'}>
                3. Tus Datos
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mensaje de error general si aplica */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* ========================================================
            PASO 1: SELECCIONAR SERVICIO
           ======================================================== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Scissors className="w-4 h-4" /> Paso 1
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Elige tu Servicio
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Tarifas fijas en pesos colombianos (COP). Toca para seleccionar.
              </p>
            </div>

            <div className="space-y-3.5">
              {services.map(service => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative group ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500' 
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-amber-500 bg-amber-500 text-zinc-950' : 'border-zinc-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`font-bold text-base sm:text-lg transition-colors ${
                          isSelected ? 'text-amber-400' : 'text-white'
                        }`}>
                          {service.name}
                        </span>
                      </div>
                      
                      <span className="text-amber-400 font-extrabold text-base sm:text-lg bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shrink-0">
                        {formatPriceCOP(service.price)}
                      </span>
                    </div>

                    <p className="text-zinc-400 text-xs sm:text-sm pl-7.5 mb-3 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="pl-7.5 flex items-center gap-2 text-xs text-zinc-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>Tiempo estimado: <strong className="text-zinc-300">{service.duration} minutos</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800">
              <button 
                type="button"
                disabled={!selectedServiceId}
                onClick={handleNextStep}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 py-4 rounded-xl font-bold text-base transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
              >
                <span>Continuar a Fecha y Hora</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PASO 2: FECHA Y TURNO INTELIGENTE
           ======================================================== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
                <CalendarIcon className="w-4 h-4" /> Paso 2
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Elige Día y Horario
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Solo turnos disponibles en tiempo real. Los horarios ocupados están bloqueados.
              </p>
            </div>

            {/* Servicio seleccionado actual badge */}
            {selectedService && (
              <div className="mb-6 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-white">{selectedService.name}</span>
                  <span className="text-zinc-500">• {selectedService.duration} min</span>
                </div>
                <span className="text-amber-400 font-bold">{formatPriceCOP(selectedService.price)}</span>
              </div>
            )}

            {/* Selector rápido de fecha */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                Acceso Rápido por Día
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickDates.map(qd => {
                  const isCur = selectedDate === qd.dateStr;
                  return (
                    <button
                      key={qd.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(qd.dateStr);
                        setSelectedTime("");
                        setErrorMsg(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCur 
                          ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500' 
                          : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="text-xs font-bold capitalize text-amber-400">{qd.label}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 capitalize">{qd.dayName}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de calendario */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                O Selecciona en el Calendario
              </label>
              <input 
                type="date" 
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                  setErrorMsg(null);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white text-base focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Indicador de horario de atención según el día */}
            {selectedDate && (
              <div className="mb-6 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                      Fecha Seleccionada
                    </span>
                    <span className="font-semibold text-white text-sm sm:text-base capitalize">
                      {formatDateSpanish(selectedDate)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {new Date(selectedDate + "T12:00:00").getDay() === 0 
                        ? "Domingo: 8:00 AM - 2:00 PM" 
                        : "Lunes a Sábado: 8:00 AM - 8:00 PM"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grilla de turnos */}
            {selectedDate && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Turnos Disponibles
                  </label>
                  
                  {/* Leyenda */}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Libre
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700"></span> Ocupado
                    </span>
                  </div>
                </div>

                {!slotsData.isOpen ? (
                  <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400 text-sm">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-medium text-white">{slotsData.reason || "Barbería cerrada este día."}</p>
                    <p className="text-xs text-zinc-500 mt-1">Por favor elige otro día para tu reserva.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto p-1">
                      {slotsData.slots.map(slot => {
                        const isSelected = selectedTime === slot.time;

                        if (slot.isOccupied) {
                          return (
                            <div
                              key={slot.time}
                              className="py-3 px-2 rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-600 text-center cursor-not-allowed select-none opacity-60"
                              title="Turno ya ocupado"
                            >
                              <div className="text-xs font-semibold line-through">{slot.time12}</div>
                              <span className="text-[10px] text-red-400/80 font-bold block mt-0.5">Ocupado</span>
                            </div>
                          );
                        }

                        if (slot.isBlocked) {
                          return (
                            <div
                              key={slot.time}
                              className="py-3 px-2 rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-600 text-center cursor-not-allowed select-none opacity-60"
                              title={slot.blockReason || "Horario reservado por el barbero"}
                            >
                              <div className="text-xs font-semibold line-through">{slot.time12}</div>
                              <span className="text-[10px] text-amber-500/80 font-bold block mt-0.5">Reservado</span>
                            </div>
                          );
                        }

                        if (slot.isPast) {
                          return (
                            <div
                              key={slot.time}
                              className="py-3 px-2 rounded-xl border border-zinc-900 bg-zinc-950/30 text-zinc-700 text-center cursor-not-allowed select-none opacity-50"
                              title="Horario ya transcurrido"
                            >
                              <div className="text-xs font-semibold line-through">{slot.time12}</div>
                              <span className="text-[10px] text-zinc-600 block mt-0.5">Pasado</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              setSelectedTime(slot.time);
                              setErrorMsg(null);
                            }}
                            className={`py-3 px-2 rounded-xl border text-center transition-all duration-150 ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-zinc-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-102'
                                : 'border-zinc-800 bg-zinc-950 hover:border-amber-500/50 hover:bg-zinc-900 text-zinc-200 font-semibold'
                            }`}
                          >
                            <div className="text-xs sm:text-sm font-bold">{slot.time12}</div>
                            <span className={`text-[10px] block mt-0.5 font-medium ${
                              isSelected ? 'text-zinc-900' : 'text-emerald-400'
                            }`}>
                              {isSelected ? '✓ Elegido' : 'Disponible'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {slotsData.slots.filter(s => s.isAvailable).length === 0 && (
                      <div className="p-6 text-center bg-zinc-950/80 rounded-2xl border border-zinc-800 text-zinc-400 text-sm mt-3">
                        <p className="font-semibold text-amber-400">No hay turnos disponibles para esta fecha.</p>
                        <p className="text-xs text-zinc-500 mt-1">Todos los horarios ya fueron ocupados o ya transcurrieron hoy.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-3 mt-8 pt-4 border-t border-zinc-800">
              <button 
                type="button"
                onClick={handlePrevStep}
                className="px-5 sm:px-6 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-colors"
              >
                Atrás
              </button>
              <button 
                type="button"
                disabled={!selectedDate || !selectedTime || !slotsData.isOpen}
                onClick={handleNextStep}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 py-4 rounded-xl font-bold text-base transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
              >
                <span>Continuar a Mis Datos</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PASO 3: DATOS DEL CLIENTE Y CONFIRMACIÓN
           ======================================================== */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
                <User className="w-4 h-4" /> Paso 3
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Datos de la Reserva
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Ingresa tu nombre y tu WhatsApp para confirmar tu turno.
              </p>
            </div>

            {/* Resumen de la Cita */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 mb-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
                <div className="text-xs text-zinc-400 font-medium">Servicio Seleccionado</div>
                <div className="font-bold text-white text-sm text-right flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  {selectedService?.name}
                </div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
                <div className="text-xs text-zinc-400 font-medium">Fecha y Hora</div>
                <div className="font-semibold text-white text-sm text-right">
                  {formatDateSpanish(selectedDate)} a las <span className="text-amber-400 font-bold">{formatTime12h(selectedTime)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
                <div className="text-xs text-zinc-400 font-medium">Tiempo de Atención</div>
                <div className="font-medium text-zinc-300 text-sm text-right flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {selectedService?.duration} min
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="text-sm font-semibold text-zinc-300">Total a pagar en el local</div>
                <div className="font-extrabold text-amber-400 text-lg">
                  {formatPriceCOP(selectedService?.price || 0)}
                </div>
              </div>
            </div>

            {/* Formulario de Datos */}
            <form onSubmit={handleConfirmReservation}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500"/> Nombre y Apellido *
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. Juan Pérez"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400"/> Número de WhatsApp *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
                      🇨🇴 +57
                    </div>
                    <input 
                      required
                      type="tel" 
                      placeholder="320 123 4567"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pr-4 pl-20 text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    Te enviaremos los detalles y recordatorios de tu cita a este número.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-500"/> Notas o detalles adicionales (Opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej. Corte con navaja en la ceja, primera vez..."
                    value={clientInfo.notes}
                    onChange={(e) => setClientInfo({...clientInfo, notes: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* SELECTOR DE MÉTODO DE PAGO */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" /> Elige tu Método de Pago *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Opción 1: Efectivo */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        paymentMethod === 'cash'
                          ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50 shadow-md"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        paymentMethod === 'cash' ? "bg-amber-500 text-zinc-950 font-bold" : "bg-zinc-900 text-zinc-400"
                      }`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          <span>Pagar en efectivo</span>
                          {paymentMethod === 'cash' && <span className="text-amber-400 text-xs">✓</span>}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          Pagas en la barbería al finalizar tu turno
                        </div>
                      </div>
                    </button>

                    {/* Opción 2: Transferencia */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        paymentMethod === 'transfer'
                          ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        paymentMethod === 'transfer' ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-900 text-zinc-400"
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          <span>Pagar por transferencia</span>
                          {paymentMethod === 'transfer' && <span className="text-emerald-400 text-xs">✓</span>}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          Nequi, Daviplata o Bancolombia
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Instrucciones y detalles si elige Transferencia */}
                  {paymentMethod === 'transfer' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in duration-300 space-y-3.5 mt-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Número para Transferencia
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Nequi • Daviplata • Bancolombia
                        </span>
                      </div>

                      {/* Recuadro destacado con número y botón Copiar grande */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-zinc-950 rounded-2xl border border-emerald-500/30 shadow-inner">
                        <div>
                          <span className="text-[11px] text-zinc-400 block mb-0.5">Número de cuenta / celular:</span>
                          <div className="text-2xl sm:text-3xl font-black text-white tracking-widest font-mono">
                            320 3335586
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyTransferNumber}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95 cursor-pointer"
                        >
                          {copiedTransferNumber ? (
                            <>
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar número</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Texto de instrucción exacto */}
                      <p className="text-xs text-zinc-200 leading-relaxed font-medium bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
                        💬 “Realiza la transferencia a este número por Nequi, Daviplata o Bancolombia y guarda el comprobante”
                      </p>

                      {/* Botones opcionales de apertura de apps sin forzar descargas */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[11px] text-zinc-400 font-medium">Accesos directos (opcional):</span>
                        <a
                          href="nequi://"
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-200 text-xs font-bold transition-all hover:bg-zinc-850"
                        >
                          Abrir Nequi
                        </a>
                        <a
                          href="daviplata://"
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500 text-zinc-200 text-xs font-bold transition-all hover:bg-zinc-850"
                        >
                          Abrir Daviplata
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Aviso de tolerancia de llegada */}
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Tiempo de tolerancia:</strong> {schedule.toleranceMinutes || 10} minutos. Por favor llega puntual para garantizar tu atención.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={handlePrevStep} 
                  className="px-5 sm:px-6 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-colors"
                >
                  Atrás
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-zinc-950 py-4 rounded-xl font-extrabold text-base transition-all shadow-[0_0_20px_rgba(217,119,6,0.4)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Agendando Turno...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirmar Reserva</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            PASO 4: CONFIRMACIÓN CLARA (PANTALLA DE ÉXITO)
           ======================================================== */}
        {step === 4 && createdReservation && (
          <div className="animate-in zoom-in-95 duration-500 py-4">
            
            {/* Cabecera de éxito */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                ¡Reserva Confirmada!
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base max-w-md mx-auto">
                Hola <strong className="text-white">{createdReservation.clientName}</strong>, tu cita en <strong>{BUSINESS_INFO.name}</strong> ha quedado agendada con éxito.
              </p>
            </div>

            {/* Código de reserva destacado */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400/90 font-semibold uppercase tracking-wider block">
                  Código de Reserva
                </span>
                <span className="text-2xl font-black text-amber-400 tracking-wider">
                  {createdReservation.id}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Tarjeta de Resumen Completo */}
            <div className="bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-800 mb-8 space-y-3.5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-800">
                Resumen de la Cita
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-zinc-500 block">Servicio</span>
                  <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Scissors className="w-4 h-4 text-amber-500" />
                    {createdReservation.serviceName}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">Valor a Pagar (COP)</span>
                  <span className="font-extrabold text-amber-400 text-base mt-0.5 block">
                    {formatPriceCOP(createdReservation.price || 0)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">Día y Fecha</span>
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5 capitalize">
                    <CalendarIcon className="w-4 h-4 text-amber-500" />
                    {formatDateSpanish(createdReservation.date)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">Hora del Turno</span>
                  <span className="font-extrabold text-emerald-400 text-base flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    {formatTime12h(createdReservation.time)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">Cliente</span>
                  <span className="font-medium text-zinc-200 mt-0.5 block">
                    {createdReservation.clientName}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">WhatsApp de Contacto</span>
                  <span className="font-medium text-zinc-200 mt-0.5 block">
                    +57 {createdReservation.phone}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 block">Método de Pago</span>
                  <span className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                    {createdReservation.paymentMethod === 'transfer' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Transferencia</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 font-bold">Efectivo (en barbería)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {createdReservation.paymentMethod === 'transfer' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Pago por Transferencia: 320 3335586</span>
                  </div>
                  <p className="text-zinc-300">
                    Por favor envía o muestra el comprobante de transferencia (Nequi / Daviplata / Bancolombia) por WhatsApp o al llegar a la barbería.
                  </p>
                </div>
              )}

              {createdReservation.notes && (
                <div className="pt-2 border-t border-zinc-900 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Nota:</span> {createdReservation.notes}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-300">{BUSINESS_INFO.name}:</span> {BUSINESS_INFO.address}, {BUSINESS_INFO.city}.
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: WHATSAPP, LLAMAR Y VOLVER */}
            <div className="space-y-3">
              {/* Botón WhatsApp a la barbería (320 3335586) con mensaje pre-cargado */}
              <a
                href={getWhatsAppReservationUrl(createdReservation)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-base transition-all shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Confirmar / Enviar a WhatsApp ({BUSINESS_INFO.phone})</span>
              </a>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Botón para llamar directamente a la barbería */}
                <a
                  href={`tel:${BUSINESS_INFO.phoneCall}`}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3.5 px-4 rounded-xl font-semibold text-sm transition-colors border border-zinc-700"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Llamar a la Barbería</span>
                </a>

                {/* Botón de cómo llegar en Google Maps */}
                <a
                  href={BUSINESS_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3.5 px-4 rounded-xl font-semibold text-sm transition-colors border border-zinc-700"
                >
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Cómo llegar (Maps)</span>
                </a>
              </div>

              {/* Botón para consultar historial de reservas */}
              <div className="pt-2">
                <Link
                  href="/mis-reservas"
                  className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 py-3.5 px-4 rounded-xl font-bold text-sm transition-all border border-amber-500/30"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Consultar mis reservas agendadas</span>
                </Link>
              </div>

              {/* Botón para volver al inicio */}
              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="inline-block text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Volver a la página principal
                </Link>
              </div>
            </div>

          </div>
        )}
          </>
        )}

      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Cargando sistema de reservas...</span>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
