# CLAUDE.md

Proyecto **BLOQUE**: PWA personal offline-first para iPhone (plan de pérdida de grasa). Un solo usuario.

## Lee primero
1. `SPEC.md`: funciones, arquitectura, sincronización, despliegue e hitos (§9).
2. `DESIGN.md`: sistema visual. Es obligatorio; no inventes estilos fuera de los tokens.
3. `CONTENT.md`: todo el contenido (bloques, recetas, rutinas, cardio, reglas). Conviértelo a `src/data/*.ts` tipado sin cambiar los IDs.

## Reglas de trabajo
- Trabaja **por hitos** (SPEC §9), uno a la vez. Al terminar cada uno, resume qué se puede probar en el iPhone y espera confirmación antes de seguir.
- **Offline primero:** toda escritura va a Dexie y marca `dirty`. Ninguna pantalla espera a la red.
- Sin Tailwind ni librerías de UI. Usa CSS con variables y CSS Modules, siguiendo DESIGN.md.
- Fuentes auto-hospedadas con @fontsource, nunca desde un CDN.
- Temporizadores basados en timestamps (SPEC §7).
- Interfaz en español de México. El código y los comentarios pueden ir en inglés.
- Nunca pongas la `service_role` / secret key de Supabase en el cliente ni en el repositorio. Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` (en `.gitignore`).
- Pruebas con Vitest para todo `src/lib/*` y para la lógica de conflicto del motor de sincronización.

## Comandos
- `npm run dev`: desarrollo. Para probar en el iPhone en la misma red: `npm run dev -- --host` y abrir la IP de la Mac en Safari.
- `npm run build && npm run preview`: probar el service worker en local.
- `npm test`: pruebas.

## Checklist antes de cerrar un hito
- [ ] Funciona en modo avión, con la app cerrada y vuelta a abrir.
- [ ] Se ve bien en claro y oscuro, a 375 px y a 430 px de ancho.
- [ ] Inputs de 16 px o más y objetivos táctiles de 44 px o más.
- [ ] Sin errores de TypeScript ni de consola.
