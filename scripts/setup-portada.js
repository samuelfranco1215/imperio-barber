const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function setupPortadaAndIcons() {
  const userUploadPath = 'C:/Users/PERSONAL/.gemini/antigravity-ide/brain/7265081b-c520-48ab-900f-94399819bc91/.user_uploaded/media_1791927374875.png';
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Guardar copia directa del logo original
  fs.copyFileSync(userUploadPath, path.join(publicDir, 'logo.png'));

  // 2. Crear Icono de la App (512x512 y 192x192)
  const iconBase = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#18181b" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="110" fill="url(#bg)" />
      <rect x="10" y="10" width="492" height="492" rx="100" fill="none" stroke="url(#gold)" stroke-width="6" />
      <circle cx="256" cy="256" r="200" fill="#ffffff" />
      <circle cx="256" cy="256" r="200" fill="none" stroke="#d97706" stroke-width="6" />
    </svg>
  `);

  const logoForIcon = await sharp(userUploadPath)
    .resize(340, 340, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const icon512 = await sharp(iconBase)
    .composite([{ input: logoForIcon, top: 86, left: 86 }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512);

  const icon192 = await sharp(icon512).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192);

  const appleTouch = await sharp(icon512).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

  // 3. Crear Portada Oficial para Descarga, Instalador PWA y Redes Sociales (1280x720)
  const portadaBase = Buffer.from(`
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pwaGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#451a03" stop-opacity="0.6" />
          <stop offset="60%" stop-color="#18181b" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <linearGradient id="borderGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
        </filter>
      </defs>

      <rect width="1280" height="720" fill="url(#pwaGlow)" />

      <!-- Bordes dorados premium -->
      <rect x="30" y="30" width="1220" height="660" rx="24" fill="none" stroke="url(#borderGold)" stroke-width="2" stroke-opacity="0.5" />
      <rect x="40" y="40" width="1200" height="640" rx="16" fill="none" stroke="#27272a" stroke-width="1" />

      <!-- Esquinas ornamentales -->
      <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="#f59e0b" stroke-width="4" />
      <path d="M 1240 70 L 1240 40 L 1210 40" fill="none" stroke="#f59e0b" stroke-width="4" />
      <path d="M 40 650 L 40 680 L 70 680" fill="none" stroke="#f59e0b" stroke-width="4" />
      <path d="M 1240 650 L 1240 680 L 1210 680" fill="none" stroke="#f59e0b" stroke-width="4" />

      <!-- Tarjeta central con el logo -->
      <rect x="440" y="75" width="400" height="420" rx="28" fill="#ffffff" filter="url(#cardShadow)" />
      <rect x="440" y="75" width="400" height="420" rx="28" fill="none" stroke="url(#borderGold)" stroke-width="5" />

      <!-- Textos oficiales -->
      <text x="640" y="545" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#f59e0b" letter-spacing="6">
        BARBERÍA PREMIUM • RESERVAS ONLINE
      </text>

      <text x="640" y="585" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#a1a1aa" letter-spacing="2">
        El Cerrito, Valle del Cauca • Cra 12 #8-56
      </text>

      <!-- Badges informativos -->
      <g transform="translate(350, 618)">
        <rect x="0" y="0" width="170" height="36" rx="18" fill="#27272a" stroke="#3f3f46" stroke-width="1" />
        <text x="85" y="23" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#e4e4e7">
          Turnos al Instante
        </text>
      </g>
      <g transform="translate(555, 618)">
        <rect x="0" y="0" width="170" height="36" rx="18" fill="#27272a" stroke="#3f3f46" stroke-width="1" />
        <text x="85" y="23" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#e4e4e7">
          Sin Filas ni Esperas
        </text>
      </g>
      <g transform="translate(760, 618)">
        <rect x="0" y="0" width="170" height="36" rx="18" fill="#27272a" stroke="#3f3f46" stroke-width="1" />
        <text x="85" y="23" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#e4e4e7">
          App Web Oficial
        </text>
      </g>
    </svg>
  `);

  const logoForPortada = await sharp(userUploadPath)
    .resize(340, 360, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const portada = await sharp(portadaBase)
    .composite([{ input: logoForPortada, top: 105, left: 470 }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'portada.png'), portada);
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), portada);

  // 4. Captura para móvil PWA (750x1334)
  const mobileBase = Buffer.from(`
    <svg width="750" height="1334" viewBox="0 0 750 1334" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mobGlow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#451a03" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#18181b" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <linearGradient id="mobGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="50%" stop-color="#d97706" />
        </linearGradient>
      </defs>
      <rect width="750" height="1334" fill="url(#mobGlow)" />

      <!-- Tarjeta del Logo -->
      <rect x="125" y="160" width="500" height="520" rx="36" fill="#ffffff" />
      <rect x="125" y="160" width="500" height="520" rx="36" fill="none" stroke="url(#mobGold)" stroke-width="6" />

      <!-- Info -->
      <text x="375" y="750" text-anchor="middle" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="#f59e0b" letter-spacing="4">
        IMPERIO BARBER
      </text>
      <text x="375" y="795" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#d4d4d8" letter-spacing="2">
        BARBERÍA PREMIUM
      </text>
      <text x="375" y="835" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="400" fill="#a1a1aa">
        El Cerrito, Valle del Cauca
      </text>

      <!-- Simulación de botón de reserva en app -->
      <rect x="75" y="920" width="600" height="260" rx="24" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
      <text x="110" y="980" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#ffffff">
        Reserva tu turno online
      </text>
      <text x="110" y="1020" font-family="system-ui, sans-serif" font-size="18" font-weight="400" fill="#a1a1aa">
        Cortes Clásicos, Fades, Barba y Combos
      </text>
      <rect x="110" y="1060" width="530" height="80" rx="40" fill="#d97706" />
      <text x="375" y="1110" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#09090b">
        Agendar Cita en Segundos
      </text>
    </svg>
  `);

  const logoMobile = await sharp(userUploadPath)
    .resize(420, 440, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const mobileScreen = await sharp(mobileBase)
    .composite([{ input: logoMobile, top: 200, left: 165 }])
    .png()
    .toBuffer();

  const screenDir = path.join(publicDir, 'screenshots');
  if (!fs.existsSync(screenDir)) fs.mkdirSync(screenDir, { recursive: true });
  fs.writeFileSync(path.join(screenDir, 'cover-wide.png'), portada);
  fs.writeFileSync(path.join(screenDir, 'cover-mobile.png'), mobileScreen);

  console.log('LISTO: Todas las imagenes creadas con exito en public/');
}

setupPortadaAndIcons().catch(err => {
  console.error('Error al generar imágenes:', err);
  process.exit(1);
});
