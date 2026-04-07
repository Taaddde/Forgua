# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Onboarding flow >> new user can select Japanese pack and reach dashboard
- Location: e2e/onboarding.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: '日本語' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
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
  1  | import { test, expect } from '@playwright/test';
  2  | import { clearIndexedDB } from './helpers';
  3  | 
  4  | test.describe('Onboarding flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await clearIndexedDB(page);
  7  |   });
  8  | 
  9  |   test('new user can select Japanese pack and reach dashboard', async ({ page }) => {
  10 |     await page.goto('/');
  11 | 
  12 |     // Should show pack selector
  13 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  14 | 
  15 |     // Find Japanese pack button
  16 |     const japaneseButton = page.locator('button', { hasText: '日本語' });
> 17 |     await expect(japaneseButton).toBeVisible();
     |                                  ^ Error: expect(locator).toBeVisible() failed
  18 |     await japaneseButton.click();
  19 | 
  20 |     // Should navigate to dashboard after pack install
  21 |     await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  22 |   });
  23 | 
  24 |   test('new user can see at least 2 packs', async ({ page }) => {
  25 |     await page.goto('/');
  26 | 
  27 |     // Japanese pack
  28 |     await expect(page.locator('button', { hasText: '日本語' })).toBeVisible();
  29 |     // English pack
  30 |     await expect(page.locator('button', { hasText: /English|Inglés/i })).toBeVisible();
  31 |   });
  32 | });
  33 | 
```