# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recognize-no-answer-leak.spec.ts >> RecognizeStep answer visibility >> reading is NOT shown alongside the character in recognize step
- Location: e2e/recognize-no-answer-leak.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'あ行' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'あ行' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Skip to content" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - navigation "Main navigation" [ref=e5]:
    - generic [ref=e7]:
      - img [ref=e8]
      - generic [ref=e12]: LinguaForge
    - navigation [ref=e13]:
      - link "Panel" [ref=e14] [cursor=pointer]:
        - /url: /
        - img [ref=e15]
        - generic [ref=e20]: Panel
      - link "Lecciones" [ref=e21] [cursor=pointer]:
        - /url: /lessons
        - img [ref=e22]
        - generic [ref=e24]: Lecciones
      - link "Estudiar" [ref=e25] [cursor=pointer]:
        - /url: /study
        - img [ref=e26]
        - generic [ref=e29]: Estudiar
      - link "Aprender" [ref=e30] [cursor=pointer]:
        - /url: /learn
        - img [ref=e31]
        - generic [ref=e33]: Aprender
      - link "Explorar" [ref=e34] [cursor=pointer]:
        - /url: /browse
        - img [ref=e35]
        - generic [ref=e37]: Explorar
      - link "Lectura" [ref=e38] [cursor=pointer]:
        - /url: /reading
        - img [ref=e39]
        - generic [ref=e41]: Lectura
      - link "Escucha" [ref=e42] [cursor=pointer]:
        - /url: /listening
        - img [ref=e43]
        - generic [ref=e45]: Escucha
      - link "Hablar" [ref=e46] [cursor=pointer]:
        - /url: /speaking
        - img [ref=e47]
        - generic [ref=e50]: Hablar
      - link "Escritura" [ref=e51] [cursor=pointer]:
        - /url: /writing
        - img [ref=e52]
        - generic [ref=e57]: Escritura
      - link "Ruta" [ref=e58] [cursor=pointer]:
        - /url: /roadmap
        - img [ref=e59]
        - generic [ref=e61]: Ruta
    - link "Ajustes" [ref=e63] [cursor=pointer]:
      - /url: /settings
      - img [ref=e64]
      - generic [ref=e67]: Ajustes
  - generic [ref=e68]:
    - banner [ref=e69]:
      - 'button "Theme: dark" [ref=e70]':
        - img [ref=e71]
    - main [ref=e73]:
      - generic [ref=e74]:
        - img [ref=e75]
        - heading "Seleccioná un pack primero" [level=2] [ref=e77]
        - button "Elegí tu idioma" [ref=e78]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { clearIndexedDB, installJapanesePack } from './helpers';
  3  | 
  4  | test.describe('RecognizeStep answer visibility', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await clearIndexedDB(page);
  7  |     await installJapanesePack(page);
  8  |   });
  9  | 
  10 |   test('reading is NOT shown alongside the character in recognize step', async ({ page }) => {
  11 |     await page.goto('/lessons');
  12 |     await page.waitForTimeout(2000);
  13 | 
  14 |     const lesson = page.locator('button', { hasText: 'あ行' });
> 15 |     await expect(lesson).toBeVisible({ timeout: 5000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  16 |     await lesson.click();
  17 |     await page.waitForTimeout(1000);
  18 | 
  19 |     // Advance past Introduce step (5 items)
  20 |     for (let i = 0; i < 5; i++) {
  21 |       const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
  22 |       if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  23 |         await nextBtn.click();
  24 |         await page.waitForTimeout(300);
  25 |       }
  26 |     }
  27 | 
  28 |     // Now in RecognizeStep — the prompt card should show "あ" but NOT "a" as a hint
  29 |     await page.waitForTimeout(500);
  30 |     const card = page.locator('.rounded-2xl.p-8');
  31 |     await expect(card).toBeVisible({ timeout: 3000 });
  32 | 
  33 |     // Check that there's no small reading hint text inside the card
  34 |     const readingHint = card.locator('span.text-sm.text-slate-500');
  35 |     await expect(readingHint).toHaveCount(0);
  36 |   });
  37 | });
  38 | 
```