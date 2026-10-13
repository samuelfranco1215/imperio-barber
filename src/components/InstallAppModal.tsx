"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada o es standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Capturar evento PWA de Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Escuchar apertura desde eventos personalizados
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener("open_install_modal", handleOpenModal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open_install_modal", handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Botón flotante accesible o disparador */}
      <div className="fixed bottom-24 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-[0_4px_20px_rgba(217,119,6,0.45)] hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm border border-amber-300/40"
          title="Descargar e instalar App"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span className="font-extrabold tracking-wide">Descargar App</span>
        </button>
      </div>

      {/* MODAL CON LA IMAGEN DE PORTADA */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* IMAGEN DE PORTADA OFICIAL */}
            <div className="relative w-full h-48 sm:h-56 bg-zinc-950 border-b border-zinc-800">
              <Image
                src="/portada.png"
                alt="Imperio Barber Portada Oficial"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-white p-1 border-2 border-amber-500 shadow-lg shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo Imperio Barber"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                    Imperio Barber
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    App Oficial • El Cerrito, Valle
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENIDO DEL MODAL */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>Instala la App en tu Celular</span>
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Descárgala directamente sin pasar por Play Store o App Store. No ocupa memoria, abre al instante y te permite reservar tu turno en segundos.
                </p>
              </div>

              {/* Beneficios */}
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Acceso en 1 toque</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Sin filas ni esperas</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Historial de citas</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>100% gratuita</span>
                </div>
              </div>

              {/* ACCIÓN SEGÚN DISPOSITIVO */}
              {isIOS ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-amber-400">Instrucciones para iPhone / iPad:</p>
                  <div className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>1. Toca el botón <strong>Compartir</strong> en la barra de Safari.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>2. Desliza hacia abajo y elige <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</span>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,119,6,0.35)] transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Ahora en mi Celular</span>
                </button>
              ) : isInstalled ? (
                <div className="text-center py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-semibold text-xs sm:text-sm">
                  ¡La aplicación ya está instalada en tu dispositivo!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-400 leading-relaxed">
                    <p className="text-zinc-300 font-medium mb-1">En tu navegador móvil:</p>
                    <p>Toca los tres puntos del menú del navegador y selecciona <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-2xl text-xs sm:text-sm transition-all"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
