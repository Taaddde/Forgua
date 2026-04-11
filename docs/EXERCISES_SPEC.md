# Forgua — Ejercicios y Lecciones: Especificación Completa

Este documento describe todos los tipos de ejercicio disponibles en Forgua, cómo se estructuran en JSON, y cómo combinarlos para crear lecciones y niveles de un idioma completo.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Dos sistemas de ejercicios](#2-dos-sistemas-de-ejercicios)
3. [Pasos de lección (LessonStep)](#3-pasos-de-lección-lessonstep)
4. [Ejercicios SRS (Exercise)](#4-ejercicios-srs-exercise)
5. [Nuevo: Conversaciones](#5-nuevo-conversaciones)
6. [Estructura de una lección completa](#6-estructura-de-una-lección-completa)
7. [Tabla de decisión pedagógica](#7-tabla-de-decisión-pedagógica)
8. [Nomenclatura de archivos y orden](#8-nomenclatura-de-archivos-y-orden)
9. [Errores comunes a evitar](#9-errores-comunes-a-evitar)

---

## 1. Arquitectura general

```
src/packs/<pack-id>/
  manifest.json
  vocabulary/<level>.json
  grammar/<level>.json
  characters/<sistema>.json
  characters/<sistema>/<level>.json
  readings/<level>.json
  conversations/<level>.json     ← NUEVO
  lessons/
    index.json                   ← índice de todas las lecciones
    <id>.json                    ← una lección por archivo
  roadmaps.json
  resources.json
```

Un **Language Pack** = datos en JSON. Cero código. Las lecciones orquestan los ejercicios. Los ejercicios activan las tarjetas en el SRS.

**Flujo del aprendiz:**
1. Completa **lecciones** → aprende items nuevos → se agregan al SRS
2. Hace **repaso SRS diario** → ejercicios de repaso → el motor SM-2 programa cuándo volver a ver cada tarjeta

---

## 2. Dos sistemas de ejercicios

### Sistema A — Pasos de lección (`LessonStep`)

Se usan **dentro de una lección** para introducir y practicar items nuevos. Están controlados por el `LessonPlayer`. Operan sobre los `items[]` de la lección (referencias a tarjetas).

**Tipos disponibles:**
| Tipo | Descripción |
|------|-------------|
| `introduce` | Presentación del item (texto, audio, imagen, explicación) — sin respuesta |
| `recognize` | Multiple choice: ver el front, elegir el back |
| `recall` | Escribir la respuesta libre (ver back, escribir front) |
| `write` | Variante de recall para caracteres |
| `sentence-build` | Armar una oración reordenando fragmentos |
| `listen-identify` | Escuchar audio, elegir la palabra correcta |
| `listen-transcribe` | Escuchar audio, escribir lo que se oye (dictado) |
| `speak` | Leer en voz alta, evalúa pronunciación via STT |
| `summary` | Pantalla de resumen — no es ejercicio, no tiene respuesta |

### Sistema B — Ejercicios SRS (`Exercise`)

Se usan en el **repaso diario** y en ejercicios estándalones fuera de lecciones. Operan sobre tarjetas (`Card`) ya en el SRS.

**Tipos disponibles:**
| Tipo | Componente | Descripción |
|------|-----------|-------------|
| `flashcard` | FlashCard | Ver frente → revelar dorso → autoevaluar |
| `multiple-choice` | MultipleChoice | 4 opciones, elegir la correcta |
| `write-answer` | WriteAnswer | Campo de texto libre, evaluación fuzzy |
| `fill-blank` | FillBlank | Completar UN espacio (con opciones o libre) |
| `fill-blank-multi` | ClozeMulti | Completar MÚLTIPLES espacios |
| `drag-reorder` | DragReorder | Ordenar fragmentos en secuencia correcta |
| `matching` | Matching | Emparejar columna izquierda con columna derecha |
| `dictation` | Dictation | Escuchar audio → escribir lo que se oye |
| `speak` | SpeakExercise | Leer en voz alta → feedback de pronunciación |
| `sentence-build` | SentenceBuild | Armar oración desde fragmentos dados + traducción |
| `image-association` | ImageAssociation | Ver imagen → elegir la palabra/frase |
| `word-in-context` | WordInContext | Palabra objetivo → elegir la oración donde se usa bien |
| `error-correction` | ErrorCorrection | ¿Esta oración tiene error? → sí/no → explicación |
| `conversation-script` | ConversationScript | Diálogo guiado por turnos |
| `story-comprehension` | StoryComprehension | Leer texto → preguntas de comprensión |

---

## 3. Pasos de lección (`LessonStep`)

Cada lección tiene un array `steps`. Cada step tiene:
- `type` — el tipo de paso
- `title` — título visible al aprendiz
- `instruction` — instrucción breve
- `itemIndices` — qué items de la lección usa (índices en `lesson.items[]`)
- `config` — configuración extra (opcional)

### 3.1 `introduce`

Muestra el item: front, back, reading, explicación, audio (si hay). El aprendiz no responde nada. Es pura exposición al input comprensible.

```jsonc
{
  "type": "introduce",
  "title": "Nuevas palabras",
  "instruction": "Leé cada palabra, escuchá su pronunciación y la explicación.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**Cuándo usar:** Siempre como primer paso de cualquier lección. Nunca omitirlo.

---

### 3.2 `recognize`

Multiple choice: se muestra el `front` del item, el aprendiz elige entre 4 opciones cuál es el `back` correcto. Las 3 opciones incorrectas se generan automáticamente del mismo grupo de items.

```jsonc
{
  "type": "recognize",
  "title": "¿Qué significa?",
  "instruction": "Elegí el significado correcto de cada palabra.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**Cuándo usar:** Segundo paso, siempre después de `introduce`. Consolida reconocimiento.

---

### 3.3 `recall`

Muestra el `back` del item. El aprendiz escribe el `front` en el idioma meta. El adaptador normaliza y compara (romaji→kana, etc.).

```jsonc
{
  "type": "recall",
  "title": "¿Cómo se dice?",
  "instruction": "Escribí la palabra en japonés. Podés usar romaji.",
  "itemIndices": [0, 1, 2, 3]
}
```

**Cuándo usar:** Tercer o cuarto paso. Requiere producción activa. Ideal para vocabulario y caracteres básicos.

---

### 3.4 `sentence-build`

Muestra la traducción de una oración. El aprendiz arrastra/clica fragmentos en el orden correcto para construirla.

```jsonc
{
  "type": "sentence-build",
  "title": "Armá la oración",
  "instruction": "Ordená las palabras para formar la oración correcta.",
  "itemIndices": [2],
  "config": {
    "sentences": [
      {
        "translation": "Yo como arroz todos los días.",
        "fragments": ["私は", "毎日", "ご飯を", "食べます"],
        "correctOrder": [0, 1, 2, 3]
      }
    ]
  }
}
```

**Cuándo usar:** Ideal para gramática. Siempre después de `introduce` y `recognize`.

---

### 3.5 `listen-identify`

Reproduce el audio del item. El aprendiz elige entre 4 opciones cuál es la palabra que escuchó.

```jsonc
{
  "type": "listen-identify",
  "title": "Escuchá y elegí",
  "instruction": "¿Cuál de estas palabras escuchás?",
  "itemIndices": [0, 1, 2, 3]
}
```

**Cuándo usar:** Para vocabulario con audio. Entrena el oído antes de pasar a recall.

---

### 3.6 `listen-transcribe`

Reproduce el audio. El aprendiz escribe lo que escucha (dictado).

```jsonc
{
  "type": "listen-transcribe",
  "title": "Escuchá y escribí",
  "instruction": "Escuchá la pronunciación y escribí la palabra.",
  "itemIndices": [0, 1, 2]
}
```

**Cuándo usar:** Después de `listen-identify`. Más exigente. Recomendado para caracteres y vocabulario.

---

### 3.7 `speak`

Muestra el texto objetivo. El aprendiz lo lee en voz alta. STT evalúa pronunciación.

```jsonc
{
  "type": "speak",
  "title": "Pronunciá",
  "instruction": "Leé el texto en voz alta. Se evaluará tu pronunciación.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**Cuándo usar:** Opcional. Requiere micrófono. Funciona solo en Chrome/Edge. Poner siempre al final de la lección.

---

### 3.8 `summary`

Pantalla de cierre. Resume lo aprendido. No tiene respuesta ni evaluación.

```jsonc
{
  "type": "summary",
  "title": "¡Lección completada!",
  "instruction": "Estas 5 palabras ahora están en tu repaso. Las verás de nuevo mañana.",
  "itemIndices": [0, 1, 2, 3, 4]
}
```

**Cuándo usar:** Siempre como último paso. Obligatorio.

---

## 4. Ejercicios SRS (`Exercise`)

Estos ejercicios se definen en los archivos de contenido del pack o son generados automáticamente por el motor a partir de las tarjetas. Los que necesitan ser definidos explícitamente en el pack son los que tienen datos específicos que el motor no puede generar solo.

### 4.1 `fill-blank` — Un solo espacio

Usa `___` como marcador en el texto.

```json
{
  "type": "fill-blank",
  "data": {
    "sentence": "毎日ご飯を___。",
    "options": ["食べます", "飲みます", "行きます", "来ます"],
    "correctAnswer": "食べます"
  }
}
```

**Reglas:**
- Exactamente un `___` en el texto
- Si hay `options` → chips de selección; si no hay → campo de texto libre
- Para texto libre, el adaptador normaliza antes de comparar

---

### 4.2 `fill-blank-multi` — Múltiples espacios

Usa `{0}`, `{1}`, `{2}` como marcadores numerados en el template.

```json
{
  "type": "fill-blank-multi",
  "data": {
    "template": "{0}は毎日学校に{1}。",
    "blanks": [
      {
        "answer": "私",
        "options": ["私", "あなた", "彼", "彼女"]
      },
      {
        "answer": "行きます",
        "options": ["行きます", "来ます", "食べます", "寝ます"]
      }
    ]
  }
}
```

**Reglas:**
- Los marcadores `{0}`, `{1}` van en orden estricto sin saltar números
- Cada blank puede tener `options` (MC) o no tenerlas (texto libre)
- Mezclar MC y libre en el mismo ejercicio está permitido
- Mínimo 2 blanks (si hay 1, usar `fill-blank`)

---

### 4.3 `matching` — Emparejar columnas

```json
{
  "type": "matching",
  "data": {
    "pairs": [
      { "left": "食べる", "right": "comer" },
      { "left": "飲む", "right": "beber" },
      { "left": "行く", "right": "ir" },
      { "left": "来る", "right": "venir" },
      { "left": "見る", "right": "ver" }
    ]
  }
}
```

**Reglas:**
- Mínimo 3 pares, máximo 8
- Los items de la columna derecha se barajan automáticamente
- Ideal para vocabulario nuevo: 5 palabras del mismo nivel/categoría

---

### 4.4 `drag-reorder` — Ordenar fragmentos

```json
{
  "type": "drag-reorder",
  "data": {
    "prompt": "Ordená las palabras para formar 'Yo como arroz todos los días'",
    "fragments": ["私は", "ご飯を", "毎日", "食べます"],
    "correctOrder": [0, 2, 1, 3]
  }
}
```

**Reglas:**
- `correctOrder` son los índices de `fragments` en el orden correcto
- En el ejemplo: posición 0 → índice 0 ("私は"), posición 1 → índice 2 ("毎日"), etc.
- Mínimo 3 fragmentos, máximo 8
- Para oraciones largas, fragmentar por palabras o grupos gramaticales, NO por caracteres

---

### 4.5 `image-association` — Imagen → palabra

```json
{
  "type": "image-association",
  "data": {
    "imageUrl": "images/n5/taberu.jpg",
    "imageAlt": "Persona comiendo",
    "options": ["食べる (comer)", "飲む (beber)", "寝る (dormir)", "走る (correr)"],
    "correctIndex": 0
  }
}
```

**Reglas:**
- `imageUrl` es relativo a la raíz del pack
- Las imágenes van en `images/` dentro del pack
- `imageAlt` es obligatorio (accesibilidad)
- Siempre 4 opciones
- Muy efectivo para vocabulario concreto: objetos, acciones, lugares, animales, comida

---

### 4.6 `word-in-context` — Elegir la oración correcta

```json
{
  "type": "word-in-context",
  "data": {
    "targetWord": "食べる",
    "translation": "comer",
    "options": [
      "私は毎日本を食べます。",
      "毎朝コーヒーを食べます。",
      "私は昼ご飯を食べます。",
      "学校に食べます。"
    ],
    "correctIndex": 2
  }
}
```

**Reglas:**
- Las 3 opciones incorrectas deben tener errores reales, no absurdos
- Categorías de errores útiles: palabra equivocada, partícula incorrecta, orden incorrecto, registro inadecuado
- Las oraciones deben ser del mismo nivel o uno más bajo
- Ideal para N3 en adelante; en N5/N4 usarlo con moderación

---

### 4.7 `error-correction` — ¿Esta oración tiene error?

```json
{
  "type": "error-correction",
  "data": {
    "sentence": "私は学校に食べます。",
    "isCorrect": false,
    "correction": "私は学校に行きます。",
    "explanation": "食べます (comer) no tiene sentido aquí. El verbo correcto es 行きます (ir).",
    "errorType": "wrong-verb"
  }
}
```

También puede ser una oración correcta:

```json
{
  "type": "error-correction",
  "data": {
    "sentence": "彼女は毎日学校に行きます。",
    "isCorrect": true,
    "explanation": "La oración es correcta. 彼女 (ella) + は (partícula de tema) + 毎日 (todos los días) + 学校に (a la escuela) + 行きます (va).",
    "errorType": "particle"
  }
}
```

**Reglas:**
- `errorType` es una etiqueta libre pero consistente. Valores recomendados: `particle`, `conjugation`, `word-order`, `wrong-verb`, `wrong-adjective`, `register`, `missing-particle`
- En una serie de `error-correction`, mezclar oraciones correctas e incorrectas (50/50 aprox.)
- La explicación debe ser pedagógica: NO solo decir qué está mal, sino POR QUÉ
- Ideal para N3 en adelante; en N5 solo para errores muy comunes y claros

---

### 4.8 `story-comprehension` — Leer texto + responder preguntas

Este ejercicio usa el schema de `ReadingText` del pack (archivo `readings/<level>.json`). La lección referencia el texto por su `id`.

```jsonc
// En readings/n5.json — definición del texto
{
  "id": "n5-uchi-no-kazoku",
  "title": "Mi familia",
  "level": "n5",
  "text": "私は田中太郎です。家族は四人います。父と母と姉と私です。父は会社員で、母は先生です。姉は大学生です。私は高校生です。",
  "reading": "わたしはたなかたろうです。かぞくはよにんいます。ちちとははとあねとわたしです...",
  "translation": "Soy Taro Tanaka. Mi familia tiene cuatro personas. Mi padre, mi madre, mi hermana mayor y yo. Mi padre es oficinista y mi madre es profesora. Mi hermana es universitaria. Yo soy estudiante de secundaria.",
  "vocabulary": ["家族", "父", "母", "姉", "会社員", "先生", "大学生", "高校生"],
  "questions": [
    {
      "question": "¿Cuántas personas tiene la familia de Taro?",
      "options": ["2 personas", "3 personas", "4 personas", "5 personas"],
      "correctIndex": 2,
      "explanation": "家族は四人います = la familia tiene cuatro personas (四 = 4)"
    },
    {
      "question": "¿Cuál es la profesión de la madre?",
      "options": ["Oficinista", "Profesora", "Universitaria", "Doctora"],
      "correctIndex": 1,
      "explanation": "母は先生です = la madre es profesora (先生 = sensei = maestro/a)"
    },
    {
      "question": "¿Qué es Taro?",
      "options": ["Universitario", "Oficinista", "Profesor", "Estudiante de secundaria"],
      "correctIndex": 3,
      "explanation": "私は高校生です = yo soy estudiante de secundaria (高校生 = high school student)"
    }
  ]
}
```

**Reglas:**
- Mínimo 2 preguntas, máximo 5
- Las preguntas deben ser respondibles SOLO con la información del texto, nunca con conocimiento externo
- Las opciones incorrectas deben ser plausibles, no absurdas
- El texto debe usar únicamente vocabulario y gramática del nivel declarado o uno inferior

---

## 5. Nuevo: Conversaciones

Las conversaciones son diálogos guiados. El aprendiz **elige** entre 2-4 opciones lo que su personaje diría. No escribe libremente — esto elimina falsos negativos y frustraciones.

### 5.1 Archivo de conversaciones

`conversations/<level>.json` — array de `ConversationScript`.

```jsonc
[
  {
    "id": "n5-tienda-compras",
    "scenario": "En una tienda de ropa",
    "level": "n5",
    "tags": ["shopping", "daily-life", "polite-speech"],
    "turns": [
      {
        "speaker": "npc",
        "text": "いらっしゃいませ！",
        "translation": "¡Bienvenido/a!",
        "audio": "audio/conversations/irasshaimase.mp3"
      },
      {
        "speaker": "learner",
        "text": "",
        "options": [
          {
            "text": "Tシャツを探しています。",
            "isCorrect": true,
            "feedback": "Correcto. 探しています (sagashite imasu) = 'estoy buscando'. Forma perfecta para pedir ayuda.",
            "translation": "Estoy buscando una camiseta."
          },
          {
            "text": "ありがとうございます。",
            "isCorrect": false,
            "feedback": "ありがとう es 'gracias'. No tiene sentido como respuesta al saludo del vendedor en esta situación.",
            "translation": "Muchas gracias."
          },
          {
            "text": "さようなら。",
            "isCorrect": false,
            "feedback": "さようなら es 'adiós'. No podés despedirte antes de entrar.",
            "translation": "Adiós."
          }
        ],
        "correctOptionIndex": 0
      },
      {
        "speaker": "npc",
        "text": "はい、こちらにございます。何色がよろしいですか？",
        "translation": "Sí, están aquí. ¿Qué color prefiere?",
        "audio": "audio/conversations/nani-iro.mp3"
      },
      {
        "speaker": "learner",
        "text": "",
        "options": [
          {
            "text": "青いのをお願いします。",
            "isCorrect": true,
            "feedback": "Perfecto. 青い (aoi) = azul + の = nominaliza + をお願いします = la manera educada de pedir.",
            "translation": "La azul, por favor."
          },
          {
            "text": "私は学生です。",
            "isCorrect": false,
            "feedback": "Decir 'soy estudiante' no responde la pregunta sobre el color.",
            "translation": "Soy estudiante."
          },
          {
            "text": "食べ物が好きです。",
            "isCorrect": false,
            "feedback": "Hablar de comida no tiene relación con la pregunta del vendedor.",
            "translation": "Me gusta la comida."
          },
          {
            "text": "赤いのをお願いします。",
            "isCorrect": true,
            "feedback": "También es correcto. Rojo (赤い = akai) con la misma estructura educada.",
            "translation": "La roja, por favor."
          }
        ],
        "correctOptionIndex": 0
      }
    ]
  }
]
```

### 5.2 Reglas de conversaciones

**Cantidad de opciones:** 2-4 por turno del aprendiz. 3 es ideal.

**Una sola respuesta correcta vs. múltiples:** Se puede tener más de una `isCorrect: true`. En ese caso, el sistema marca bien cualquiera de las correctas. Usarlo cuando hay variantes igualmente válidas (como rojo/azul en el ejemplo). `correctOptionIndex` debe apuntar a la más recomendada para el feedback de la UI.

**Calidad de las opciones incorrectas:** NO inventar errores absurdos. Las opciones incorrectas deben ser:
- Palabras reales del nivel del aprendiz
- Gramaticalmente posibles pero contextualmente incorrectas
- Que ilustren confusiones reales (registro equivocado, respuesta no contextual, etc.)

**Los turnos NPC:** Siempre incluir `translation`. El `audio` es opcional pero recomendado cuando hay archivos de audio en el pack.

**Longitud:** 4-8 turnos por conversación. No más de 10. Demasiado largo fatiga.

**Nivel del vocabulario:** Todos los textos del NPC y opciones del aprendiz deben usar vocabulario del nivel declarado o inferior. Una conversación N5 no puede tener vocabulario N3.

---

## 6. Estructura de una lección completa

### 6.1 `lessons/index.json`

```json
{
  "lessons": [
    {
      "id": "hiragana-01",
      "title": "Hiragana: あ行",
      "description": "Las 5 primeras vocales del hiragana",
      "level": "n5",
      "category": "characters",
      "order": 1,
      "prerequisites": [],
      "estimatedMinutes": 10,
      "newItemCount": 5
    },
    {
      "id": "vocab-n5-01",
      "title": "Saludos básicos",
      "description": "Las 8 palabras de supervivencia para empezar",
      "level": "n5",
      "category": "vocabulary",
      "order": 11,
      "prerequisites": ["hiragana-01", "hiragana-02"],
      "estimatedMinutes": 12,
      "newItemCount": 8
    }
  ]
}
```

**Reglas de `order`:** Ordenar ascendente dentro de cada nivel. El motor los muestra en este orden. Las lecciones de hiragana van primero (1-10), luego vocabulario (11+), luego gramática (21+), etc.

**`prerequisites`:** Array de `id` de lecciones que deben estar completadas antes. Vacío (`[]`) para la primera lección. No crear dependencias circulares.

---

### 6.2 `lessons/<id>.json` — Anatomía de una lección

```jsonc
{
  "id": "vocab-n5-01",           // ← igual al nombre del archivo sin .json
  "title": "Saludos básicos",
  "description": "Las 8 palabras de supervivencia para empezar",
  "level": "n5",
  "category": "vocabulary",      // vocabulary | characters | grammar | mixed

  // Items introducidos en esta lección
  "items": [
    {
      "front": "こんにちは",          // Lo que el SRS muestra al frente
      "back": "hola / buenas tardes", // La respuesta
      "reading": "konnichiwa",        // Lectura fonética (obligatorio para CJK)
      "explanation": "El saludo más universal. Se usa desde mediodía hasta la tarde.",
      "mnemonic": "Suena como 'con ni chi wa'",  // Opcional
      "imageUrl": "images/n5/konnichiwa.jpg",     // Opcional
      "audio": "audio/n5/konnichiwa.mp3",         // Opcional
      "cardRef": {
        "category": "vocabulary",    // Debe coincidir con la categoría del item
        "front": "こんにちは"          // Debe coincidir exactamente con vocabulary/n5.json
      }
    }
  ],

  // Pasos de la lección en orden
  "steps": [...]
}
```

**Importante:** `cardRef.front` debe coincidir **exactamente** (mismo texto) con el campo `word` en `vocabulary/<level>.json`, `character` en `characters/`, o `front` en grammar. Si no coincide, el item no se agrega al SRS.

---

### 6.3 Secuencias de pasos recomendadas por categoría

#### Vocabulario (5-10 palabras nuevas)

```
introduce → recognize → listen-identify → recall → [speak] → summary
```

#### Vocabulario con imagen

```
introduce → recognize → listen-identify → recall → summary
```
*(El `introduce` muestra la imagen, el `recognize` también)*

#### Caracteres/Kana (5 caracteres nuevos)

```
introduce → recognize → listen-identify → recall → listen-transcribe → [speak] → summary
```

#### Gramática (1-3 patrones)

```
introduce → introduce (ejemplo completo) → recognize → sentence-build → recall → summary
```
*(Dos `introduce` es normal para gramática: primero las piezas, luego el patrón completo)*

#### Mixta (vocabulario + gramática)

```
introduce → recognize → sentence-build → recall → summary
```

#### Conversación (referencia a conversations/)

Las conversaciones NO son lecciones: son ejercicios independientes. Se accederán desde la sección de práctica de conversación, no desde el flujo de lecciones estándar.

---

## 7. Tabla de decisión pedagógica

| Objetivo de aprendizaje | Tipo de ejercicio principal | Tipo de ejercicio secundario |
|------------------------|---------------------------|------------------------------|
| Vocabulario nuevo, reconocimiento | `recognize` (MC) | `matching` |
| Vocabulario nuevo, producción | `recall` (write) | `fill-blank` |
| Uso de vocabulario en contexto | `word-in-context` | `fill-blank-multi` |
| Gramática, estructura | `sentence-build` | `drag-reorder` |
| Gramática, corrección | `error-correction` | `fill-blank-multi` |
| Caracteres, reconocimiento | `recognize` (MC) | `matching` |
| Caracteres, escritura | `recall` + `write` | `character-draw` |
| Comprensión auditiva | `listen-identify` | `dictation` |
| Comprensión lectora | `story-comprehension` | — |
| Producción oral | `speak` | — |
| Comunicación situacional | `conversation-script` | — |
| Asociación visual | `image-association` | — |

---

### Cuándo introducir cada tipo de ejercicio por nivel

| Nivel | Tipos disponibles |
|-------|------------------|
| Principiante absoluto (A1/N5) | `introduce`, `recognize`, `listen-identify`, `recall`, `matching`, `fill-blank` |
| Principiante (A2/N4) | + `sentence-build`, `drag-reorder`, `fill-blank-multi`, `image-association`, `conversation-script` |
| Intermedio bajo (B1/N3) | + `word-in-context`, `error-correction`, `story-comprehension` |
| Intermedio (B2/N2) | Todos los tipos disponibles |
| Avanzado (C1+/N1) | Todos, con mayor complejidad por ejercicio |

---

## 8. Nomenclatura de archivos y orden

### Archivos de lecciones

| Patrón | Categoría | Ejemplo |
|--------|-----------|---------|
| `hiragana-NN.json` | Caracteres hiragana | `hiragana-01.json` |
| `katakana-NN.json` | Caracteres katakana | `katakana-01.json` |
| `kanji-N5-NN.json` | Kanji por nivel | `kanji-n5-01.json` |
| `vocab-N5-NN.json` | Vocabulario por nivel | `vocab-n5-01.json` |
| `grammar-N5-NN.json` | Gramática por nivel | `grammar-n5-01.json` |
| `reading-N5-NN.json` | Práctica de lectura | `reading-n5-01.json` |

Para idiomas con CEFR: `vocab-a1-01.json`, `grammar-b2-03.json`, etc.

### Orden de lecciones dentro de un nivel N5 (ejemplo japonés)

```
1–10:   hiragana (5 vocales por lección = 2 lecciones, luego grupos de consonantes)
11–15:  katakana (misma estructura)
16–20:  primeras palabras en hiragana/katakana
21–40:  vocabulario N5 (8-10 palabras por lección)
41–55:  gramática N5 (1-2 patrones por lección)
56–60:  lecturas cortas N5 (1 texto por lección)
```

### Cuántas lecciones por nivel

| Nivel | Cantidad sugerida | Ítems nuevos por lección |
|-------|-------------------|--------------------------|
| N5 / A1 | 50-70 lecciones | 5-10 items |
| N4 / A2 | 60-80 lecciones | 8-12 items |
| N3 / B1 | 80-100 lecciones | 10-15 items |
| N2 / B2 | 100+ lecciones | 10-15 items |
| N1 / C1 | 100+ lecciones | 10-20 items |

---

## 9. Errores comunes a evitar

### En lecciones

❌ **Omitir `introduce`** — El motor no puede practicar lo que no se presentó.

❌ **`itemIndices` fuera de rango** — Si la lección tiene 5 items (índices 0-4), no poner `itemIndices: [5]`.

❌ **`cardRef.front` que no existe** — Si el vocabulario no está en `vocabulary/n5.json`, el item no se agrega al SRS. Verificar que el texto sea exactamente igual.

❌ **Demasiados items por lección** — Máximo 15. La memoria de trabajo tiene límite. Para vocabulario, 8-10 es el sweet spot.

❌ **Lección sin `summary`** — El `summary` es el que marca la lección como completada.

### En ejercicios

❌ **`fill-blank-multi` con `{0}` y `{2}` sin `{1}`** — Los índices deben ser consecutivos desde 0.

❌ **`error-correction` con solo oraciones incorrectas** — Incluir mezcla de correctas e incorrectas para que el ejercicio no sea trivial.

❌ **`matching` con pares que comparten parte del mismo texto** — El aprendiz puede usar la coincidencia visual en vez de el conocimiento real.

❌ **`word-in-context` con opciones incorrectas absurdas** — "私は空を食べます" (como la comida, el cielo) es una distracción obvia que no entrena razonamiento real. Los distractores deben ser plausibles.

### En conversaciones

❌ **Turno del aprendiz con solo una opción** — Mínimo 2 opciones, máximo 4.

❌ **Vocabulario del NPC fuera del nivel** — Si la conversación es N5, el NPC no puede usar palabras N3.

❌ **`correctOptionIndex` incorrecto** — Verificar que apunta a la opción con `isCorrect: true`.

❌ **Sin `translation` en los turnos del NPC** — El aprendiz necesita entender qué le está diciendo el NPC para poder responder.

---

## Apéndice: Template de prompt para IA generadora

```
Eres un especialista en didáctica de idiomas. Genera contenido JSON para un Language Pack de Forgua.

IDIOMA OBJETIVO: [IDIOMA]
NIVEL: [NIVEL] (ej: n5, a1, b2)
FAMILIA DE ESCRITURA: [FAMILIA] (cjk-japanese | cjk-chinese | hangul | latin | cyrillic | arabic | devanagari)
IDIOMA DE INSTRUCCIÓN: Español

TIPO DE CONTENIDO A GENERAR: [TIPO]

Opciones para [TIPO]:
A) vocabulary/<nivel>.json — vocabulario
B) grammar/<nivel>.json — gramática
C) characters/<sistema>.json — caracteres
D) readings/<nivel>.json — textos de lectura con comprensión
E) conversations/<nivel>.json — diálogos guiados
F) lessons/<id>.json — una lección completa
G) lessons/index.json — índice de lecciones

REGLAS CRÍTICAS:
1. PRECISIÓN OBLIGATORIA. Si no estás seguro de una lectura, un significado o una conjugación, omitilo o marcalo con un comentario.
2. FUENTES DE REFERENCIA MENTAL: JMdict para japonés, CC-CEDICT para chino, diccionarios TOPIK para coreano, CEFR para europeos.
3. EJEMPLOS NATURALES. Las oraciones de ejemplo deben sonar como lo que dice un hablante real, no un libro de texto de los 80.
4. SIGNIFICADOS EN ESPAÑOL PRIMERO.
5. NO INVENTAR PALABRAS NI NIVELES. Una palabra "común" no es necesariamente N5. Verificar contra listas oficiales.
6. PARA CONVERSACIONES: Las opciones incorrectas del aprendiz deben ser plausibles pero contextualmente erróneas. No absurdas.

FORMATO DE SALIDA: JSON válido sin comentarios en el output final.

Genera [CANTIDAD] entradas/lecciones para [IDIOMA] nivel [NIVEL], tipo [TIPO].
```

---

*Documento mantenido por el equipo de Forgua. Última actualización: ver historial de git.*
