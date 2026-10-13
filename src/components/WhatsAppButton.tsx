"use client";

import { useState } from "react";
import { BUSINESS_INFO, getGeneralWhatsAppUrl } from "@/data/barberStore";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip / Burbuja flotante informativa */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 text-zinc-100 text-xs py-2 px-3.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-right-3 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">¿Dudas? Escríbenos al WhatsApp</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-zinc-400 hover:text-white ml-1 p-0.5"
            aria-label="Cerrar mensaje"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botón WhatsApp Flotante */}
      <a
        href={getGeneralWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Escribir por WhatsApp a ${BUSINESS_INFO.name} al ${BUSINESS_INFO.phone}`}
        className="relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Anillo de pulso sutil */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-30 group-hover:animate-ping pointer-events-none"></span>

        {/* Ícono de WhatsApp SVG oficial */}
        <svg
          className="w-7 h-7 md:w-8 md:h-8 fill-current relative z-10 transition-transform group-hover:rotate-6"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.507 14.307l-.009.075c-.238-.12-1.406-.694-1.624-.773-.219-.079-.378-.119-.537.12-.159.239-.615.773-.754.932-.139.159-.278.179-.516.06-.239-.12-1.008-.372-1.92-1.185-.709-.633-1.188-1.415-1.328-1.654-.139-.239-.015-.368.105-.487.108-.107.239-.278.358-.418.12-.139.159-.239.239-.398.079-.159.039-.298-.02-.418-.06-.119-.537-1.294-.736-1.773-.194-.466-.391-.403-.537-.411-.139-.007-.298-.009-.457-.009-.159 0-.418.06-.637.299-.219.239-.836.817-.836 1.992 0 1.175.856 2.31 .975 2.469.12.159 1.685 2.572 4.082 3.607.57.246 1.016.393 1.363.504.573.182 1.094.156 1.506.095.46-.069 1.406-.575 1.605-1.13.199-.556.199-1.032.139-1.131-.059-.099-.219-.159-.457-.278zm-5.498 7.393c-2.008 0-3.875-.595-5.441-1.619l-.39-.253-4.045 1.061 1.08-3.943-.255-.406a9.855 9.855 0 01-1.517-5.24C1.441 5.922 6.023 1.34 11.666 1.34c2.735 0 5.306 1.065 7.24 3 1.934 1.934 2.999 4.505 2.999 7.24 0 5.642-4.582 10.22-10.224 10.22zm8.563-17.44C18.286 1.974 15.111.74 11.666.74 5.69.74.84 5.59.84 11.566c0 1.91.498 3.774 1.445 5.414L.5 23.5l6.711-1.761a10.77 10.77 0 005.155 1.307h.005c5.975 0 10.826-4.85 10.826-10.826 0-2.895-1.127-5.617-3.125-7.66z" />
        </svg>

        {/* Notificación móvil pequeña */}
        <span className="sm:hidden absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-zinc-950 rounded-full"></span>
      </a>
    </div>
  );
}
