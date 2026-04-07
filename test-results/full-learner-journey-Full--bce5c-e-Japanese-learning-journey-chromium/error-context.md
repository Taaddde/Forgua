# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-learner-journey.spec.ts >> Full learner journey >> complete Japanese learning journey
- Location: e2e/full-learner-journey.spec.ts:11:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: '日本語' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: '日本語' })

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
        - img [ref=e76]
        - heading "¡Bienvenido a LinguaForge!" [level=1] [ref=e79]
        - paragraph [ref=e80]: Seleccioná un idioma para empezar
        - button "Elegí tu idioma" [ref=e81]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { clearIndexedDB } from './helpers';
  3   | 
  4   | test.describe('Full learner journey', () => {
  5   |   test.setTimeout(120_000);
  6   | 
  7   |   test.beforeEach(async ({ page }) => {
  8   |     await clearIndexedDB(page);
  9   |   });
  10  | 
  11  |   test('complete Japanese learning journey', async ({ page }) => {
  12  |     // === ONBOARDING ===
  13  |     await page.goto('/');
  14  | 
  15  |     const jpBtn = page.locator('button', { hasText: '日本語' });
> 16  |     await expect(jpBtn).toBeVisible({ timeout: 5000 });
      |                         ^ Error: expect(locator).toBeVisible() failed
  17  |     await jpBtn.click();
  18  |     await page.waitForTimeout(5000);
  19  | 
  20  |     // === DASHBOARD ===
  21  |     await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  22  |     await page.screenshot({ path: 'e2e/screenshots/01-dashboard.png' });
  23  | 
  24  |     // === LESSONS PAGE ===
  25  |     await page.goto('/lessons');
  26  |     await page.waitForTimeout(2000);
  27  |     await page.screenshot({ path: 'e2e/screenshots/02-lessons-list.png' });
  28  | 
  29  |     // First lesson should be visible
  30  |     const firstLesson = page.locator('button').filter({ hasText: /あ行/i }).first();
  31  |     await expect(firstLesson).toBeVisible();
  32  | 
  33  |     // === START HIRAGANA-01 ===
  34  |     await firstLesson.click();
  35  |     await page.waitForTimeout(1000);
  36  |     await page.screenshot({ path: 'e2e/screenshots/03-lesson-introduce.png' });
  37  | 
  38  |     // Navigate through introduce items
  39  |     for (let i = 0; i < 5; i++) {
  40  |       await page.screenshot({ path: `e2e/screenshots/04-introduce-item-${i}.png` });
  41  |       const nextBtn = page.getByRole('button', { name: /next|siguiente|continuar/i });
  42  |       if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  43  |         await nextBtn.click();
  44  |         await page.waitForTimeout(500);
  45  |       }
  46  |     }
  47  | 
  48  |     // === RECOGNIZE STEP ===
  49  |     await page.waitForTimeout(500);
  50  |     await page.screenshot({ path: 'e2e/screenshots/05-recognize-step.png' });
  51  | 
  52  |     for (let i = 0; i < 5; i++) {
  53  |       const options = page.locator('.max-w-md button:not([disabled])');
  54  |       const count = await options.count();
  55  |       if (count > 0) {
  56  |         await options.first().click();
  57  |         await page.waitForTimeout(800);
  58  |         await page.screenshot({ path: `e2e/screenshots/06-recognize-feedback-${i}.png` });
  59  | 
  60  |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  61  |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  62  |           await nextBtn.click();
  63  |           await page.waitForTimeout(300);
  64  |         }
  65  |       }
  66  |     }
  67  | 
  68  |     // === RECALL STEP ===
  69  |     await page.waitForTimeout(500);
  70  |     await page.screenshot({ path: 'e2e/screenshots/07-recall-step.png' });
  71  | 
  72  |     const romajiAnswers = ['a', 'i', 'u', 'e', 'o'];
  73  |     for (let i = 0; i < 5; i++) {
  74  |       const input = page.locator('input[type="text"]');
  75  |       if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
  76  |         await input.fill(romajiAnswers[i] ?? 'test');
  77  |         await page.screenshot({ path: `e2e/screenshots/08-recall-input-${i}.png` });
  78  | 
  79  |         const checkBtn = page.getByRole('button', { name: /check|verificar/i });
  80  |         if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  81  |           await checkBtn.click();
  82  |           await page.waitForTimeout(500);
  83  |         }
  84  |         await page.screenshot({ path: `e2e/screenshots/09-recall-feedback-${i}.png` });
  85  | 
  86  |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  87  |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  88  |           await nextBtn.click();
  89  |           await page.waitForTimeout(300);
  90  |         }
  91  |       }
  92  |     }
  93  | 
  94  |     // === WRITE STEP ===
  95  |     await page.waitForTimeout(500);
  96  |     await page.screenshot({ path: 'e2e/screenshots/10-write-step.png' });
  97  | 
  98  |     for (let i = 0; i < 5; i++) {
  99  |       const input = page.locator('input[type="text"]');
  100 |       if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
  101 |         await input.fill(romajiAnswers[i] ?? 'test');
  102 |         const checkBtn = page.getByRole('button', { name: /check|verificar/i });
  103 |         if (await checkBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  104 |           await checkBtn.click();
  105 |           await page.waitForTimeout(500);
  106 |         }
  107 |         await page.screenshot({ path: `e2e/screenshots/11-write-feedback-${i}.png` });
  108 | 
  109 |         const nextBtn = page.getByRole('button', { name: /next|siguiente/i });
  110 |         if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  111 |           await nextBtn.click();
  112 |           await page.waitForTimeout(300);
  113 |         }
  114 |       }
  115 |     }
  116 | 
```