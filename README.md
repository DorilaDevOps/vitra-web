# VitraWeb v2.0

Sitio web de **Vitra** — lentes de segunda mano originales, restaurados y de marca. Montevideo, Uruguay.
Tienda física en Galería Libertador, 18 de Julio 921 esq. Convención.

- **URL oficial:** https://vitrasty.netlify.app/
- **Repositorio:** https://github.com/DorilaDevOps/vitra-web (rama `main`)
- **Deploy:** automático en Netlify al hacer push a `main`

---

## Contenido

| Página | Archivo | Indexable |
|---|---|---|
| Tienda (home, catálogo, modal de detalle) | `index.html` | `index, follow` |
| Panel de administración (Apps Script + Google Drive) | `vitra-panel.html` | `noindex, nofollow` |
| Disclaimer legal | `disclaimer.html` | `noindex, nofollow` |
| Créditos de desarrollo (KikiriyaDevOps) | `KikiriyaDevOps.html` | `index, follow` |
| Backend en Google Apps Script | `apps-script/Code.gs` | — |

---

## Funcionalidades

- **Catálogo de productos** en grilla responsive con:
  - Búsqueda por texto, filtros por marca, precio y chips de categoría.
  - Contador de resultados, estado vacío y botón de reset.
- **Modal de detalle de producto** (imagen, descripción, precio y CTA de consulta):
  - Abre desde el botón de la tarjeta; cierra con ✕, overlay, tecla `Esc` o el CTA.
  - Focus trap (accesibilidad) y bloqueo de scroll de fondo.
- **Jerarquía tipográfica** con etiquetas *eyebrow* y fuentes Playfair Display + Poppins.
- **Horarios de contacto** actualizados, incluido el domingo (10:30–14:00, Feria Tristán Narvaja).
- **Admin (`vitra-panel`)**: alta de productos con categoría validada e imágenes subidas a Google Drive mediante Apps Script.

---

## SEO implementado

- **Structured Data JSON-LD** (`@graph`):
  - `WebSite`
  - `Store` (local business): dirección, geolocalización, mapa, teléfono, email, horarios (Mon–Fri 10:30–18:00, Sat–Sun 10:30–14:00), moneda UYU, métodos de pago, redes sociales.
  - `AggregateRating` **5.0/4** con 4 reseñas reales de la página.
  - `ItemList` con 4 `Product` (precio en UYU, `availability: InStock`, `itemCondition: RefurbishedCondition`, brand, seller).
  - Rich result detectado: **Merchant listings** (verificado con Google Rich Results Test, sin errores críticos).
- **Meta description** en las 4 páginas (todas ≤ 150 caracteres).
- **Alt text** descriptivo en todas las imágenes de producto (helpers `toTitleCase`, `productName`, `buildAltText`) y `aria-label` en los botones.
- **Og / Twitter cards**: `og:image` dedicada de **1200×630** (`logo_icons/og-vitra.jpg`) con diseño de marca, más `og:image:alt`.
- **Favicons** correctos: 16/32/48 + `apple-touch-icon` 180×180.
- **Canonical y URLs absolutas** al dominio oficial.
- **Robots**: `noindex` en panel y disclaimer; `index, follow` en tienda y créditos.

## Optimización de imágenes

- **21 productos** convertidos de PNG a **WebP** (misma dimensión, calidad 80): el total de `imgs/` bajó de ~8.8 MB a ~450 KB (**~80% menos**).
- **Logo del header** en WebP con transparencia: `logo_vitra-removebg.webp` (148 KB → ~15 KB), mejora el LCP.
- La API de Google Drive sirve imágenes vía `sz=w1200`.

## Estructura del proyecto

```
apps-script/Code.gs     Backend Apps Script (catálogo, categorías, imágenes en Drive)
imgs/                   Imágenes de productos (.webp)
logo_icons/             Logo, favicons, apple-touch-icon y og:image
index.html              Tienda (todo el frontend en un solo archivo)
vitra-panel.html        Panel de administración
disclaimer.html         Términos legales
KikiriyaDevOps.html     Créditos de desarrollo
```

## Flujo de deploy

1. Realizar cambios en el repo local.
2. `git add -A && git commit -m "mensaje"` y `git push origin main`.
3. Netlify detecta el push y despliega automáticamente en `https://vitrasty.netlify.app/`.
4. Verificar en vivo (HTTP 200, HTML actualizado, assets).

## Notas de desarrollo

- Las imágenes del catálogo se reemplazan en el backend (Apps Script), no en el HTML estático; el sitio carga desde la API con **fallback al catálogo local** si la API no responde (por ejemplo, al ser rastreado por Googlebot).
- Herramientas de optimización de imágenes (sharp) viven fuera del repo, en un directorio temporal local.
