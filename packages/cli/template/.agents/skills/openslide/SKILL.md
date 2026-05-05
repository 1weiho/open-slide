---
name: openslide
description: Gestione completa open-slide — Docker, creazione slide, authoring, commenti, temi, export. Usare per qualsiasi operazione sulle presentazioni. Trigger: "slide", "presentazione", "deck", "openslide", "open-slide", "/openslide", "crea slide", "modifica slide".
---

# open-slide — Skill unificata

open-slide è un framework per slide React su canvas 1920×1080. Il progetto vive in Docker con volume mount.

## Setup Docker

```bash
# Avvio
cd C:\Users\Infer\projects\openslide && docker compose up -d
# Stop
docker compose down
# Riavvio (dopo nuove slide o modifiche)
docker compose down && docker compose up -d
# Rebuild (dopo package.json)
docker compose up -d --build
# Log
docker logs openslide-open-slide-1 --tail 50
# Shell nel container
docker exec openslide-open-slide-1 sh -c "<cmd>"
# Export statico
docker exec openslide-open-slide-1 sh -c "npx open-slide build"
```

URL: `http://localhost:5173/s/<slide-id>` (rotta diretta, sempre funzionante)
Container: `openslide-open-slide-1`, `restart: unless-stopped`

---

## Workflow: Creare un nuovo deck

### Step 1 — Raccogliere requisiti

Prima di scrivere codice, chiedere via `AskUserQuestion`:
1. **Topic** — di cosa parla il deck
2. **Aesthetic** — proporre 3 direzioni visive (palette + vibe)
3. **Numero pagine** — quante slide
4. **Densità testo** — molto/poco

### Step 2 — Creare cartella e file

```bash
mkdir -p C:\Users\Infer\projects\openslide\slides\<kebab-case-id>\assets
```

Scrivere `C:\Users\Infer\projects\openslide\slides\<id>\index.tsx` seguendo le regole sotto.

### Step 3 — Riavviare e condividere

```bash
cd C:\Users\Infer\projects\openslide && docker compose down && docker compose up -d
```

Condividere `http://localhost:5173/s/<id>`.

### Step 4 — Iterare

L'utente può usare l'inspector nel browser per commentare elementi. Poi `/openslide` per applicare i commenti (vedi sezione Apply Comments).

---

## Regole OBBLIGATORIE per slides

### File contract

- Entry point: `slides/<id>/index.tsx`
- Assets: `slides/<id>/assets/` — importare con `import x from './assets/file.jpg'`
- **Nessuna dipendenza esterna** — solo `react` + web API
- Non toccare `package.json`, `open-slide.config.ts`, o altre slide
- Il file DEVE esportare:
  - `design: DesignSystem` — palette, font, type scale (per Design panel)
  - `meta: SlideMeta` — titolo del deck
  - `default: Page[]` — array di componenti pagina

### Canvas 1920×1080

- Usare **pixel assoluti** per font-size, padding, posizionamento. No `rem`, no `vw`/`vh`
- Il root di ogni pagina DEVE riempire `width: '100%', height: '100%'`
- **Il canvas NON scrolla**. Oltre 1080px = tagliato via

### Vertical budget

**Altezza utile** = `1080 - padding_top - padding_bottom`. Con 120px padding = **840px**.

Prima di scrivere, calcolare:
```
Elemento = font_size × line_height × numero_righe
Totale = somma elementi + gap + 2×padding
Se Totale > 1080 → SPEZZARE in due pagine
```

**Regole:**
- Un heading + body OPPURE heading + ≤5 bullet. Non entrambi
- Un bullet NON deve andare a capo — se va, accorciare o fare pagina separata
- Mai `overflow: auto/scroll/hidden` per nascondere overflow
- Se si riduce font sotto 28px o padding sotto 100px → spezzare

### Type scale

| Elemento | Dimensione |
|----------|-----------|
| Hero title | 140–200px |
| Section heading | 80–120px |
| Page heading | 56–80px |
| Body text | 32–44px |
| Caption/label | 22–28px |

Spazio: padding 100–160px, line-height 1.2 headings / 1.5–1.7 body, gap 32–64px.

### Design system

```tsx
export const design: DesignSystem = {
  palette: { bg: '#0a0c10', text: '#e8eaed', accent: '#f27907' },
  fonts: {
    display: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 140, body: 32 },
  radius: 12,
};
```

Usare `var(--osd-bg)`, `var(--osd-text)`, `var(--osd-accent)`, ecc. per proprietà CSS (update live dal Design panel). Usare `design.palette.X` solo per aritmetica JS.

### Palette secondaria (best practice)

```tsx
const p = {
  bg: design.palette.bg,
  text: design.palette.text,
  accent: design.palette.accent,
  surface: '#141414',      // card, pannelli
  surfaceHi: '#1c1c1c',    // hover, selected
  surfaceMax: '#242424',    // evidenza
  textSoft: '#b0b5c0',     // secondario
  muted: '#6b7080',        // debole
  dim: '#3a3e4a',          // bordi
  border: 'rgba(255,255,255,0.06)',
  borderBright: 'rgba(255,255,255,0.12)',
  accentSoft: '<accent chiaro>',
  accent2: '<accent scuro>',
  mono: '"JetBrains Mono", monospace',
};
```

### Animazioni CSS

```tsx
const styles = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px) }
    to   { opacity:1; transform:translateY(0) }
  }
  .fadeUp { opacity:0; animation: fadeUp .8s cubic-bezier(.2,.7,.2,1) forwards }
`;
const Styles = () => <style>{styles}</style>;
```

Usare `className="fadeUp"` con `animationDelay` per sequenza.

### Layout comuni

**Full-center:** `position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center'`
**Two-column:** `padding:'120px 140px', display:'flex', gap:60` + `flex:1` e `width:400`
**Grid:** `display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24`

### Assets

```tsx
import photo from './assets/photo.jpg';
<img src={photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
```

Loghi brand: pannello assets nel browser o svgl.app.

---

## Apply Comments (inspector)

L'inspector nel browser permette di cliccare elementi e lasciare commenti. I commenti diventano marker nel codice.

### Formato marker

```
{/* @slide-comment id="c-<8hex>" ts="<ISO>" text="<base64url>" */}
```

`text` è base64url di JSON: `{"note":"cambia colore"}`

### Procedura

1. Scansionare `slides/<id>/index.tsx` con regex:
   ```
   /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_\-]+={0,2})"\s*\*\/\}/g
   ```
2. Decodare base64url: `Buffer.from(text.replace(/-/g,'+').replace(/_/g,'/') + pad, 'base64').toString('utf8')`
3. Leggere il contesto attorno al marker per capire l'elemento target
4. Applicare la modifica richiesta
5. Rimuovere il marker
6. Processare in ordine inverso di riga (bottom-up) per non invalidare i numeri di riga
7. Verificare zero marker rimasti

---

## Themes

Temi in `themes/<id>.md` — descrivono palette, typography, layout. Se un tema esiste, la slide lo rispetta.

Per creare un tema: leggere i colori/font da una slide esistente o da un'immagine e scrivere un `.md` in `themes/`.

---

## Export

**HTML statico:** `docker exec openslide-open-slide-1 sh -c "npx open-slide build"` → `dist/`
**PDF:** Browser → Present mode → Stampa/PDF
**Deploy:** Contenuto di `dist/` su Vercel, Netlify, Cloudflare Pages, Zeabur

---

## Anti-patterns

- Wall of text (>40 parole) → spezzare
- Overflow oltre 1080px → spezzare
- `overflow: auto/scroll/hidden` → mai
- Font sotto 28px → illeggibile su proiettore
- Palette inconsistente tra pagine
- Dipendenze esterne → vietate
- File fuori `slides/<id>/` → non toccare

---

## Self-review (prima di consegnare)

- [ ] `export default` è un `Page[]` non vuoto
- [ ] Ogni pagina riempie `100% × 100%`
- [ ] Contenuto dentro padding (no text ai bordi)
- [ ] Per ogni pagina: somma altezze + gap + 2×padding ≤ 1080px
- [ ] Nessun bullet va a capo
- [ ] Palette coerente tra tutte le pagine
- [ ] `export const design: DesignSystem` dichiarato e usato via `var(--osd-X)`
- [ ] Assets importati da `./assets/`
- [ ] Zero marker `@slide-comment` rimasti
- [ ] Niente fuori da `slides/<id>/` modificato
