"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { 
  BarberReservation, 
  getStoredReservations, 
  formatDateSpanish, 
  formatTime12h, 
  formatPriceCOP,
  BUSINESS_INFO,
  getTodayDateString
} from "@/data/barberStore";
import { 
  Search, 
  Scissors, 
  Calendar, 
  Clock, 
  Phone, 
  MessageCircle, 
  MapPin, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  CreditCard,
  RefreshCw,
  AlertCircle,
  Plus
} from "lucide-react";

function MisReservasContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<BarberReservation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(getTodayDateString());
    const all = getStoredReservations();
    setReservations(all);

    // Pre-cargar si el usuario ya reservó antes en este dispositivo
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("imperio_last_phone") || "";
      const savedName = localStorage.getItem("imperio_last_name") || "";
      if (savedPhone) {
        setSearchTerm(savedPhone);
        setHasSearched(true);
      } else if (savedName) {
        setSearchTerm(savedName);
        setHasSearched(true);
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  // Filtrar reservas que coincidan con el término de búsqueda
  const matchedReservations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    const cleanTermDigits = term.replace(/\D/g, "");

    return reservations.filter(res => {
      // Coincidencia por teléfono (limpiando números)
      if (cleanTermDigits.length >= 3) {
        const cleanResPhone = (res.phone || "").replace(/\D/g, "");
        if (cleanResPhone.includes(cleanTermDigits)) return true;
      }

      // Coincidencia por nombre
      if (res.clientName && res.clientName.toLowerCase().includes(term)) return true;

      // Coincidencia por código de reserva (#IMP...)
      if (res.id && res.id.toLowerCase().includes(term)) return true;

      return false;
    }).sort((a, b) => {
      // Orden descendente por fecha y hora
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });
  }, [searchTerm, reservations]);

  // Dividir en Próximas (Activas) y Anteriores
  const { upcoming, past } = useMemo(() => {
    const up: BarberReservation[] = [];
    const pa: BarberReservation[] = [];

    matchedReservations.forEach(res => {
      const isFutureOrToday = res.date >= todayStr;
      if (res.status === "pending" && isFutureOrToday) {
        up.push(res);
      } else {
        pa.push(res);
      }
    });

    return { upcoming: up, past: pa };
  }, [matchedReservations, todayStr]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 md:p-10 selection:bg-amber-500/30">
      
      {/* Cabecera / Navegación */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
        <Link 
          href="/book" 
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 px-4 py-2 rounded-full font-extrabold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Banner de Título */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Consultar Mis Reservas
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Ingresa tu número de WhatsApp o tu nombre para ver tus citas agendadas y tu historial en <strong>{BUSINESS_INFO.name}</strong>.
          </p>

          {/* Formulario de búsqueda */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-md mx-auto">
            <div className="relative">
              <input 
                type="text"
                placeholder="Número de WhatsApp (ej: 320...) o nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHasSearched(true);
                }}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-11 pr-24 py-3.5 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
              />
              <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Buscar
              </button>
            </div>
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => { setSearchTerm(""); setHasSearched(false); }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-2 inline-block underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </form>
        </div>

        {/* =========================================================
            RESULTADOS DE LA BÚSQUEDA
           ========================================================= */}
        {hasSearched && searchTerm.trim() && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* PRÓXIMAS RESERVAS (ACTIVAS / PENDIENTES) */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Próximas Citas ({upcoming.length})</span>
                </h2>
                {upcoming.length > 0 && (
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Activas
                  </span>
                )}
              </div>

              {upcoming.length === 0 ? (
                <div className="p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center text-zinc-400 text-xs sm:text-sm">
                  <p>No tienes citas pendientes para los próximos días con estos datos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(res => (
                    <div 
                      key={res.id} 
                      className="bg-zinc-900 border border-zinc-700/80 hover:border-amber-500/40 p-5 rounded-2xl shadow-xl transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-400 font-mono">{res.id}</span>
                            <span className="text-[11px] text-zinc-400 capitalize bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                              {res.date === todayStr ? "¡Hoy!" : formatDateSpanish(res.date)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-amber-500" />
                            <span>{res.serviceName}</span>
                          </h3>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendiente</span>
                        </span>
                      </div>

                      {/* Detalles de la cita */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs">
                        <div>
                          <span className="text-zinc-500 block">Hora</span>
                          <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">
                            {formatTime12h(res.time)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Valor</span>
                          <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                            {formatPriceCOP(res.price || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Cliente</span>
                          <span className="font-semibold text-white mt-0.5 block truncate">
                            {res.clientName}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Método de Pago</span>
                          <span className="font-semibold text-zinc-200 mt-0.5 flex items-center gap-1">
                            {res.paymentMethod === 'transfer' ? (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Transferencia</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                                <span>Efectivo</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Botones de contacto y ubicación */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
                        <a
                          href={`https://wa.me/${BUSINESS_INFO.phoneClean}?text=${encodeURIComponent(
                            `¡Hola Imperio Barber! Quisiera consultar sobre mi reserva ${res.id} para ${res.serviceName} el ${res.date} a las ${res.time}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all border border-emerald-500/30"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Escribir por WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${BUSINESS_INFO.phoneCall}`}
                          className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors border border-zinc-700"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Llamar</span>
                        </a>

                        <a
                          href={BUSINESS_INFO.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors border border-zinc-700"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>Cómo llegar</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HISTORIAL DE RESERVAS ANTERIORES */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-base font-extrabold text-zinc-300">
                  Historial / Citas Anteriores ({past.length})
                </h2>
              </div>

              {past.length === 0 ? (
                <div className="p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-center text-zinc-500 text-xs">
                  No hay reservas anteriores registradas con estos datos.
                </div>
              ) : (
                <div className="space-y-3">
                  {past.map(res => (
                    <div 
                      key={res.id} 
                      className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-400 font-mono">{res.id}</span>
                            <span className="text-xs text-zinc-400">{formatDateSpanish(res.date)} ({formatTime12h(res.time)})</span>
                          </div>
                          <div className="font-bold text-white text-sm mt-0.5">{res.serviceName}</div>
                        </div>

                        {res.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Atendida
                          </span>
                        )}
                        {res.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Cancelada
                          </span>
                        )}
                        {res.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                            Pasada
                          </span>
                        )}
                      </div>

                      {/* Motivo de cancelación si aplica */}
                      {res.status === "cancelled" && res.cancellationReason && (
                        <div className="text-xs text-red-300 bg-red-950/30 p-2.5 rounded-xl border border-red-900/30">
                          <span className="font-bold text-red-400">Motivo:</span> {res.cancellationReason}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-zinc-400 pt-1 border-t border-zinc-850">
                        <span>Valor: <strong className="text-zinc-200">{formatPriceCOP(res.price || 0)}</strong></span>
                        <Link 
                          href={`/book?serviceId=${res.serviceId}`} 
                          className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          Volver a agendar →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Sin resultados tras buscar */}
        {hasSearched && searchTerm.trim() && matchedReservations.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-extrabold text-white text-lg">No encontramos reservas con esa información</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              Verifica haber escrito bien tu número de teléfono o tu nombre. Recuerda que puedes agendar una nueva cita en cualquier momento.
            </p>
            <div className="pt-2">
              <Link 
                href="/book" 
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-extrabold px-6 py-3 rounded-xl text-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Agendar Nueva Cita
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function MisReservasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Cargando tus reservas...</span>
        </div>
      </div>
    }>
      <MisReservasContent />
    </Suspense>
  );
}
