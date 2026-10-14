"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BarberService, 
  ServiceStatus,
  DEFAULT_SERVICE_STATUS,
  getStoredServices, 
  getStoredServiceStatus,
  fetchStoredServices,
  fetchStoredServiceStatus,
  formatPriceCOP, 
  BUSINESS_INFO, 
  getGeneralWhatsAppUrl 
} from "@/data/barberStore";
import { gallery } from "@/data/mockData";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Calendar, 
  Scissors, 
  ChevronRight, 
  MessageCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Smartphone
} from "lucide-react";

export default function Home() {
  const [serviceList, setServiceList] = useState<BarberService[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(DEFAULT_SERVICE_STATUS);

  useEffect(() => {
    // Cargar servicios y estado (inmediatamente de caché y luego sincronizar con Supabase)
    const load = () => {
      setServiceList(getStoredServices().filter(s => s.active !== false));
      setServiceStatus(getStoredServiceStatus());
    };

    load();

    // Actualización fresca desde Supabase
    fetchStoredServices().then(services => {
      setServiceList(services.filter(s => s.active !== false));
    }).catch(() => {});

    fetchStoredServiceStatus().then(status => {
      setServiceStatus(status);
    }).catch(() => {});

    window.addEventListener("imperio_store_updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("imperio_store_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30">
      
      {/* HEADER / NAV */}
      <header className="fixed top-0 w-full z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white p-0.5 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-sm group-hover:border-amber-500 transition-all">
              <Image 
                src="/logo.png" 
                alt="Logo Imperio Barber" 
                fill 
                className="object-contain p-0.5"
              />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-amber-500">
              {BUSINESS_INFO.name.toUpperCase()}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#servicios" className="hover:text-amber-500 transition-colors">Servicios & Precios</a>
            <a href="#galeria" className="hover:text-amber-500 transition-colors">Galería</a>
            <a href="#ubicacion" className="hover:text-amber-500 transition-colors">Ubicación</a>
            <Link href="/mis-reservas" className="text-zinc-300 hover:text-amber-500 transition-colors font-semibold">Mis Reservas</Link>
            <button 
              onClick={() => window.dispatchEvent(new Event("open_install_modal"))}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/mis-reservas" 
              className="text-xs font-bold text-zinc-300 hover:text-white px-3 py-2 rounded-full border border-zinc-800 hover:border-zinc-700 transition-all md:hidden"
            >
              Mis Citas
            </Link>
            <Link 
              href="/book" 
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(217,119,6,0.35)] hover:shadow-[0_0_20px_rgba(217,119,6,0.55)] flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 hidden sm:inline" />
              <span>Reservar Turno</span>
            </Link>
          </div>
        </div>
      </header>

      {/* BANNER AVISO: MODO NO HAY SERVICIO */}
      {serviceStatus.isPaused && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-red-950/90 border-b border-red-500/40 backdrop-blur-md py-3 px-4 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>
              <strong>Aviso:</strong> {serviceStatus.pauseMessage || "Por el momento no hay servicio disponible. Intenta más tarde."}
            </span>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className={`relative pb-16 md:pb-32 px-4 overflow-hidden ${
        serviceStatus.isPaused ? "pt-36 md:pt-52" : "pt-28 md:pt-44"
      }`}>
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950 z-10"></div>
          <Image 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Fondo barbería Imperio Barber"
            fill
            className="object-cover opacity-35 blur-[2px]"
            priority
          />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {serviceStatus.isPaused ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-xs sm:text-sm font-bold mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>Atención: Por el momento no hay servicio disponible</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Barbería Premium en El Cerrito, Valle</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            El estilo que te <span className="text-amber-500">define</span>.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Experimenta el arte de la barbería tradicional con técnicas modernas. Cortes precisos, ritual de barba impecable y atención de primer nivel.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center max-w-md mx-auto">
            <Link 
              href="/book" 
              className={`flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-all w-full justify-center group ${
                serviceStatus.isPaused
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  : "bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(217,119,6,0.4)]"
              }`}
            >
              <Calendar className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{serviceStatus.isPaused ? "Ver Estado de Reservas" : "Agendar Cita Online"}</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#servicios" 
              className="flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all w-full sm:w-auto justify-center bg-zinc-900/60 backdrop-blur-sm"
            >
              Ver Servicios & Precios
            </a>
          </div>

          {/* Badges de confianza */}
          <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Turnos confirmados al instante</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Sin filas ni largas esperas</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Centro de El Cerrito</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicios" className="py-20 px-4 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">
              <Scissors className="w-4 h-4" /> Tarifas Transparentes
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nuestros Servicios y Precios
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Precios claros en pesos colombianos (COP) con tiempo estimado de atención garantizado.
            </p>
            <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full mt-4"></div>
          </div>

          {serviceStatus.isPaused && (
            <div className="mb-10 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-center text-sm font-semibold flex items-center justify-center gap-2.5 max-w-xl mx-auto animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <span>{serviceStatus.pauseMessage || "Por el momento no hay servicio disponible. Intenta más tarde."}</span>
            </div>
          )}
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceList.map((service) => (
              <div 
                key={service.id} 
                className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-amber-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>

                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {service.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-sm inline-block shadow-sm">
                        {formatPriceCOP(service.price)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{service.duration} minutos</span>
                  </div>

                  <Link
                    href={`/book?serviceId=${service.id}`}
                    className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-lg transition-all ${
                      serviceStatus.isPaused
                        ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                        : "bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-zinc-950"
                    }`}
                  >
                    <span>{serviceStatus.isPaused ? "Consultar" : "Elegir"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-[0_0_20px_rgba(217,119,6,0.35)]"
            >
              <Calendar className="w-4 h-4" />
              <span>Reservar un servicio ahora</span>
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="galeria" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
            <div>
              <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Galería</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Trabajos Destacados</h2>
              <div className="h-1 w-20 bg-amber-500 rounded-full"></div>
            </div>
            <a 
              href={getGeneralWhatsAppUrl()} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 transition-colors font-medium text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Consultar estilo personalizado</span>
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-800">
                <Image 
                  src={img.url} 
                  alt={img.alt} 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs sm:text-sm font-medium text-zinc-200">{img.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION & CONTACT */}
      <section id="ubicacion" className="py-20 px-4 bg-zinc-900/40 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Encuéntranos</div>
              <h2 className="text-3xl font-bold mb-6">Visítanos en El Cerrito</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500 shrink-0 border border-amber-500/20">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white">Dirección</h4>
                    <p className="text-zinc-400 mt-1 leading-relaxed">
                      {BUSINESS_INFO.address}<br/>
                      {BUSINESS_INFO.city}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500 shrink-0 border border-amber-500/20">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white">Teléfono & WhatsApp</h4>
                    <p className="text-zinc-400 mt-1">
                      <a href={`tel:${BUSINESS_INFO.phoneCall}`} className="hover:text-amber-400 transition-colors">
                        {BUSINESS_INFO.phoneFormatted}
                      </a>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Atención rápida por llamada o mensaje</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500 shrink-0 border border-amber-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-white">Horarios de Atención</h4>
                    <p className="text-zinc-400 mt-1">
                      <span className="block font-medium text-zinc-300">Lunes a Sábado:</span>
                      8:00 AM - 8:00 PM
                    </p>
                    <p className="text-zinc-400 mt-1">
                      <span className="block font-medium text-zinc-300">Domingos:</span>
                      8:00 AM - 2:00 PM
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a 
                  href={BUSINESS_INFO.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md"
                >
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Cómo llegar (Google Maps)</span>
                </a>
                <a 
                  href={`tel:${BUSINESS_INFO.phoneCall}`}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-3.5 rounded-full font-bold text-sm transition-all border border-zinc-700"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Llamar ({BUSINESS_INFO.phone})</span>
                </a>
              </div>
            </div>
            
            <div className="relative min-h-[300px] md:h-auto bg-zinc-800 group overflow-hidden">
              <iframe 
                src="https://maps.google.com/maps?q=Carrera%2012%20%238-56,%20El%20Cerrito&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=&amp;output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
              ></iframe>
              {/* Al tocar el mapa, abre directamente Google Maps buscando solo la dirección para ver la ruta */}
              <a 
                href={BUSINESS_INFO.googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 z-10 cursor-pointer block"
                aria-label="Abrir dirección Carrera 12 #8-56 en Google Maps"
              ></a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {BUSINESS_INFO.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/mis-reservas" className="hover:text-amber-500 transition-colors">
              Consultar Mis Reservas
            </Link>
            <a href={`tel:${BUSINESS_INFO.phoneCall}`} className="hover:text-amber-500 transition-colors">
              Tel: {BUSINESS_INFO.phone}
            </a>
            <Link href="/admin" className="text-zinc-600 hover:text-amber-500 transition-colors font-medium">
              Acceso Administrador
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
