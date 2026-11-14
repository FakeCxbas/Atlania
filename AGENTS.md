# Directrices del Proyecto: NASA Space Apps Challenge (Guayaquil)

Este archivo define las reglas de arquitectura, diseño visual, rigor científico y economía de tokens para todos los agentes que trabajen en **NasaAppChallenge**.

---

## 1. Contexto del Desafío
**Reto**: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.
**Objetivo**: Utilizar datos abiertos de la NASA (Tierra, Luna y Marte) para identificar, puntuar y caracterizar nuevos análogos terrestres adecuados para probar hábitats, rovers y equipamiento espacial, presentándolos mediante un mapa o herramienta visual interactiva.

### Enfoque Científico y Diferenciador
- **Índice de Similitud Análoga (ASI)**: Cálculo cuantitativo cruzando topografía (pendientes, rugosidad), geología/mineralogía (basalto, regolito, óxidos) y ambiente extremo (amplitud térmica, aridez, radiación UV).
- **Sitios de Referencia Extraterrestre**: Cráter Shackleton / Polo Sur Lunar (Artemis), Mare Tranquillitatis (tubos de lava), Cráter Jezero y Monte Olimpo (Marte).
- **Análogos Regionales Clave**: Destacar sitios de Ecuador y Sudamérica como los tubos de lava basáltica de Galápagos (análogos de bases lunares subterráneas) y campos volcánicos de altura (Chimborazo / Cotopaxi), además de referentes globales.

---

## 2. Estética y Diseño de Interfaz (Mission Control / Aerospace HUD)
- **Identidad Visual**: Estética técnica aeroespacial oscura (*Deep Space Telemetry*), evitando plantillas genéricas de SaaS blanco o tarjetas planas.
- **Paleta Base**:
  - Fondo principal: `#060913` (Espacio profundo)
  - Superficies/Paneles: `#0D1424` con bordes sutiles `border-slate-800/80` y `backdrop-blur-md`
  - Acento primario (Telemetría/Tierra): `#06B6D4` (Cian técnico)
  - Acento Marte: `#E07A5F` (Óxido marciano sobrio)
  - Acento Luna: `#94A3B8` (Regolito lunar)
- **Tipografía Numérica**: Todas las coordenadas (`lat`, `lon`), elevaciones, porcentajes de similitud ASI y métricas ambientales deben usar `tabular-nums font-mono`.
- **Visualización Cartográfica**: Priorizar mapas interactivos fluidos (`maplibre-gl` / `deck.gl` / `three` o vista comparativa dividida Tierra vs. Luna/Marte).

---

## 3. Reglas de Economía de Tokens (Hackathon 48h)
1. **Respuestas directas y concisas**: Evitar explicaciones extensas o resúmenes redundantes tras cada cambio. Ir directo al código y verificación.
2. **Lectura económica de archivos**: Usar rangos de líneas (`StartLine`/`EndLine`) o búsqueda previa (`rg`/`grep`) antes de abrir archivos completos.
3. **Cambios atómicos**: Editar bloques específicos con `replace_file_content` en lugar de reescribir archivos enteros sin necesidad.
4. **Cero emojis de IA** en código, commits, UI o documentación.

---

## 4. Orquestación Automática Multi-Modelo (Antigravity + Codex)
Para aprovechar al máximo los modelos más potentes de ambos ecosistemas y estirar todas las cuotas durante el hackathon, **Antigravity debe decidir automáticamente** tanto la herramienta como el modelo adecuado:

### A. Tareas que ejecuta Antigravity (UI/UX, Mapas 3D y Navegador)
- Diseño visual *Mission Control*, componentes React/Tailwind, `frontend-design` y `modern-component-patterns`.
- Integración visual de mapas (`maplibre-gl` / `three.js`), gráficas y depuración en vivo (`chrome-devtools`).
- Para subagentes internos de Antigravity: usar `flash` en búsquedas/lecturas rápidas y `pro` (o el modelo principal activo: `Hydrogen`, `Argon`, `3.8`, `Claude`) en diseño y arquitectura UI.

### B. Tareas que Antigravity DEBE delegar automáticamente a Codex (ChatGPT Plus)
Ejecuta Codex mediante `run_command` eligiendo el modelo según la complejidad:
1. **Arquitectura compleja, algoritmos ASI, cálculo científico y backend crítico (`gpt-6-astra`)**:
   ```bash
   codex exec -m gpt-6-astra --full-auto "<tarea compleja>"
   ```
2. **Scripts rápidos en Python, parsing de GeoJSON/NASA POWER API y tests (`gpt-6-luna`)**:
   ```bash
   codex exec -m gpt-6-luna --full-auto "<tarea rápida o script>"
   ```
3. **Auditoría y revisión de bugs antes de presentar (`codex review`)**:
   ```bash
   codex review
   ```

### C. Sincronización Automática vía Engram
- Tanto Antigravity como Codex comparten la base persistente de **Engram** (`~/.engram/engram.db`).
- Tras completar un hito o una delegación importante a Codex, registra la decisión clave con `mem_save` (proyecto `NasaAppChallenge`) para mantener chats cortos y recuperar contexto instantáneamente al abrir nuevas conversaciones.

