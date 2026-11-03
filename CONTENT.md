# CONTENT.md — BLOQUE

Contenido de la app. Claude Code lo convierte a datos tipados en `src/data/*.ts`. Los IDs se usan tal cual.

**Fuentes:**
- Plan de alimentación #4 (nutrióloga, 22/02/26).
- Rutina "Plan de Entrenamiento" de 5 días, a la que solo se le corrige un ejercicio duplicado.
- Ajustes acordados para la fase de pérdida de grasa.

> **Importante:** la rutina original incluye una sección de "superávit calórico" para ganar músculo. **No aplica** y no va en la app: toda esta fase es en déficit.

---

## 0. Perfil

| Campo | Valor |
|---|---|
| Estatura | 178 cm |
| Peso inicial | ~100 kg (registrar el día 1 en la app) |
| Grasa estimada | ~36% |
| Meta | 85 kg |
| Ritmo esperado | 0.7 a 1.0 kg por semana. Las primeras 2 semanas puede bajar más por pérdida de agua |
| Trabajo | 9:00 a 13:00 |
| Energía aproximada del plan | ~1,700 kcal y ~140 g de proteína al día (no se muestra como meta; todo se maneja por bloques) |

---

## 1. Horario

### 1.1 Día tipo (lunes a viernes)

| ID | Hora | Actividad | Tipo |
|---|---|---|---|
| `wake` | 05:15 | Despertar, 500 ml de agua | hábito |
| `pre` | 05:20 | Pre-entreno o café + creatina + 1 fruta | comida: pre |
| `gym` | 06:00–07:15 | Pesas (rutina del día) | gym |
| `gymCardio` | 07:15–07:40 | Cardio post-gym | cardio: post |
| `desayuno` | 08:00 | Desayuno (licuado de proteína post-gym) | comida |
| `trabajo` | 09:00–13:00 | Trabajo | — |
| `colacion` | 11:00 | Colación | comida |
| `comida` | 13:30 | Comida | comida |
| `homeCardio` | 18:00–18:40 | Cardio en casa | cardio |
| `cena` | 19:30 | Cena | comida |
| `screensOff` | 21:30 | Pantallas fuera, luz baja | hábito |
| `sleep` | 22:00 | Dormir | hábito |

- **Sábado:** sin gym. Cardio Largo (o B) por la mañana y el resto igual.
- **Domingo:** descanso activo (caminata ligera). Es el día de preparación de comidas y el día sugerido para la comida flexible.

### 1.2 Ajuste gradual del sueño (opción "Ajustar sueño gradualmente")

Para quien hoy duerme cerca de las 00:00:

| Noches | Dormir | Despertar | Gym |
|---|---|---|---|
| 1–2 | 23:30 | 06:00 | 06:30–07:45 (cardio post-gym de 10 min) |
| 3–4 | 23:00 | 05:45 | 06:15–07:35 |
| 5–6 | 22:30 | 05:30 | 06:00–07:25 |
| 7 en adelante | 22:00 | 05:15 | Horario normal |

La meta mínima es de 7 horas de sueño.

---

## 2. Sistema de bloques

### 2.1 Grupos

| Clave | Grupo | kcal aprox. por bloque |
|---|---|---|
| `V` | Verduras | 25 |
| `F` | Frutas | 60 |
| `C` | Cereales | 70 |
| `P` | Proteína (origen animal) | 50 |
| `L` | Leche | 95 |
| `G` | Aceites y grasas | 45 |

### 2.2 Bloques por tiempo de comida

| Tiempo | V | F | C | P | L | G |
|---|---|---|---|---|---|---|
| `pre` Pre-entreno | – | 1 | – | – | – | – |
| `desayuno` | – | 1 | – | 3 | 1 | – |
| `colacion` | 1 | – | 1 | 3 | – | 1 |
| `comida` | 2 | – | 3 | 6 | – | 1 |
| `cena` | 1 | – | 2 | 4 | – | 1 |
| **Total del día** | **4** | **2** | **6** | **16** | **1** | **3** |

Notas:
- En el PDF original, la colación aparece con el título "Desayuno" por error de formato. Es la segunda comida del día.
- El scoop de proteína post-gym **es** la proteína del desayuno (3 bloques). No se suma otro aparte.

### 2.3 Equivalentes (1 bloque)

Los campos sirven para "cambiar proteína" y para la lista del súper. `g` es el peso **cocido o servido** aproximado. `crudo` es el factor para comprar.

**Proteína (`P`)**: los pesos son en cocido. No freír ni empanizar.

| ID | Alimento | 1 bloque | g | crudo | Sección |
|---|---|---|---|---|---|
| `pollo` | Pechuga de pollo sin piel | 30 g | 30 | ×1.25 | Carnes |
| `res` | Bistec de res | 30 g | 30 | ×1.25 | Carnes |
| `cerdo` | Lomo de cerdo | 40 g | 40 | ×1.25 | Carnes |
| `pescado` | Filete de pescado blanco | 40 g | 40 | ×1.25 | Carnes |
| `salmon` | Salmón | 30 g | 30 | ×1.25 | Carnes |
| `camaron` | Camarón mediano pelado | 5 pzas | 35 | ×1.25 | Carnes |
| `atun` | Atún en agua | ⅓ lata | 33 (drenado) | lata de 140 g | Abarrotes |
| `panela` | Queso panela reducido en grasa | 1 rebanada (40 g) | 40 | – | Lácteos |
| `huevo` | Huevo entero | 1 pza | 50 | – | Lácteos y huevo |
| `claras` | Claras de huevo | 2 claras | 66 | – | Lácteos y huevo |
| `pavo` | Jamón o pechuga de pavo | 2 rebanadas | 40 | – | Lácteos |
| `whey` | Proteína en polvo | ⅓ scoop | ~10 | – | Abarrotes |

**Cereales (`C`)**

| ID | Alimento | 1 bloque | Sección |
|---|---|---|---|
| `tortilla` | Tortilla de maíz | 1 pza | Tortillería |
| `arroz` | Arroz cocido | ¼ taza (~40 g cocido, ~14 g crudo) | Abarrotes |
| `pasta` | Pasta cocida | ½ taza (~70 g cocida, ~30 g cruda) | Abarrotes |
| `panIntegral` | Pan integral | 1 rebanada | Abarrotes |
| `bolillo` | Bolillo sin migajón | ½ pza | Panadería |
| `avena` | Avena en hojuelas | ¼ taza (~20 g) | Abarrotes |
| `papa` | Papa cocida | ½ pza mediana (~85 g) | Verduras |
| `elote` | Elote desgranado | ½ taza (~80 g) | Verduras |
| `tostadas` | Tostadas horneadas | 20 g (~2 pzas) | Abarrotes |
| `salmas` | Salmas | 1 paquete individual | Abarrotes |
| `totopos` | Totopos horneados | 22 g | Abarrotes |
| `pita` | Pan pita | ⅓ pza | Abarrotes |
| `crotones` | Crotones | ½ taza (~15 g) | Abarrotes |
| `palomitas` | Palomitas naturales | 1.5 tazas | Abarrotes |
| `amaranto` | Amaranto | ¼ taza | Abarrotes |
| `quinoaInflada` | Quinoa inflada | 16 g | Abarrotes |
| `cambray` | Papitas cambray | 5 pzas | Verduras |
| `habaneras` | Galletas habaneras | 4 pzas | Abarrotes |

**Verduras (`V`)**: 1 bloque = 1 taza cocida al vapor o cruda en ensalada. Se pueden aderezar con limón, Tajín, especias o salsa sin aceite.
Comunes: lechuga, espinaca, pepino, jitomate, cebolla, pimiento, calabacita, brócoli, coliflor, nopales, champiñones, ejotes, zanahoria, espárragos, chayote. Todas van en la sección Verduras.
Nota en la app: "Las verduras de hoja y el pepino puedes repetirlos si te quedas con hambre".

**Frutas (`F`)**: Frutas.
1 manzana · 1 taza de fresa rebanada · ½ plátano · 3 guayabas · ½ mango · ¾ taza de blueberries · 2 higos · 1 taza de melón · 1 taza de papaya · ½ pera · 2 tunas · 1 kiwi · 2 duraznos · 1 taza de frambuesas · ¾ taza de piña · 2 mandarinas · 1 taza de sandía · ½ toronja · 1 taza de uvas.

**Leche (`L`)**: Lácteos.
1 taza (250 ml) de leche descremada o deslactosada light · ¾ taza de yogurt griego o natural sin azúcar · 1 yogurt bebible sin endulzar.

**Grasas (`G`)**
1 cdita de aceite o aceite de oliva · 5 segundos de aceite en aerosol · ¼ de aguacate · 1 cdita de mantequilla · 1 cdita de mayonesa · 1 cda de crema · 2 cdas de guacamole · 1 cda de queso crema.

---

## 3. Recetas

Las cantidades son **por porción**, en peso **cocido o servido**.
- **Etiquetas:** `prep` (se prepara el domingo), `cong` (congelable), `fresco` (prepararlo el mismo día).
- **Conservación:** días máximos en refri.

### 3.1 Pre-entreno (F1)
No lleva receta. Opciones rápidas: 1 manzana, ½ plátano, 2 mandarinas o 1 kiwi.

### 3.2 Desayuno (F1 · P3 · L1)

| ID | Nombre | Ingredientes | Pasos | Min | Etiquetas |
|---|---|---|---|---|---|
| `des-licuado-rojos` | Licuado de frutos rojos | 1 scoop de proteína (P3) · 1 taza de fresas o frambuesas congeladas (F1) · 250 ml de leche descremada (L1) · hielo y canela | Licuar todo 30 s | 3 | fresco |
| `des-licuado-platano` | Licuado de plátano | 1 scoop de proteína (P3) · ½ plátano (F1) · 250 ml de leche descremada (L1) · canela · espinaca opcional | Licuar todo 30 s | 3 | fresco |
| `des-huevos-yogurt` | Huevos con yogurt y fruta | 1 huevo + 4 claras (P3) · ¾ taza de yogurt griego natural (L1) · 1 manzana o 1 taza de papaya (F1) | Revolver huevo y claras en sartén antiadherente **sin aceite**. Servir con el yogurt y la fruta | 10 | fresco |
| `des-bowl-yogurt` | Bowl de yogurt proteico | ¾ taza de yogurt griego natural (L1) · 1 scoop de proteína (P3) · ¾ taza de blueberries (F1) · canela | Mezclar la proteína con el yogurt y agregar la fruta encima | 3 | fresco |
| `des-omelette-pavo` | Omelette de claras con pavo | 4 claras + 2 rebanadas de pavo (P3) · espinaca o champiñón al gusto · 1 taza de leche descremada o café con leche (L1) · 1 taza de melón (F1) | Omelette en sartén antiadherente sin aceite | 10 | fresco |

### 3.3 Colación (V1 · C1 · P3 · G1)

| ID | Nombre | Ingredientes | Pasos | Min | Etiquetas |
|---|---|---|---|---|---|
| `col-tostadas-atun` | Tostadas de atún | 1 lata de atún en agua drenado (P3) · 1 taza de pepino, jitomate, cebolla y cilantro (V1) · 2 tostadas horneadas, 20 g (C1) · ¼ de aguacate (G1) · limón y salsa | Mezclar el atún con la verdura picada y el limón; servir sobre las tostadas con el aguacate | 5 | fresco |
| `col-sandwich-pavo` | Sándwich abierto de pavo | 1 rebanada de pan integral (C1) · 4 rebanadas de pavo + 1 rebanada de panela (P3) · 1 taza de lechuga y jitomate (V1) · 1 cdita de mayonesa (G1) | Armar sobre el pan | 3 | fresco |
| `col-taco-pollo` | Taco de pollo | 90 g de pollo cocido del prep (P3) · 1 tortilla (C1) · 1 taza de lechuga y pico de gallo (V1) · 2 cdas de guacamole (G1) | Calentar pollo y tortilla, armar el taco | 5 | prep |
| `col-huevo-mexicana` | Huevo a la mexicana | 1 huevo + 4 claras (P3) · 1 taza de jitomate, cebolla y chile (V1) · 1 tortilla (C1) · 1 cdita de aceite (G1) | Sofreír la verdura con el aceite y agregar el huevo | 10 | fresco |
| `col-ensalada-salmas` | Ensalada de pollo con salmas | 90 g de pollo cocido (P3) · 1 taza de mix verde (V1) · 1 paquete de salmas (C1) · ¼ de aguacate (G1) · limón | Mezclar todo y servir con las salmas | 5 | prep |

### 3.4 Comida (V2 · C3 · P6 · G1)

| ID | Nombre | Ingredientes | Pasos | Min | Etiquetas | Refri |
|---|---|---|---|---|---|---|
| `com-bowl-pollo` | Bowl de pollo con arroz | 180 g de pollo (P6) · ¾ taza de arroz cocido (C3) · 2 tazas de brócoli y calabacita al vapor (V2) · ¼ de aguacate (G1) | Calentar pollo y arroz; agregar la verdura y el aguacate al momento | 5 | prep, cong | 4 |
| `com-tacos-bistec` | Tacos de bistec | 180 g de bistec (P6) · 3 tortillas (C3) · 2 tazas de nopales y cebolla asados (V2) · 5 s de aceite en aerosol (G1) · salsa | Calentar el bistec en sartén con aerosol; servir en tortillas con los nopales | 10 | prep, cong | 4 |
| `com-pasta-pollo` | Pasta con pollo y espinaca | 180 g de pollo (P6) · 1½ tazas de pasta cocida (C3) · 2 tazas de espinaca y champiñón (V2) · 1 cdita de aceite de oliva (G1) · ajo | Saltear ajo, champiñón y espinaca con el aceite; agregar pasta y pollo | 10 | prep, cong | 4 |
| `com-fajitas-pollo` | Fajitas de pollo | 180 g de pollo en tiras (P6) · 2 tazas de pimiento y cebolla (V2) · 3 tortillas (C3) · 2 cdas de guacamole (G1) | Saltear el pimiento y la cebolla sin aceite (o con agua); agregar el pollo y servir | 10 | prep, cong | 4 |
| `com-cerdo-elote` | Lomo de cerdo con elote | 240 g de lomo de cerdo (P6) · 1½ tazas de elote desgranado (C3) · 2 tazas de ejotes y zanahoria al vapor (V2) · 1 cdita de aceite (G1) | Calentar el lomo; servir con el elote y la verdura | 5 | prep, cong | 4 |
| `com-pescado-papa` | Pescado con papa y ensalada | 240 g de filete de pescado (P6) · 1½ papas medianas cocidas (C3) · 2 tazas de ensalada (V2) · 1 cdita de aceite de oliva (G1) · limón | Pescado a la plancha 3–4 min por lado; papa cocida; ensalada con aceite y limón | 20 | fresco | 2 |
| `com-ensalada-crotones` | Ensalada de pollo con crotones | 180 g de pollo (P6) · 2 tazas de lechuga, espinaca, pepino y pimiento (V2) · 1½ tazas de crotones (C3), agregarlos al momento · 1 cdita de aceite de oliva + limón (G1) | Armar en el momento con el pollo del prep | 5 | prep | 4 |
| `com-camarones-arroz` | Camarones al ajo con arroz | 30 camarones medianos (P6) · ¾ taza de arroz (C3) · 2 tazas de calabacita y brócoli (V2) · 1 cdita de aceite (G1) · ajo | Saltear ajo y camarón con el aceite 3–4 min; servir con arroz y verdura | 15 | fresco | 2 |

### 3.5 Cena (V1 · C2 · P4 · G1)

| ID | Nombre | Ingredientes | Pasos | Min | Etiquetas | Refri |
|---|---|---|---|---|---|---|
| `cen-ceviche-panela` | Ceviche de panela | 4 rebanadas de panela, 160 g (P4) · 1 taza de pepino, jitomate y cebolla (V1) · 2 paquetes de salmas o 4 tostadas horneadas (C2) · 1 cdita de aceite de oliva o ¼ de aguacate (G1) · limón, sal, pimienta, chile serrano opcional | Picar en cubos y mezclar con limón; servir con las salmas | 10 | fresco | 1 |
| `cen-tacos-pollo` | Tacos de pollo deshebrado | 120 g de pollo (P4) · 2 tortillas (C2) · 1 taza de nopales o calabacita (V1) · ¼ de aguacate (G1) · salsa | Calentar y armar los tacos | 5 | prep, cong | 4 |
| `cen-huevos-tortilla` | Huevos con verdura | 2 huevos + 4 claras (P4) · 1 taza de espinaca y jitomate (V1) · 2 tortillas (C2) · 1 cdita de aceite (G1) | Saltear la verdura y agregar el huevo | 10 | fresco | – |
| `cen-quesadillas` | Quesadillas de panela y pollo | 2 tortillas (C2) · 2 rebanadas de panela + 60 g de pollo (P4) · 1 taza de champiñón y espinaca (V1) · 5 s de aerosol (G1) | Armar y dorar en comal con el aerosol | 10 | prep | 4 |
| `cen-tostadas-pollo` | Tostadas de pollo | 120 g de pollo (P4) · 4 tostadas horneadas, 40 g (C2) · 1 taza de lechuga y jitomate (V1) · 2 cdas de guacamole (G1) | Armar las tostadas | 5 | prep | 4 |
| `cen-sandwich` | Sándwich de pavo y panela | 2 rebanadas de pan integral (C2) · 6 rebanadas de pavo + 1 rebanada de panela (P4) · 1 taza de lechuga y jitomate (V1) · 1 cdita de mayonesa (G1) | Armar; opcionalmente tostarlo en sartén sin grasa | 5 | fresco | – |
| `cen-salmon-papa` | Salmón con papa | 120 g de salmón (P4) · 1 papa mediana cocida (C2) · 1 taza de espárragos o brócoli (V1) · 5 s de aerosol (G1) | Salmón a la plancha o al horno a 200 °C por 12 min | 20 | fresco | 2 |

**Validación:** `blocks.ts` debe comprobar en las pruebas que la suma de bloques de cada receta coincide con su tiempo (tabla §2.2).

---

## 4. "Armar con bloques" (modo libre)

Para cada grupo del tiempo de comida, el usuario elige alimentos de §2.3 hasta completar los bloques. Por ejemplo, en la comida de proteína ×6: 90 g de pollo + 2 rebanadas de panela + 1 huevo. La app muestra los bloques que llenó y los que faltan.

---

## 5. Conversiones para el súper

| Alimento | Regla |
|---|---|
| Pollo, res, cerdo, pescado, salmón y camarón | Crudo = cocido × 1.25. Ejemplo: 180 g cocido = 225 g crudo; 3 comidas = 675 g crudo |
| Arroz | 1 taza cocida ≈ 160 g ≈ 55 g crudo |
| Pasta | 1 taza cocida ≈ 140 g ≈ 60 g cruda |
| Papa, elote, verduras y frutas | Mismo peso |
| Atún | Lata de 140 g (1 lata = 3 bloques) |
| Panela | Paquete de ~400 g (~10 rebanadas de 40 g) |
| Pavo | Paquete de 250 g (~12 rebanadas) |
| Tortilla | 1 kg ≈ 33 tortillas |
| Huevo | Por pieza (redondear a 12 o 18). Claras líquidas: 1 L ≈ 30 claras |
| Leche | 1 L = 4 bloques |
| Yogurt griego | 1 kg ≈ 5.5 bloques (¾ taza ≈ 180 g) |
| Aguacate | 1 pieza = 4 bloques de ¼ |
| Verduras | Redondear a 100 g, o a piezas para pepino, jitomate y pimiento |

La lista suma las cantidades de lunes a sábado (recetas asignadas) más desayunos y colaciones de 7 días, convierte a crudo y redondea a unidades de compra.

---

## 6. Conservación

| Alimento | Refri | Congelador | Nota |
|---|---|---|---|
| Pollo, res o cerdo cocidos | 3–4 días | 2–3 meses | Enfriar y guardar en menos de 2 h |
| Arroz cocido | 3–4 días | 1–2 meses | Extenderlo para que enfríe rápido |
| Pasta cocida | 3–5 días | 1–2 meses | |
| Pescado o camarón cocidos | 2 días | Mejor congelar crudo | Preferir cocinarlo fresco |
| Verdura cocida | 3–4 días | Congelar aparte | |
| Verdura cruda picada | 4–5 días | No | Contenedor con una servilleta |
| Lechuga lavada | 4–5 días | No | Bien seca |
| Aguacate | Partir al momento | – | |
| Guacamole | 1–2 días | – | Plástico pegado a la superficie |

Regla de la app: lunes a miércoles van al **refri**, jueves a sábado al **congelador**. Cada noche se pasa el contenedor del día siguiente al refri. Recalentar hasta que salga vapor (74 °C).

---

## 7. Guía del domingo (plantilla)

`lib/prep.ts` incluye un paso solo si alguna receta de la semana lo necesita. Las horas son relativas al inicio.

| ID | Inicio | Paso | Temporizador | Condición |
|---|---|---|---|---|
| `p-setup` | 0:00 | Precalentar el horno a 200 °C. Sacar la báscula, las charolas y 12 contenedores | – | siempre |
| `p-arroz` | 0:05 | Arroz: 1 taza de arroz por 2 de agua. Hervir, tapar y fuego bajo | 20 min | arroz |
| `p-pollo` | 0:10 | Pollo: sazonar con sal, pimienta, ajo en polvo, paprika y limón. Charola con aerosol, al horno | 25–30 min | pollo |
| `p-picar` | 0:15 | Mientras tanto: lavar, desinfectar y picar las verduras crudas | – | siempre |
| `p-vapor` | 0:30 | Verduras al vapor (brócoli, calabacita, ejotes, zanahoria) | 6 min | verdura cocida |
| `p-res` | 0:40 | Bistec a la plancha, 3–4 min por lado | 8 min | res |
| `p-cerdo` | 0:40 | Lomo de cerdo en sartén o al horno, hasta 63 °C por dentro; reposar 3 min | 15 min | cerdo |
| `p-nopales` | 0:50 | Nopales y cebolla asados en comal | 10 min | nopales |
| `p-pasta` | 0:50 | Pasta en agua hirviendo con sal | 9 min | pasta |
| `p-deshebrar` | 1:00 | Deshebrar el pollo para tacos y quesadillas | – | cena con pollo deshebrado |
| `p-enfriar` | 1:05 | Extender todo en charolas para enfriar | 20 min | siempre |
| `p-pesar` | 1:25 | Pesar las porciones **cocidas** y armar los contenedores según la semana | – | siempre |
| `p-etiquetar` | 1:45 | Etiquetar con día y receta. Refri: lunes a miércoles. Congelador: jueves a sábado | – | siempre |

Duración aproximada: 1 h 45 min a 2 h.

---

## 8. Rutina de gym

Las reglas generales son las mismas para todos los días:
- Descanso de 75 s (configurable a 60 o 90).
- Quedarse a 1–2 repeticiones del fallo.
- Registrar el peso de cada serie.
- Al terminar: 20–25 min de cardio post-gym (§9).

**Tipos de equipo e incremento sugerido:** `barra` +2.5 kg · `mancuerna` +2 kg · `maquina` y `polea` siguiente placa · `corporal` solo repeticiones.

### Lunes, `lun`: PECHO
| # | ID | Ejercicio | Series × reps | Equipo |
|---|---|---|---|---|
| 1 | `press-banca` | Press de pecho con barra | 5 × 8–12 | barra |
| 2 | `press-mancuerna-neutral` | Press de pecho neutral cerrado con mancuernas | 5 × 8–12 | mancuerna |
| 3 | `press-inclinado-barra` | Press de pecho inclinado con barra | 5 × 8–12 | barra |
| 4 | `press-inclinado-mancuerna` | Press inclinado con mancuernas (sustituye al duplicado del PDF) | 5 × 8–12 | mancuerna |
| 5 | `flys-poleas` | Flys de pecho en poleas | 5 × 8–12 | polea |
| 6 | `pec-dec` | Pec-dec | 5 × 8–12 | maquina |
| 7 | `push-ups` | Lagartijas | 4 × al fallo | corporal |

### Martes, `mar`: ESPALDA
| # | ID | Ejercicio | Series × reps | Equipo |
|---|---|---|---|---|
| 1 | `jalon-abierto` | Jalón al pecho, agarre abierto prono | 5 × 8–12 | polea |
| 2 | `jalon-supino` | Jalón al pecho, agarre cerrado supino | 5 × 8–12 | polea |
| 3 | `remo-polea-neutral` | Remo en polea, agarre neutral cerrado | 5 × 8–12 | polea |
| 4 | `remo-polea-prono` | Remo en polea, agarre prono abierto | 5 × 8–12 | polea |
| 5 | `remo-barra` | Remo con barra prono | 5 × 8–12 | barra |
| 6 | `remo-mancuerna` | Remo con mancuerna a un brazo | 4 × 15 por brazo | mancuerna, unilateral |

### Miércoles, `mie`: HOMBRO
| # | ID | Ejercicio | Series × reps | Equipo |
|---|---|---|---|---|
| 1 | `press-militar` | Press de hombro con barra | 5 × 8–12 | barra |
| 2 | `press-arnold` | Press Arnold | 5 × 8–12 | mancuerna |
| 3 | `laterales` | Elevaciones laterales | 5 × 8–12 | mancuerna |
| 4 | `frontales` | Elevaciones frontales | 5 × 8–12 | mancuerna |
| 5 | `remo-vertical` | Remo vertical | 5 × 8–12 | barra |
| 6 | `face-pull` | Face pull en polea | 5 × 8–12 | polea |

### Jueves, `jue`: BÍCEPS, TRÍCEPS Y ABDOMEN
| # | ID | Ejercicio | Series × reps | Equipo |
|---|---|---|---|---|
| 1 | `curl-inclinado` | Curl de bíceps en banco inclinado | 4 × 8–12 | mancuerna |
| 2 | `curl-21s` | 21s con barra Z (7 + 7 + 7) | 4 series | barra |
| 3 | `martillo-cuerda` | Curl martillo en polea con cuerda | 4 × 8–12 | polea |
| 4 | `ext-triceps-polea` | Extensión de tríceps en polea | 4 × 8–12 | polea |
| 5 | `press-frances` | Press francés con mancuernas | 4 × 8–12 | mancuerna |
| 6 | `press-california` | Press California con barra | 4 × 8–12 | barra |
| 7 | `sit-ups` | Abdominales (sit-ups) | 4 × 15 | corporal |
| 8 | `leg-raise` | Elevación de piernas | 4 × 15 | corporal |
| 9 | `v-ups` | V-ups | 4 × 15 | corporal |

### Viernes, `vie`: PIERNA
| # | ID | Ejercicio | Series × reps | Equipo |
|---|---|---|---|---|
| 1 | `sentadilla` | Sentadilla | 5 × 8–12 | barra |
| 2 | `desplante-fijo` | Desplante con la misma pierna | 4 × 10 por pierna | mancuerna, unilateral |
| 3 | `peso-muerto` | Peso muerto | 5 × 8–12 | barra |
| 4 | `bulgaro` | Desplante búlgaro | 4 × 10 por pierna | mancuerna, unilateral |
| 5 | `extension-cuadriceps` | Extensión de pierna en máquina | 5 × 8–12 | maquina |
| 6 | `curl-femoral` | Curl femoral en máquina | 5 × 8–12 | maquina |
| 7 | `pantorrilla-abierto` | Elevación de pantorrilla con barra, pies abiertos | 4 × 10 | barra |
| 8 | `pantorrilla-neutral` | Elevación de pantorrilla con barra, pies neutros | 4 × 10 | barra |
| 9 | `pantorrilla-cerrado` | Elevación de pantorrilla con barra, pies cerrados | 4 × 10 | barra |
| 10 | `pantorrilla-1pierna` | Elevación de pantorrilla a una pierna con mancuerna | 4 × 15 por pierna | mancuerna, unilateral |

**Volumen reducido** (opción en Ajustes): todo lo que dice 5 series pasa a 4. Se sugiere si la sesión dura más de 80 min o si se marca "No me recuperé" dos veces en una semana.

**Récords** (Progreso): `press-banca`, `press-inclinado-barra`, `jalon-abierto`, `remo-barra`, `press-militar`, `sentadilla`, `peso-muerto`.

---

## 9. Cardio

Todo es de **bajo impacto, sin saltos**. La intensidad base es la zona 2: poder hablar con frases completas, pero no cantar.

| ID | Sesión | Estructura | Duración |
|---|---|---|---|
| `post` | Post-gym | Caminadora inclinada al 8–12% a 5–5.5 km/h, o escaladora, en zona 2 | 20–25 min |
| `A` | Continua | Caminata rápida, bici estática o elíptica en zona 2 | 40 min |
| `B` | Circuito sin saltos | 5 min de calentamiento → 5 rondas de los 6 ejercicios (40 s de trabajo / 20 s de descanso), sin pausa entre rondas → 5 min de enfriamiento | 40 min |
| `C` | Intervalos | 5 min suave → 8 × (30 s fuerte / 90 s suave) → 5 min suave → 14 min de zona 2 | 40 min |
| `largo` | Largo del sábado | Caminata o bici en zona 2 | 45–60 min |

**Ejercicios del circuito B**, en este orden:

| # | ID | Ejercicio | Indicación |
|---|---|---|---|
| 1 | `b-sentadilla-silla` | Sentadilla a silla | Tocar la silla con los glúteos y subir, sin sentarse |
| 2 | `b-escalon` | Subir escalón | Alternar piernas; usar un escalón firme |
| 3 | `b-rodillas` | Marcha con rodillas altas | Sin saltar, braceo activo |
| 4 | `b-boxeo` | Boxeo de sombra | Golpes rápidos, pies en movimiento |
| 5 | `b-climbers` | Mountain climbers inclinados | Manos en el sillón, ritmo controlado |
| 6 | `b-plancha` | Plancha | Con rodillas apoyadas si hace falta |

**Semana sugerida de cardio en casa:**

| Lun | Mar | Mié | Jue | Vie | Sáb | Dom |
|---|---|---|---|---|---|---|
| A | B | A | C | A | Largo o B | Descanso (caminata ligera) |

Reglas:
- C máximo 2 veces por semana y nunca en días seguidos.
- Si duelen las rodillas o hay fatiga acumulada, cambiar B o C por A.

**Pasos:** meta de 8,000 a 10,000 al día. Se registran a mano en HOY.

---

## 10. Qué sí y qué no

**Sí, libremente:** agua natural (3 L o más), café sin azúcar, té, verduras de hoja y pepino (se pueden repetir), salsas sin aceite, limón, Tajín y especias.

**Sí, con medida:**
- Refresco o bebida cero: máximo 1 al día.
- Endulzante sin calorías: con moderación.
- **Comida flexible:** 1 por semana, una sola comida y no un día completo. Sugerida el domingo.

**No:**
- Refrescos normales y jugos (incluidos los "naturales").
- Pan dulce, galletas y postres.
- Frituras, empanizados y capeados.
- Botanas fuera de los bloques.
- Aderezos cremosos fuera del bloque de grasa.
- Cocinar con aceite sin medirlo: usar aerosol o 1 cdita medida.

---

## 11. Sugerencias automáticas (solo se muestran, nunca se aplican solas)

| Regla | Mensaje |
|---|---|
| El promedio semanal no baja en 2 semanas seguidas (y hay 4 o más registros por semana) | "Tu promedio no ha bajado en 2 semanas. Opciones: quitar 1 cereal de la cena o sumar 2,000 pasos diarios." |
| Después del día 28, baja más de 1.5 kg por semana 2 semanas seguidas | "Estás bajando muy rápido. Agrega 1 cereal en la comida para cuidar tu músculo." |
| Menos de 4 registros de peso en la semana | "Pésate al menos 4 mañanas por semana para que el promedio sea confiable." |
| 3 días seguidos con menos de 2 L de agua | "Llevas 3 días bajo 2 L de agua. Meta: 3 L." |
| 3 noches seguidas sin dormir a la hora meta | "Dormir menos de 7 h aumenta el hambre. Intenta adelantar 30 min hoy." |
| Sesión de gym de más de 80 min, 2 veces en la semana | "Tus sesiones pasan de 80 min. Prueba el volumen reducido en Ajustes." |

**Cómo pesarse:** en la mañana, después de ir al baño, antes de comer y con poca ropa. Lo que cuenta es el **promedio semanal**, no el número de un solo día. Medir la cintura cada 2 semanas a la altura del ombligo.

---

## 12. Suplementos

| Suplemento | Cuándo | Nota |
|---|---|---|
| Pre-entreno o café | 15–20 min antes del gym | Nada de cafeína después de las 14:00 |
| Creatina | Diario, junto con el pre-entreno | 5 g por defecto, editable. El PDF dice 8 g; 3–5 g es suficiente |
| Proteína iso | Después del gym, en el licuado del desayuno | Cuenta como los 3 bloques de proteína del desayuno |

---

## 13. Guía de medidas (sin báscula ni tazas medidoras)

| Medida | Equivale aproximadamente a |
|---|---|
| 1 taza (arroz, ensalada, fruta) | Un puño |
| 1 cucharada | El tamaño de tu pulgar |
| 1 cucharadita | La punta de tu dedo índice |
| 30 g de proteína cocida | La palma de la mano con el grosor del dedo meñique |
| 90 g de proteína cocida | La palma completa con su grosor total |

Las "tazas" y "cucharadas" del plan se refieren a tazas y cucharas medidoras, no a las de cocina comunes.
