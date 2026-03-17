---
name: new-service
description: >
  Scaffold a new service file for the Vocab app. Use when the user says "create
  a service", "new service", "build a service for X", "scaffold service", or
  needs a new external API integration, data layer, or I/O module. Do NOT
  trigger for hooks, components, or utilities.
---

# New Service Skill

## Goal
Scaffold a properly typed, async service file that handles all external I/O
following the Vocab app's service layer conventions.

---

## Step-by-Step Process

### Step 1 — Clarify the Service
Confirm with the user:
- **Service name** (e.g., `notification`, `analytics`)
- **Purpose** — what external system or data does it handle?
- **Key functions** — what operations does it need?

If the user already provided `$ARGUMENTS`, parse the service name and purpose from it.

### Step 2 — Scaffold the File
Create the file at `src/services/[name]Service.ts`.

Use this template:
```typescript
// src/services/[name]Service.ts

/** Brief description of this service */

/** Description of what this function does */
export async function functionName(param: ParamType): Promise<ReturnType> {
  try {
    // implementation
  } catch (error) {
    throw new Error(`[ServiceName] functionName failed: ${error}`)
  }
}
```

Ensure:
- Named exports only — no default export
- No React imports — services are pure TypeScript
- All functions are async and return typed results
- All external calls wrapped in try/catch with typed errors
- JSDoc comment above each exported function
- Does NOT import from Zustand stores — receives data as parameters

### Step 3 — Create Types (if needed)
If the service returns new data shapes, create matching types in `src/types/`.

### Step 4 — Follow-Up
After scaffolding, offer:
1. "Want me to create a hook that consumes this service?"
2. "Should I add this to a Zustand store action?"
3. "Want me to add error retry logic?"

---

## Rules
- File name must follow `[name]Service.ts` convention
- Named exports only — no default export
- No React imports — pure TypeScript
- All functions must be async with typed return values
- Wrap external calls in try/catch
- Never import from Zustand stores — services receive data as parameters
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `src/services/CLAUDE.md` — service layer rules
- `src/types/` — existing type definitions

---

## Self-Improvement
After each service creation, note:
- Common service patterns the user needs
- Error handling preferences
- Which external APIs are being integrated
