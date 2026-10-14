-- ==============================================================================
-- SCRIPT DE BASE DE DATOS PARA IMPERIO BARBER (SUPABASE)
-- Copia y pega todo este script en el "SQL Editor" de tu panel de Supabase y dale a RUN.
-- ==============================================================================

-- 1. TABLA: SERVICIOS
CREATE TABLE IF NOT EXISTS public.servicios (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA: RESERVAS
CREATE TABLE IF NOT EXISTS public.reservas (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id BIGINT,
  service_name TEXT,
  price NUMERIC DEFAULT 0,
  date TEXT NOT NULL, -- Formato YYYY-MM-DD
  time TEXT NOT NULL, -- Formato HH:mm
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'cancelled'
  payment_method TEXT DEFAULT 'cash', -- 'cash' | 'transfer'
  cancellation_reason TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA: HORARIOS BLOQUEADOS
CREATE TABLE IF NOT EXISTS public.bloqueos_horario (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- Formato YYYY-MM-DD
  start_time TEXT NOT NULL, -- Formato HH:mm
  end_time TEXT NOT NULL, -- Formato HH:mm
  reason TEXT DEFAULT 'Horario reservado por el barbero',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA: CONFIGURACIÓN GENERAL (Modo Pausa de Reservas, Horarios de Apertura)
CREATE TABLE IF NOT EXISTS public.configuracion (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Permite que la app (cliente y admin) lea y escriba con la Anon Key pública.
-- ==============================================================================

ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueos_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas para servicios
DROP POLICY IF EXISTS "Acceso total anon servicios" ON public.servicios;
CREATE POLICY "Acceso total anon servicios" ON public.servicios FOR ALL USING (true) WITH CHECK (true);

-- Políticas para reservas
DROP POLICY IF EXISTS "Acceso total anon reservas" ON public.reservas;
CREATE POLICY "Acceso total anon reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);

-- Políticas para bloqueos
DROP POLICY IF EXISTS "Acceso total anon bloqueos" ON public.bloqueos_horario;
CREATE POLICY "Acceso total anon bloqueos" ON public.bloqueos_horario FOR ALL USING (true) WITH CHECK (true);

-- Políticas para configuración
DROP POLICY IF EXISTS "Acceso total anon configuracion" ON public.configuracion;
CREATE POLICY "Acceso total anon configuracion" ON public.configuracion FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- TIEMPO REAL (REALTIME)
-- Permite que los cambios se reflejen inmediatamente en otros celulares sin recargar
-- ==============================================================================

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.servicios;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bloqueos_horario;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- ==============================================================================
-- DATOS INICIALES (SEMILLA)
-- Carga los servicios oficiales de Imperio Barber y la configuración base
-- ==============================================================================

INSERT INTO public.servicios (id, name, description, price, duration, active)
VALUES
  (1, 'Corte Clásico', 'Corte tradicional a tijera o máquina, perfilado de patillas y lavado refrescante.', 25000, 30, true),
  (2, 'Corte Fade / Degradado', 'Corte degradado moderno (skin fade, mid fade o taper) con terminaciones milimétricas y styling.', 30000, 40, true),
  (3, 'Arreglo & Perfilado de Barba', 'Arreglo y perfilado de barba.', 18000, 25, true),
  (4, 'Combo Imperio (Corte + Barba)', 'Nuestra experiencia insignia. Corte degradado o clásico con arreglo de barba completo y toalla caliente.', 42000, 60, true),
  (5, 'Corte Niño', 'Corte con paciencia y estilo para los consentidos de la casa (hasta los 12 años).', 20000, 30, true),
  (7, 'Perfilado de Cejas con Navaja', 'Diseño y limpieza simétrica de cejas masculinas con navaja y gel calmante.', 8000, 15, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  active = EXCLUDED.active;

INSERT INTO public.configuracion (key, value)
VALUES
  ('service_status', '{"isPaused": false, "pauseMessage": "Por el momento no hay servicio disponible. Intenta más tarde."}'::jsonb),
  ('schedule', '{"mondayToSaturday": {"open": "08:00", "close": "20:00", "isOpen": true}, "sunday": {"open": "08:00", "close": "14:00", "isOpen": true}, "slotDurationMinutes": 30, "toleranceMinutes": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;
