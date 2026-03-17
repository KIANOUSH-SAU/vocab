# Rules — src/constants/

Compile-time constants only. No functions. No logic. No async.

## Constant Files
| File | Contains |
|---|---|
| `theme.ts` | colors, spacing, radii, typography, shadows |
| `levels.ts` | Level definitions, descriptions, CEFR metadata |
| `fields.ts` | Field definitions, display names, accent colors, icons |
| `placementTest.ts` | All 10 placement test questions |
| `spacedRepetition.ts` | INTERVALS array, STATUS thresholds |

## Rules
- **No functions** — if you need computed values, put them in `src/utils/`
- **`as const`** on all objects to get literal types
- **Single source of truth** — never hardcode values that exist here anywhere else in the codebase
- **Export named constants** — `export const INTERVALS` not `export default`

## theme.ts Shape
```typescript
export const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  elevated: '#242424',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#606060',
  fields: {
    engineering: '#3B82F6',
    health: '#10B981',
    law: '#8B5CF6',
    sports: '#F59E0B',
    education: '#EF4444',
  },
} as const

export const spacing = {
  4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32, 48: 48, 64: 64,
} as const

export const radii = {
  sm: 8, card: 16, sheet: 24, pill: 999,
} as const
```
