# SPEC.md — BLOQUE

App web progresiva (PWA), personal y de un solo usuario, para iPhone. Funciona **sin conexión** y sincroniza con Supabase cuando hay señal.

Documentos relacionados:
- `DESIGN.md`: sistema visual.
- `CONTENT.md`: plan de alimentación, recetas, rutinas y reglas.

---

## 1. Objetivo y alcance

**Objetivo:** que Eugenio siga su plan de pérdida de grasa (de unos 100 kg a 85 kg) con un solo lugar para:
- el checklist diario de bloques de comida, agua y hábitos;
- el registro de pesos y repeticiones en el gym, sin señal;
- el temporizador de cardio en casa;
- la planeación semanal de comidas, con la lista del súper y la guía de preparación del domingo;
- el registro de peso corporal, con promedios y gráfica.

**Fuera de alcance en v1:** notificaciones push, lectura de Apple Salud, varios usuarios, App Store y cálculo de calorías libre (todo se maneja por bloques).

---

## 2. Stack

| Pieza | Elección | Motivo |
|---|---|---|
| Build | Vite + React 18 + TypeScript (modo estricto) | Rápido y con buen soporte PWA |
| Rutas | `react-router` con `HashRouter` | GitHub Pages no reescribe rutas; con hash no hay errores 404 al recargar |
| Estilos | CSS con variables (tokens de DESIGN.md) + CSS Modules | Control exacto del sistema visual; sin Tailwind |
| Datos locales | Dexie 4 (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) | Fuente de verdad local y reactiva |
| Nube | `@supabase/supabase-js` v2 | Autenticación, Postgres y RLS |
| PWA | `vite-plugin-pwa` (Workbox), `registerType: 'prompt'` | Precache completo y aviso de nueva versión |
| Fechas | `date-fns` con locale `es` | Formato en español |
| Gráficas | SVG propio | Coincide con el diseño y pesa poco |
| Iconos | `lucide-react` | |
| Fuentes | `@fontsource/tektur`, `@fontsource/jetbrains-mono` | Auto-hospedadas para funcionar offline |
| IDs | `crypto.randomUUID()` | Disponible en iOS 15.4+ |

Fijar versiones exactas en `package.json`.

---

## 3. Estructura de carpetas

```
src/
  data/         # contenido estático tipado, generado desde CONTENT.md
    foods.ts  recipes.ts  routines.ts  cardio.ts  schedule.ts  rules.ts  profile.ts
  db/
    schema.ts       # Dexie: tablas, índices, versiones
    repo/*.ts       # funciones de lectura y escritura (siempre marcan dirty)
  sync/
    engine.ts       # push, pull, estado, disparadores
    supabase.ts     # cliente
  lib/
    blocks.ts       # cálculo de bloques por tiempo y día
    shopping.ts     # lista del súper (cocido → crudo, unidades de compra)
    prep.ts         # genera la guía del domingo
    progress.ts     # promedios, ritmo y sugerencias
    timer.ts        # motor de temporizador basado en timestamps
    audio.ts        # pitidos con Web Audio
    wakelock.ts
  components/       # componentes de DESIGN.md §6
  screens/
    Hoy/  Comida/{Semana,Recetas,Receta,Super,Domingo}/  Gym/  Casa/  Progreso/  Ajustes/  Login/
  styles/
    tokens.css  base.css
```

---

## 4. Funciones por pantalla

### 4.1 HOY
- **Encabezado:** fecha, `SyncBadge`, "Día N del plan" (días desde `settings.startDate` + 1) y el peso de hoy, con botón [+] que abre el stepper de peso.
- **"Ahora":** la siguiente actividad según el horario de `CONTENT.md §1`, con acceso directo (abrir receta, iniciar gym, iniciar circuito).
- **Tarjetas de comida:** Pre-entreno, Desayuno, Colación, Comida y Cena.
  - Cada una muestra la receta asignada (del plan semanal) o "Armar con bloques".
  - Incluye `BlockRow` por grupo y botón "Marcar como comida", que llena todos los bloques de esa tarjeta.
  - Se puede cambiar la receta de ese día sin alterar el plan semanal.
- **Agua:** 12 celdas de 250 ml, para una meta de 3 L.
- **Hábitos (checklist):** pre-entreno y creatina, gym, cardio post-gym, cardio en casa, pasos (campo numérico opcional) y dormir a la hora meta.
- **Comida flexible:** interruptor "Usé mi comida flexible". Se permite una por semana; si ya se usó esa semana, la app lo avisa.
- **Cierre del día:** al completar todos los bloques se dispara el momento visual de DESIGN.md §8.

### 4.2 COMIDA
Tiene cuatro secciones en un control segmentado.

**Semana**
- Elegir de 2 a 3 recetas de comida y de 2 a 3 de cena para la semana.
- Elegir 1 o 2 desayunos y 1 o 2 colaciones, que rotan.
- **Distribución automática** de lunes a sábado: alterna las recetas elegidas sin repetir la misma comida dos días seguidos cuando se pueda. Se puede editar cada día a mano.
- **Domingo** es día de preparación: las comidas se cocinan frescas y es el lugar sugerido para la comida flexible.
- Indicador de conservación: las recetas asignadas de jueves a sábado deben ser congelables. Si no lo son (por ejemplo, pescado), se muestra la advertencia "Esta receta conviene prepararla fresca ese día".

**Recetas**
- Filtros: tiempo de comida, Meal prep, Congelable y Fresco.
- El detalle de receta incluye:
  - bloques en mini-celdas;
  - ingredientes por porción (pesos **cocidos** o servidos);
  - pasos, minutos y conservación;
  - "Usar hoy en [tiempo]" y "Agregar a la semana".
- **Cambiar proteína:** reemplaza la proteína de la receta por otra equivalente con el mismo número de bloques, usando `foods.ts`, y recalcula los gramos. Ejemplo: 180 g de pollo (6 bloques) pasa a 240 g de pescado.
- **Alternativas:** muestra otras recetas del mismo tiempo de comida.

**Súper**
- Se genera a partir del plan semanal: recetas de lunes a sábado más desayunos y colaciones de 7 días.
- Convierte de cocido a **crudo** con los factores de `CONTENT.md §5` y redondea hacia arriba a unidades de compra (latas, paquetes, kg de tortilla, etc.).
- Agrupa por sección del súper: Carnes y pescados, Lácteos y huevo, Frutas, Verduras, Abarrotes, Tortillería.
- Checkbox por artículo, guardado por semana.

**Domingo**
- Guía paso a paso generada desde las recetas de la semana (`lib/prep.ts` usa la plantilla de `CONTENT.md §7`). Incluye solo los pasos que aplican; por ejemplo, si no hay pasta, no aparece el paso de pasta.
- Cada paso tiene un temporizador opcional. La pantalla se mantiene encendida con Wake Lock.
- **Paso final, "Etiquetar y guardar":** lista de contenedores con día, receta y destino (Refri: lunes a miércoles; Congelador: jueves a sábado). Incluye el recordatorio "Pasa el contenedor del día siguiente del congelador al refri cada noche".

### 4.3 GYM
- Se abre en el día que corresponde al día de la semana (Lunes Pecho a Viernes Pierna) y permite elegir otro día a mano.
- Botón "Iniciar sesión" crea un `workout_session`.
- **Lista de ejercicios** numerada (es secuencia). Cada ejercicio muestra series × rango y lo que se hizo la última vez.
- **Registro de serie:** steppers de peso y repeticiones, **precargados** con la última serie del mismo ejercicio. "Guardar serie" guarda localmente al instante y arranca el descanso (75 s por defecto, configurable a 60 o 90).
- **Sugerencia de progresión:** si en la última sesión todas las series llegaron al tope del rango, se sugiere subir el incremento del equipo (barra +2.5 kg, mancuerna +2 kg, máquina o polea a la siguiente placa).
- Ejercicios unilaterales: registro por lado (izquierda y derecha).
- Ejercicios al fallo y de peso corporal: solo repeticiones.
- 21s: una "serie" equivale a 7+7+7; se registran el peso y si se completó.
- Al terminar: resumen (duración, series, volumen total) y casilla "Cardio post-gym hecho" con minutos.
- **Volumen reducido** (opción en Ajustes): los ejercicios de 5 series pasan a 4.

### 4.4 CASA
- Selector de sesión: A (continua), B (circuito), C (intervalos) o Largo. La sesión sugerida del día sale de la plantilla semanal de `CONTENT.md §9`.
- **Temporizador** a pantalla completa (DESIGN.md `TimerView`):
  - Fases de calentamiento, trabajo, descanso, ronda y enfriamiento.
  - Pausa y Saltar.
  - Pitido 3 s antes de cada cambio y al cambiar.
- Al terminar o salir se guarda un `cardio_session` con los minutos reales.

### 4.5 PROGRESO
- **Estadísticas:** promedio de 7 días, kg desde el inicio, kg para la meta (85) y ritmo en kg por semana.
- **Gráfica:** puntos diarios, línea de promedio de 7 días y línea de meta.
- **Tabla semanal** (lunes a domingo): promedio y diferencia contra la semana anterior.
- **Cintura** cada 2 semanas (campo opcional en el registro de peso).
- **Récords del gym:** el mayor peso con repeticiones válidas por ejercicio principal.
- **Cumplimiento:** porcentaje de bloques completados en 7 días y racha de días con todos los bloques.
- **Sugerencias** según las reglas de `CONTENT.md §11`. Solo se muestran como tarjetas; la app nunca cambia el plan sola.

### 4.6 AJUSTES
- Perfil: estatura, fecha de inicio, peso meta.
- Horarios: despertar, dormir y "Ajustar sueño gradualmente" (`CONTENT.md §1.2`).
- Descanso por defecto en gym, volumen reducido, gramos de creatina.
- Tema: sistema, claro u oscuro.
- Cuenta: iniciar o cerrar sesión, estado de sincronización, "Sincronizar ahora" y última sincronización.
- **Respaldo:** exportar todo a JSON (descarga) e importar JSON.
- "Borrar datos de este iPhone", con doble confirmación escribiendo BORRAR.

---

## 5. Datos y sincronización (offline-first)

### 5.1 Principios
1. **IndexedDB es la fuente de verdad en el iPhone.** Toda escritura va primero a Dexie y la interfaz se actualiza al instante. Nunca se espera a la red.
2. Cada escritura marca el registro con `dirty = 1` y `updatedAt = Date.now()` (hora del cliente).
3. El motor de sincronización sube los registros sucios y baja los cambios remotos.
4. Conflictos: **gana la última escritura** por registro, comparando `updatedAt`. Es suficiente para un solo usuario.
5. Los borrados son lógicos (`deleted = true`) y se sincronizan como cualquier cambio.

### 5.2 Tablas locales (Dexie)

Todas incluyen `updatedAt: number`, `deleted: 0|1` y `dirty: 0|1` (indexado).

| Tabla | Clave | Campos |
|---|---|---|
| `settings` | `id = 'me'` | `data` (objeto: startDate, heightCm, goalKg, wakeTime, sleepTime, sleepRamp, restSec, reducedVolume, creatineG, theme) |
| `bodyMetrics` | `date` (YYYY-MM-DD) | `weightKg`, `waistCm?`, `note?` |
| `dailyLogs` | `date` | `meals` (por tiempo: `{recipeId?, filled: {V,F,C,P,L,G}}`), `waterMl`, `steps?`, `habits` (`{pre, gym, gymCardio, homeCardio, sleepOnTime}`), `flexMeal` |
| `workoutSessions` | `id` (uuid) | `date`, `dayKey`, `startedAt`, `endedAt?`, `notes?`, `cardioMin?` |
| `setLogs` | `id` (uuid) | `sessionId`, `exerciseId`, `setIndex`, `side?` ('izq'\|'der'), `weightKg?`, `reps?`, `done` |
| `cardioSessions` | `id` (uuid) | `date`, `kind` ('post'\|'A'\|'B'\|'C'\|'largo'), `minutes`, `completed` |
| `weeklyPlans` | `weekStart` (lunes, YYYY-MM-DD) | `plan` (asignación por día y tiempo), `shoppingChecked` (ids) |
| `meta` | `key` | Cursores de pull por tabla, `lastSyncAt`, `lastError` |

Índices extra: `setLogs` por `[exerciseId+updatedAt]` (para "última vez") y `sessionId`; `bodyMetrics` y `dailyLogs` por `date`.

### 5.3 Esquema en Supabase

Correr en el SQL Editor de un **proyecto nuevo, dedicado a esta app**.

```sql
-- Función común: hora de servidor para el cursor de pull
create or replace function public.touch_server_updated_at()
returns trigger language plpgsql as $$
begin
  new.server_updated_at := now();
  return new;
end $$;

-- Columnas comunes en todas las tablas:
--   user_id uuid not null default auth.uid()
--   updated_at bigint not null        -- ms del cliente (para "gana la última escritura")
--   server_updated_at timestamptz not null default now()  -- cursor de pull
--   deleted boolean not null default false

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table public.body_metrics (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2),
  waist_cm numeric(5,1),
  note text,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, date)
);

create table public.daily_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  meals jsonb not null default '{}',
  water_ml int not null default 0,
  steps int,
  habits jsonb not null default '{}',
  flex_meal boolean not null default false,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, date)
);

create table public.workout_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  day_key text not null,
  started_at bigint,
  ended_at bigint,
  notes text,
  cardio_min int,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table public.set_logs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,          -- sin FK a propósito: evita errores por orden de sincronización
  exercise_id text not null,
  set_index int not null,
  side text,
  weight_kg numeric(6,2),
  reps int,
  done boolean not null default true,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index on public.set_logs (user_id, exercise_id);

create table public.cardio_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  kind text not null,
  minutes int not null,
  completed boolean not null default true,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table public.weekly_plans (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start date not null,
  plan jsonb not null default '{}',
  shopping_checked jsonb not null default '[]',
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, week_start)
);

-- RLS y triggers en todas las tablas
do $$
declare t text;
begin
  foreach t in array array['settings','body_metrics','daily_logs','workout_sessions','set_logs','cardio_sessions','weekly_plans']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "solo mis filas" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger trg_touch before insert or update on public.%I for each row execute function public.touch_server_updated_at()', t);
    execute format('create index on public.%I (user_id, server_updated_at)', t);
  end loop;
end $$;
```

**Configuración de autenticación en Supabase:**
- Proveedor: **email y contraseña**. No usar magic link, porque en iOS el enlace abre Safari y no la app instalada, y la sesión queda en el lugar equivocado.
- Crear el usuario a mano en Authentication → Users y luego **desactivar los registros nuevos** ("Allow new users to sign up" en off).
- En el cliente solo va la **anon / publishable key**. **Nunca** la `service_role` / secret key.

### 5.4 Motor de sincronización (`sync/engine.ts`)

**Disparadores:**
- al abrir la app;
- evento `online`;
- `visibilitychange` cuando la app vuelve a estar visible;
- después de cada escritura, con 2 s de espera para agrupar cambios, si `navigator.onLine`;
- botón "Sincronizar ahora".

Solo puede correr una sincronización a la vez (mutex).

**Push**, en este orden: `settings`, `workoutSessions`, `setLogs` y luego el resto.
1. Leer los registros con `dirty = 1` en lotes de 200.
2. Mapear camelCase a snake_case y hacer `upsert` en Supabase (onConflict según la PK).
3. Al confirmar, poner `dirty = 0` **solo si** el `updatedAt` local no cambió mientras se subía. Si cambió, se queda sucio para la siguiente vuelta.

**Pull**, por tabla:
1. Pedir las filas con `server_updated_at > cursor`, ordenadas ascendentemente, en páginas de 1000. Usar `>=` con el último valor y descartar duplicados.
2. Por cada fila remota: aplicarla si no hay versión local, o si la local no está sucia, o si `remote.updated_at > local.updatedAt`. Si no, conservar la local, que se subirá después.
3. Guardar el cursor con el `server_updated_at` máximo recibido.

**Estado expuesto a la interfaz:** `idle | syncing | offline | error`, el número de pendientes (suma de registros sucios), `lastSyncAt` y `lastError`.

**Errores:**
- Error de red: estado `offline`, sin alertas.
- 401: intentar `refreshSession`; si falla, mostrar "Inicia sesión para sincronizar". La app sigue funcionando localmente.
- Otros errores: estado `error` y reintento con backoff (5 s, 30 s, 2 min).

**Sin sesión:** la app funciona al 100% en local. La primera vez que se inicia sesión, todos los registros locales se suben.

### 5.5 Persistencia en iOS
- Llamar a `navigator.storage.persist()` al iniciar.
- La app instalada en la pantalla de inicio tiene **su propio almacenamiento**, separado del de Safari. El inicio de sesión debe hacerse dentro de la app instalada.
- Ajustes debe recordar exportar un respaldo JSON si pasan más de 30 días sin sincronizar.

---

## 6. PWA y comportamiento offline

- `vite-plugin-pwa`:
  - `registerType: 'prompt'`.
  - `workbox.globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}']`.
  - `navigateFallback: 'index.html'`.
- Al haber nueva versión, mostrar un toast persistente "Nueva versión disponible" con el botón "Actualizar".
- Manifest:
  - `name: "BLOQUE"`, `display: "standalone"`.
  - `start_url: '/lockin_app/'` y `scope: '/lockin_app/'` (la base de GitHub Pages).
  - `background_color` y `theme_color` con `--bg`.
  - Iconos de 192, 512 y 512 maskable, más un `apple-touch-icon` de 180×180 en `index.html`. El icono es un cuadro naranja sobre negro con una cuadrícula de 1 px.
- Las llamadas a Supabase **no** pasan por el cache del service worker. La red va solo para la sincronización.
- **Prueba obligatoria:** con la app instalada, activar el modo avión, cerrar la app por completo y abrirla. Debe cargar y permitir registrar todo.

---

## 7. Detalles de iOS

- **Temporizadores:** calcular siempre a partir de timestamps (`endAt - Date.now()`), nunca restando con `setInterval`. iOS congela los timers cuando la pantalla se apaga o la app pasa a segundo plano; al volver, el temporizador debe mostrar el tiempo correcto (y saltar las fases ya vencidas).
- **Wake Lock:** `navigator.wakeLock.request('screen')` en el temporizador y en la guía del domingo. Volver a pedirlo en `visibilitychange`. Si no está disponible, mostrar una nota: "Para que la pantalla no se apague, ajusta el bloqueo automático en Ajustes de iOS".
- **Audio:** crear y "desbloquear" el `AudioContext` con el toque de "Iniciar". Usar pitidos cortos generados con osciladores, sin archivos.
- **Vibración:** `navigator.vibrate` no existe en iOS. No depender de ella.
- Inputs de 16 px o más para evitar el zoom automático.
- `100dvh` y safe areas como se indica en DESIGN.md §9.

---

## 8. Despliegue (GitHub Pages)

- Repositorio `lockin_app` (github.com/thekarpata87/lockin_app). En `vite.config.ts`, `base: '/lockin_app/'`.
- URL final: **https://thekarpata87.github.io/lockin_app/**
- Secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub → Settings → Secrets and variables → Actions (ya creados). `VITE_SUPABASE_ANON_KEY` contiene la nueva **publishable key** de Supabase (`sb_publishable_...`), que sustituye a la anon key heredada; se usa igual en `createClient`.
- En Settings → Pages, elegir Source: **GitHub Actions**.
- `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- Nota: en GitHub gratis, el sitio y el código son públicos. Los datos no, porque están protegidos por RLS y no se permiten registros nuevos. La anon key está pensada para ser pública cuando RLS está activo. Si se quiere ocultar el código, se puede usar Cloudflare Pages con un repositorio privado (mismo build, salida `dist`).
- **Instalar en el iPhone:** abrir la URL en Safari, tocar Compartir → Agregar a pantalla de inicio, abrir la app desde el icono e iniciar sesión ahí.

---

## 9. Hitos y criterios de aceptación

| # | Hito | Listo cuando |
|---|---|---|
| M1 | Base: Vite, tokens, fuentes, AppFrame, TabBar y PWA instalable offline | Se instala en el iPhone, abre en modo avión y las fuentes cargan sin red |
| M2 | Datos: esquema Dexie, repos y `src/data/*` desde CONTENT.md | Pruebas unitarias de `blocks.ts` pasan; los bloques de cada receta suman lo que marca su tiempo |
| M3 | HOY: tarjetas de comida, BlockRow, agua, hábitos y peso | Registrar todo en modo avión, cerrar la app y al reabrir sigue ahí |
| M4 | GYM: sesiones, registro de series, "última vez", descanso y sugerencias | Un día completo de pecho registrado sin señal en menos de 5 toques por serie |
| M5 | CASA: motor de temporizador, sesiones A/B/C/Largo, audio y wake lock | Con la pantalla apagada 20 s y al volver, el tiempo es correcto |
| M6 | COMIDA: recetas, cambiar proteína, semana, súper y domingo | La lista del súper coincide con un cálculo manual de una semana de prueba |
| M7 | PROGRESO: estadísticas, gráfica, semanas, récords y sugerencias | Con datos de prueba de 4 semanas, los promedios son correctos |
| M8 | Supabase: login, motor de sincronización y SyncBadge | 20 registros hechos offline, al volver la señal aparecen en Supabase en menos de 10 s; un cambio hecho en Supabase baja a la app |
| M9 | Despliegue: GitHub Actions y Pages, instalación final | Push a main → en 2 min la app avisa "Nueva versión disponible" |
| M10 | Pulido: respaldo JSON, Ajustes, accesibilidad, modo oscuro | Revisión visual contra DESIGN.md en claro y oscuro |

**Orden de trabajo:** M1 → M9 (despliegue a GitHub Pages, para instalar la app en el iPhone con HTTPS desde el inicio) → M2 → M3 → … → M8 → M10. A partir de M9, cada push a `main` despliega la versión nueva. El criterio de M9 sobre "Nueva versión disponible" se vuelve a comprobar en cada hito siguiente.

**Pruebas:**
- Vitest para `lib/*` (bloques, súper, prep, progreso y la lógica de conflicto del motor de sincronización).
- Pruebas manuales en el iPhone en cada hito, con modo avión.
