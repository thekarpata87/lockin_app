# DESIGN.md — BLOQUE

App web personal (PWA) para iPhone. Plan de pérdida de grasa: alimentación por bloques, gym, cardio en casa y progreso.
Nombre de trabajo: **BLOQUE**, porque el plan de alimentación se basa en bloques (equivalentes) y la interfaz se arma en bloques de retícula.

---

## 1. Dirección

**Referencia:** labs.chaingpt.org (capturas en el proyecto).

**Lo que tomamos de la referencia:**
- La retícula visible con líneas finas de 1 px, que también se ven en las celdas vacías y dan textura de "plano técnico".
- Bloques planos que se tocan entre sí y se separan con líneas, no con espacios ni sombras.
- Radio 0 en todo. Los chaflanes solo aparecen en las acciones primarias.
- Una fuente monoespaciada para todo el texto, y una display geométrica y "cortada" para títulos y cifras.
- Naranja como único acento.
- Marcas de esquina tipo visor (⌜ ⌝ ⌞ ⌟) para indicar el elemento activo.
- Pequeños cuadros ■ como marcadores.
- Celdas de estadística con número grande arriba y etiqueta chica abajo.
- Pestañas tipo "tag" pegadas a la esquina superior de una tarjeta.
- Celdas de flecha que se vuelven naranjas al estar activas.

**Lo que NO tomamos:** su logo, su nombre, sus renders 3D ni sus ilustraciones. No hay imágenes decorativas; el único "objeto" visual es la retícula misma.

**Contexto de uso real:**
- 5:15 am, poca luz: el modo oscuro debe ser excelente.
- En el gym, sin señal, con las manos sudadas y una sola mano libre: objetivos táctiles grandes, mínimos pasos para registrar una serie.
- En la cocina el domingo: pantalla encendida, temporizadores y texto legible a distancia de brazo.

**Dónde va la audacia (un solo lugar):** la **cifra display**. Es el peso actual en Progreso, el número de serie y el peso en Gym, y la cuenta regresiva en el temporizador. Es enorme, en la fuente display y alineada a la retícula. Todo lo demás es callado y disciplinado.

**La idea propia de esta app:** los bloques del plan de alimentación se dibujan como **cuadros literales en la retícula**. "Proteína ×3" son tres celdas cuadradas, y comer es llenar celdas de naranja. El sistema visual y el sistema nutricional son la misma cosa.

---

## 2. Color

Tokens en `:root`. El modo oscuro se aplica con `@media (prefers-color-scheme: dark)` y también con un override manual `[data-theme="dark"|"light"]` desde Ajustes.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#E4E4E2` | `#0D0D0C` | Fondo de página y celdas "vacías" de la retícula |
| `--surface` | `#F6F6F4` | `#171716` | Bloques con contenido |
| `--line` | `#C8C8C5` | `#2C2C2A` | Líneas de retícula, bordes de 1 px |
| `--ink` | `#141413` | `#EDEDEA` | Texto principal, cifras display |
| `--ink-muted` | `#6A6A66` | `#8C8C87` | Etiquetas, texto secundario |
| `--accent` | `#FF6A14` | `#FF6A14` | Acción primaria, activo, completado |
| `--on-accent` | `#141413` | `#141413` | Texto sobre naranja |
| `--inverse` | `#141413` | `#EDEDEA` | Bloques invertidos (tag activo, celda de flecha) |
| `--on-inverse` | `#F6F6F4` | `#141413` | Texto sobre bloque invertido |
| `--danger` | `#C42B1C` | `#FF5A47` | Solo errores de sincronización y borrado |

**Reglas:**
- El naranja se usa **solo** para cuatro cosas: acción primaria, estado activo o seleccionado, bloque completado y marcadores ■ de esquina.
- **Nunca** texto naranja chico sobre fondo claro (el contraste es de aproximadamente 2.8:1). Sobre naranja, el texto siempre va en `--on-accent` (oscuro), con contraste de aproximadamente 7:1.
- No hay gradientes, sombras ni desenfoques.
- `body` lleva `background: var(--bg)` explícito.

---

## 3. Tipografía

| Rol | Fuente | Pesos | Uso |
|---|---|---|---|
| Display | **Tektur** (OFL). Alternativa si algo falla: Chakra Petch | 700, 800 | Títulos de pantalla y cifras grandes |
| Texto y datos | **JetBrains Mono** (OFL) | 400, 500, 700 | Todo lo demás |

- Las fuentes van **auto-hospedadas** con `@fontsource/tektur` y `@fontsource/jetbrains-mono`, incluidas en el precache del service worker. **No usar el CDN de Google Fonts**, porque la app debe funcionar sin conexión.
- **Verificar acentos en mayúsculas en la display:** MIÉRCOLES, CENA, COLACIÓN, AÑADIR, SÁBADO. Si Tektur falla en algún glifo, cambiar a Chakra Petch.
- `font-variant-numeric: tabular-nums` en todas las cifras.
- Stack de respaldo: `Tektur, "Chakra Petch", ui-monospace, monospace` y `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.

**Escala (móvil, en px: tamaño / interlineado):**

| Token | Tamaño | Interlineado | Fuente | Uso |
|---|---|---|---|---|
| `--t-hero` | 96 | 0.88 | Display 800 | Cifra protagonista (peso, cuenta regresiva) |
| `--t-display` | 52 | 0.92 | Display 800 | Título de pantalla: HOY, GYM, PROGRESO |
| `--t-number` | 34 | 1.0 | Display 700 | Cifras de celdas de estadística |
| `--t-title` | 20 | 1.25 | Mono 500 | Títulos de sección y nombres de receta o ejercicio |
| `--t-body` | 16 | 1.45 | Mono 400 | Cuerpo. **Mínimo para inputs** (evita el zoom de iOS) |
| `--t-label` | 13 | 1.35 | Mono 400 | Etiquetas bajo cifras y metadatos |
| `--t-micro` | 11 | 1.3 | Mono 500 | Índices de esquina (01/07). Nunca para información crítica |

- La display lleva letter-spacing de −0.02em, siempre en mayúsculas.
- Los botones van en mono 15 px / 500, en mayúsculas, con +0.04em.
- **Mayúsculas solo en** títulos display, botones y tags de estado. Las etiquetas de sección van en oración, precedidas de ■ (por ejemplo, "■ Comidas de hoy"), igual que en la referencia.
- Alineación: todo a la izquierda. Las cifras dentro de las celdas de estadística también van a la izquierda. No se centra nada salvo el temporizador.

---

## 4. Retícula y espaciado

- **Base de 4 px.** Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Móvil (~390 px):** 4 columnas, **sin gutter**. Las celdas se tocan y se separan con líneas de 1 px (`--line`).
- **Marco:** margen lateral de 8 px y un contenedor con borde de 1 px. Las líneas verticales de las 4 columnas se dibujan en el fondo del contenedor, de arriba a abajo, aunque una fila no las use. Así se logra la textura de la referencia. Se implementa con un `background-image` de `linear-gradient` de 1 px repetido cada 25%, o con un pseudo-elemento.
- **Anchos de celda típicos:** 4/4 (fila completa), 2/4 (estadística), 1/4 (botón de icono o flecha), 3/4 + 1/4 (fila con acción a la derecha).
- **Padding interno de celda:** 16 px. Las celdas de estadística usan 12 px arriba y 16 px a los lados.
- **Alturas mínimas:**
  - Fila táctil: 56 px.
  - Botón primario: 56 px.
  - Stepper: 64 px.
  - Tab bar: 64 px más `env(safe-area-inset-bottom)`.
- **Pantallas anchas (iPad o Mac):** columna máxima de 480 px centrada, con la retícula de fondo visible a los lados.

---

## 5. Formas y detalles

- **Radio 0 en todo.**
- **Chaflán**, solo en el botón primario y en la celda de flecha activa:
  `clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);`
- **Marcas de visor (`BracketFrame`):** cuatro esquinas en L de 8×8 px y trazo de 1.5 px.
  - En reposo: `--ink-muted`.
  - Activo: `--accent`.
  - Se usan para la pestaña activa del tab bar, el ejercicio en curso, el foco de teclado y el marco del temporizador.
- **Marcador ■:** cuadro de 6×6 px.
  - En `--ink` antes de cada etiqueta de sección.
  - En `--accent` en las esquinas del bloque protagonista de cada pantalla (como los cuatro ■ naranjas del hero de la referencia).
- **Iconos:** `lucide-react`, trazo de 1.5 y 20 px.
  - El check de completado es propio: un trazo grueso y anguloso naranja, como el de la lista "AI / DeFi" de la referencia.
  - Las flechas van solas en su celda de 1/4, nunca pegadas al texto de un botón.
- No hay ilustraciones, fotos ni emojis en la interfaz.

---

## 6. Componentes

| Componente | Descripción y estados |
|---|---|
| `AppFrame` | Contenedor con borde, retícula de fondo y safe areas. |
| `ScreenHeader` | Fila 1: fecha a la izquierda y `SyncBadge` a la derecha (mono 13). Fila 2: título display. |
| `TabBar` | 5 celdas iguales (HOY · COMIDA · GYM · CASA · PROGRESO) con icono y etiqueta mono 11. La activa lleva `BracketFrame` naranja y texto `--ink`; las inactivas, `--ink-muted`. Fondo sólido `--surface` con línea superior. |
| `SectionLabel` | ■ más texto mono 13 en oración. |
| `StatCell` | Cifra `--t-number` arriba y etiqueta `--t-label` muted abajo. Se agrupa en `StatGrid` de 2×2 con líneas internas. |
| `CardTab` | Tag pegado al borde superior izquierdo de una tarjeta (mono 13, borde de 1 px). Activo: invertido. Ejemplos: "Meal prep", "Congelable", "Fresco". |
| `BlockRow` | Grupo de alimento a la izquierda (Proteína), N celdas cuadradas de 28 px a la derecha y el contador "2/3". Tocar una celda la llena de naranja con una animación de abajo hacia arriba de 120 ms. Mantener presionado la vacía. Lector de pantalla: "Proteína, 2 de 3". |
| `MealCard` | Encabezado con nombre del tiempo y hora, nombre de la receta elegida, `BlockRow` por grupo y una celda de flecha de 1/4 para abrir la receta. Completo: la franja izquierda de 4 px se vuelve naranja. |
| `ChecklistRow` | Texto y una celda cuadrada de 40 px a la derecha. Marcado: celda naranja con el check propio. |
| `Button` | Primary: naranja, chaflán, mayúsculas, altura 56. Secondary: borde de 1 px `--ink`. Inverse: fondo `--inverse`. Ghost: solo texto subrayado. Deshabilitado: opacidad 0.4. |
| `ArrowCell` | Celda de 1/4 con flecha. Activa o al presionarla: naranja con chaflán. |
| `Stepper` | `[ − ]  valor  [ + ]` en tres celdas, con el valor en `--t-number`. Al tocar el valor se abre el teclado numérico (`inputmode="decimal"`). Incrementos configurables: 2.5 kg en gym, 0.1 kg en peso corporal, 1 en repeticiones. |
| `Segmented` | Opciones en celdas contiguas; la seleccionada va invertida. |
| `Accordion` | Fila con título y "+" en una celda de 1/4 que gira a "×". Se usa en pasos de receta y en la guía de medidas. |
| `SyncBadge` | ■ más texto. Estados: "Sincronizado" (■ ink), "3 pendientes" (■ naranja), "Sin conexión" (□ contorno), "Error al sincronizar" (■ danger, se toca para ver el detalle y reintentar). |
| `Toast` | Bloque invertido abajo, sobre el tab bar, durante 2.5 s. Ejemplo: "Serie guardada". |
| `Sheet` | Panel inferior con borde superior de 1 px, sin radio, para elegir receta o cambiar proteína. |
| `TimerView` | Pantalla completa con fase (TRABAJO / DESCANSO) en display, cuenta regresiva en `--t-hero`, ejercicio actual y siguiente, y ronda. En fase de trabajo el fondo es `--accent` y el texto `--on-accent`; en descanso, `--surface`. |
| `LineChart` | SVG propio: retícula de 1 px, puntos diarios de 4 px en `--ink-muted`, promedio de 7 días como línea de 2 px en `--ink` y línea de meta punteada en `--accent`. Sin relleno ni curvas suavizadas. |
| `EmptyState` | Una frase con lo que hay que hacer y un botón. Ejemplo: "Sin registros de peso. Registra el de hoy." |

---

## 7. Pantallas (wireframes)

### HOY
```
┌───────────────────────────────────────┐
│ Mar 3 nov                ■ 2 pendientes│
│ HOY                                    │
├───────────────────┬───────────────────┤
│ 012               │ 98.4         [+]  │
│ Día del plan      │ kg hoy            │
├───────────────────┴───────────────────┤
│ ■ Ahora                                │
│ 13:30  Comida                          │
│ Bowl de pollo con arroz          [ → ] │
├────────────────────────────────────────┤
│ ■ Comidas de hoy                       │
│ Desayuno  8:00    Licuado frutos rojos │
│ Fruta     ■                      1/1   │
│ Proteína  ■ ■ ■                  3/3   │
│ Leche     ■                      1/1   │
├────────────────────────────────────────┤
│ Colación 11:00   Tostadas de atún      │
│ Verdura   □   Cereal □   ...           │
├────────────────────────────────────────┤
│ ■ Agua                       1.5 / 3 L │
│ ■■■■■■□□□□□□                 [+250 ml] │
├────────────────────────────────────────┤
│ ■ Hábitos                              │
│ Gym                                [✓] │
│ Cardio en casa                     [ ] │
│ Dormir a las 22:00                 [ ] │
└────────────────────────────────────────┘
│  HOY  │ COMIDA │  GYM  │ CASA │ PROGRESO│
```

### GYM (serie en curso)
```
┌────────────────────────────────────────┐
│ Lunes                     ■ Sin conexión│
│ PECHO                                   │
├────────────────────────────────────────┤
│ 02/07  Press mancuerna neutral cerrado │  ← BracketFrame naranja
│ 5 × 8–12 · descanso 75 s               │
│ Última vez: 22.5 kg × 12, 12, 11, 10, 9 │
├───────────────────┬───────────────────┤
│ SERIE             │ SUGERENCIA        │
│ 3 / 5             │ Sube a 24 kg      │
├────────┬──────────┴────────┬──────────┤
│  [ − ] │      24.0 kg      │  [ + ]   │
├────────┼───────────────────┼──────────┤
│  [ − ] │      10 reps      │  [ + ]   │
├────────┴───────────────────┴──────────┤
│ [        GUARDAR SERIE        ]       │  ← primario
├────────────────────────────────────────┤
│ 1   24.0 × 12                       ✓ │
│ 2   24.0 × 11                       ✓ │
└────────────────────────────────────────┘
```
Al guardar una serie arranca el descanso. Se muestra como una barra naranja que se vacía bajo el botón, con la cuenta en mono, y la pantalla no se bloquea.

### CASA (temporizador)
```
┌────────────────────────────────────────┐  fondo naranja en TRABAJO
│ CIRCUITO B                 Ronda 3 / 5 │
│                                        │
│ TRABAJO                                │
│                                        │
│ 00:27                                  │  ← --t-hero
│                                        │
│ Subir escalón                          │
│ Sigue: marcha con rodillas altas       │
├───────────────────┬────────────────────┤
│ [   PAUSA   ]     │ [   SALTAR   ]     │
└───────────────────┴────────────────────┘
```

### PROGRESO
```
┌────────────────────────────────────────┐
│ PROGRESO                               │
├───────────────────┬────────────────────┤
│ 96.8              │ −3.2               │
│ Promedio 7 días   │ kg desde el inicio │
├───────────────────┼────────────────────┤
│ 11.8              │ −0.9               │
│ kg para la meta   │ kg por semana      │
├───────────────────┴────────────────────┤
│ [ gráfica: puntos + promedio + meta ]  │
├────────────────────────────────────────┤
│ ■ Semanas                              │
│ Sem 3   97.1   −0.8                    │
├────────────────────────────────────────┤
│ ■ Récords en el gym                    │
│ Press banca      80 kg × 8             │
└────────────────────────────────────────┘
```

### COMIDA
Segmented arriba: **Semana · Recetas · Súper · Domingo**.
- **Recetas:** lista de filas con un `CardTab` (Meal prep / Congelable / Fresco), nombre, tiempo de comida, minutos y el resumen de bloques como mini-celdas.
- **Domingo:** lista numerada de pasos (aquí sí es una secuencia, así que los números se justifican), cada uno con un temporizador opcional.

---

## 8. Movimiento

El movimiento sigue la idea de bloques: los bloques **se recorren** y **se llenan**, nunca rebotan ni giran. Nada aparece ni desaparece de golpe.

**Tokens** (`tokens.css`): `--dur` 160 ms (color y estado), `--dur-fill` 180 ms (llenar una celda), `--dur-slow` 280 ms (indicadores y paneles), `--dur-page` 260 ms (cambio de sección). Curva `--ease` (salida suave, sin rebote) y `--ease-in` para salidas.

| Qué | Cómo |
|---|---|
| Cambio de pestaña o de sección (COMIDA, días del gym, sesiones de casa, filtros, rango de la gráfica, semana) | El bloque se desliza 40 px hacia la dirección del recorrido (izquierda o derecha según el orden) mientras aparece. Clase `anim-slide`, componente `Slide`. |
| Entrar al detalle de una receta | Slide in desde el borde derecho (`anim-push`). Al volver, la lista entra desde la izquierda. |
| Control segmentado y barra de pestañas | El bloque invertido y las marcas de visor **viajan** a la opción elegida en lugar de saltar. |
| Panel inferior (`Sheet`) | Sube desde abajo al abrir y baja al cerrar; el fondo se atenúa. |
| Toast | Entra subiendo desde abajo y sale bajando. |
| Casillas, celdas de agua, bloques y botones de agregar | Se llenan de naranja de abajo hacia arriba (`fill-box`). El check propio se dibuja en 220 ms. |
| Bloques del día en HOY | Cada cuadro se llena proporcionalmente de abajo hacia arriba (420 ms). |
| Franjas naranjas (comida hecha, paso hecho, receta en la semana) | Crecen de abajo hacia arriba. |
| Temporizador de casa | Sube a pantalla completa; cada fase nueva entra subiendo 16 px. |
| Ejercicio nuevo en el gym | Entra subiendo 12 px (`anim-rise`). |

- **Un solo momento orquestado:** cuando se completan todos los bloques del día, la fila protagonista de HOY se invierte a naranja durante 400 ms y queda con la franja naranja.
- Las animaciones no corren al abrir la app, solo cuando algo cambia.
- No hay parallax, ni efectos hover en tarjetas, ni escalas, ni sombras.
- Con `prefers-reduced-motion`, todas las transiciones y animaciones son instantáneas.

---

## 9. Accesibilidad e iOS

- Contraste AA en todo el texto. El naranja nunca se usa como texto chico sobre fondo claro.
- Objetivos táctiles de 44 px como mínimo; en la práctica usamos 56.
- Foco visible: `BracketFrame` naranja.
- Inputs de 16 px como mínimo. `inputmode="decimal"` para pesos y `inputmode="numeric"` para repeticiones. Aceptar punto y coma como separador decimal.
- Safe areas: `viewport-fit=cover` y `env(safe-area-inset-*)` en el header y el tab bar. Usar `100dvh`, no `100vh`.
- `<meta name="theme-color">` con dos valores, uno por esquema de color. `apple-mobile-web-app-status-bar-style: black-translucent`.
- Etiquetas para VoiceOver en cada celda de bloque y en cada stepper.

---

## 10. Escritura en la interfaz

- Español de México, en oración, directo. Verbos en botones: "Guardar serie", "Iniciar circuito", "Marcar como comida", "Cambiar proteína".
- Una acción conserva su nombre en todo el flujo: el botón "Guardar serie" produce el toast "Serie guardada".
- Los errores dicen qué pasó y qué hacer. Ejemplo: "Sin conexión. Tus registros están guardados en el iPhone y se subirán cuando abras la app con señal."
- Estados vacíos con una invitación a actuar. Ejemplo: "Aún no eliges recetas para esta semana. Elige 2 comidas y 2 cenas."
- No usar exclamaciones, emojis ni frases motivacionales genéricas.
