# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lesson-hiragana-01.spec.ts >> Hiragana-01 lesson >> complete hiragana-01 lesson end-to-end
- Location: e2e/lesson-hiragana-01.spec.ts:10:3

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
  4  | test.describe('Hiragana-01 lesson', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await clearIndexedDB(page);
  7  |     await installJapanesePack(page);
  8  |   });
  9  | 
  10 |   test('complete hiragana-01 lesson end-to-end', async ({ page }) => {
  11 |     test.setTimeout(90_000);
  12 | 
  13 |     // Navigate to lessons
  14 |     await page.goto('/lessons');
  15 |     await page.waitForTimeout(2000);
  16 | 
  17 |     // Find and click hiragana-01 (あ行)
  18 |     const lesson = page.locator('button', { hasText: 'あ行' });
> 19 |     await expect(lesson).toBeVisible({ timeout: 5000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  20 |     await lesson.click();
  21 | 
  22 |     // Step 1: Introduce — should see first character "あ"
  23 |     await expect(page.locator('text=あ')).toBeVisible({ timeout: 5000 });
  24 | 
  25 |     // Navigate through 5 introduce items
  26 |     for (let i = 0; i < 5; i++) {
  27 |       const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
  28 |       if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  29 |         await nextBtn.click();
  30 |         await page.waitForTimeout(500);
  31 |       }
  32 |     }
  33 | 
  34 |     // Step 2: Recognize — multiple choice for items
  35 |     await page.waitForTimeout(500);
  36 |     for (let i = 0; i < 5; i++) {
  37 |       const optionButtons = page.locator('.max-w-md button:not([disabled])');
  38 |       const count = await optionButtons.count();
  39 |       if (count > 0) {
  40 |         await optionButtons.first().click();
  41 |         await page.waitForTimeout(600);
  42 | 
  43 |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  44 |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  45 |           await nextBtn.click();
  46 |           await page.waitForTimeout(300);
  47 |         }
  48 |       }
  49 |     }
  50 | 
  51 |     // Step 3: Recall — type romaji for each character
  52 |     const romajiAnswers = ['a', 'i', 'u', 'e', 'o'];
  53 |     for (let i = 0; i < 5; i++) {
  54 |       const input = page.locator('input[type="text"]');
  55 |       if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
  56 |         await input.fill(romajiAnswers[i] ?? 'test');
  57 | 
  58 |         const checkBtn = page.getByRole('button', { name: /check|verificar/i });
  59 |         if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  60 |           await checkBtn.click();
  61 |           await page.waitForTimeout(500);
  62 |         }
  63 | 
  64 |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  65 |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  66 |           await nextBtn.click();
  67 |           await page.waitForTimeout(300);
  68 |         }
  69 |       }
  70 |     }
  71 | 
  72 |     // Step 4: Write — type romaji (now accepted after bug fix)
  73 |     for (let i = 0; i < 5; i++) {
  74 |       const input = page.locator('input[type="text"]');
  75 |       if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
  76 |         await input.fill(romajiAnswers[i] ?? 'test');
  77 | 
  78 |         const checkBtn = page.getByRole('button', { name: /check|verificar/i });
  79 |         if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  80 |           await checkBtn.click();
  81 |           await page.waitForTimeout(500);
  82 |         }
  83 | 
  84 |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  85 |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  86 |           await nextBtn.click();
  87 |           await page.waitForTimeout(300);
  88 |         }
  89 |       }
  90 |     }
  91 | 
  92 |     // Step 5: Summary — should show score
  93 |     await page.waitForTimeout(1000);
  94 |     const summaryVisible = await page.locator('text=/\\d+%/').isVisible({ timeout: 5000 }).catch(() => false);
  95 |     const completeVisible = await page.locator('text=/completa|complete/i').isVisible({ timeout: 3000 }).catch(() => false);
  96 |     expect(summaryVisible || completeVisible).toBeTruthy();
  97 |   });
  98 | });
  99 | 
```