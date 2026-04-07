---
name: component-creator
description: "Generate React components following LinguaForge's patterns and conventions. Use when the user asks to create a new component, page, exercise type, hook, or any React UI element for the project. Also trigger on 'add a component', 'create a page', 'new exercise type', or 'build a UI for'."
---

# Component Creator

Creates React components that follow LinguaForge's architecture and conventions.

## Component types and where they go

| Type | Directory | Naming |
|---|---|---|
| Page | `src/core/pages/` | PascalCase.tsx (e.g., `Study.tsx`) |
| Layout component | `src/core/components/layout/` | PascalCase.tsx |
| Exercise component | `src/core/components/exercises/` | PascalCase.tsx |
| Card component | `src/core/components/cards/` | PascalCase.tsx |
| Progress component | `src/core/components/progress/` | PascalCase.tsx |
| Audio component | `src/core/components/audio/` | PascalCase.tsx |
| Reader component | `src/core/components/reader/` | PascalCase.tsx |
| Common/shared | `src/core/components/common/` | PascalCase.tsx |
| Hook | `src/core/hooks/` | useCamelCase.ts |
| Store slice | `src/core/store/` | useCamelCase.ts |

## Conventions (MUST follow)

### Imports
```tsx
// React imports first
import { useState, useCallback } from 'react';
// Third-party imports
import { useTranslation } from 'react-i18next';
import { IconName } from 'lucide-react';
// Internal imports (use relative paths within core/)
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/common/Button';
// Types
import type { Card } from '../types/models';
```

### Component structure
```tsx
// Props interface (if needed)
interface ComponentNameProps {
  prop: string;
  onAction?: () => void;
}

// Named export (NOT default, except pages)
export function ComponentName({ prop, onAction }: ComponentNameProps) {
  const { t } = useTranslation();
  // hooks first, then derived state, then handlers, then render
  return (/* JSX */);
}
```

### Styling rules
- **ONLY Tailwind classes** — no CSS modules, no styled-components, no inline styles
- Dark theme is the default: use `bg-slate-900`, `text-slate-100`, `border-slate-800`
- Accent color: indigo (`bg-indigo-600`, `text-indigo-400`)
- Status colors: green (success), red (error/again), orange (warning/hard), blue (info/easy)
- Always add `transition-colors` for interactive elements
- Responsive: use `md:` and `lg:` breakpoints

### i18n
- ALL user-facing strings MUST use `t('key.path')` from `useTranslation()`
- Add new keys to both `src/i18n/es.json` and `src/i18n/en.json`
- Use nested keys: `t('pages.study.startButton')`

### Core agnostic rule
- Components MUST NOT import from `src/packs/` directly
- Language-specific logic goes through the adapter (via `usePack()` hook)
- The `extra` field on cards/vocab holds language-specific data

## Exercise component template

When creating a new exercise type:

```tsx
import { useState } from 'react';
import type { Exercise } from '../types/models';

interface ExerciseComponentProps {
  exercise: Exercise;
  onComplete: (correct: boolean, grade: number) => void;
}

export function ExerciseComponent({ exercise, onComplete }: ExerciseComponentProps) {
  const [answered, setAnswered] = useState(false);
  // Extract data from exercise.data
  // Render question
  // Handle answer submission
  // Call onComplete with result
}
```

## Page template

When creating a new page:

```tsx
import { useTranslation } from 'react-i18next';
import { usePack } from '../hooks/usePack';

export function PageName() {
  const { t } = useTranslation();
  const { pack, adapter } = usePack();

  if (!pack) {
    // Redirect or show "select a pack" message
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-8">
        {t('pages.pageName.title')}
      </h1>
      {/* Content */}
    </div>
  );
}
```

Remember to:
1. Add the route to `src/App.tsx`
2. Add the nav item to `src/core/components/layout/Sidebar.tsx`
3. Add i18n strings to both language files
