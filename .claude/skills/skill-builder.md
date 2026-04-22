---
name: skill-builder
description: >
  Creates new skills and modifies existing ones following the project's skill
  convention. Use this whenever the user asks to create a new skill, edit a skill,
  or improve an existing skill's structure. Trigger when the user says "create a
  skill", "make a new skill", "build a skill for X", "update the X skill", or
  anything related to skill authoring.
---

# Skill Builder

## Goal

Create, edit, and maintain skills that follow the Vocab project's standard skill
convention — ensuring consistency, quality, and reliable triggering.

---

## Skill Convention (MANDATORY STRUCTURE)

Every skill file must be a `.md` file in `.claude/commands/` and follow this exact structure:

### 1. YAML Frontmatter

```yaml
---
name: skill-name-in-kebab-case
description: >
  Clear, detailed description of what the skill does and when to trigger it.
  Include explicit trigger phrases and keywords. Be specific about edge cases —
  when to trigger AND when NOT to trigger.
---
```

### 2. Title

```markdown
# [Skill Name] Skill
```

### 3. Goal

```markdown
## Goal

[One paragraph — what this skill accomplishes for the user. Be specific and outcome-focused.]
```

### 4. Step-by-Step Process

```markdown
---

## Step-by-Step Process

### Step 1 — [Phase Name]

[What to do, how to do it, what to ask the user]

### Step 2 — [Phase Name]

[Next phase...]

### Step N — Follow-Up

[Always end with follow-up options for the user]
```

**Rules for steps:**

- Always start with an intake/clarification step — never assume
- Each step should be actionable and self-contained
- Include example outputs, templates, or formats where helpful
- End with a follow-up step offering the user next actions

### 5. Rules

```markdown
---

## Rules

- [Hard constraint 1]
- [Hard constraint 2]
- Always include: "Match language to the user: if they write in Turkish, respond in Turkish"
```

### 6. Reference Files

```markdown
---

## Reference Files

- `references/[relevant-file].md` — [what it contains]
```

### 7. Self-Improvement

```markdown
---

## Self-Improvement

[What to track within/across sessions to get better at this skill]
```

---

## Step-by-Step Process

### Step 1 — Understand the Request

Ask the user:

- **What does this skill do?** — What problem does it solve?
- **Who is it for?** — What kind of user/context?
- **When should it trigger?** — What phrases, keywords, file types, or situations?
- **What's the output?** — What does the user get at the end?

If the user has already described most of this, confirm and fill gaps.

### Step 2 — Draft the Skill

Write the full skill file following the convention above. Ensure:

- Frontmatter description is rich with trigger keywords
- Steps are clear and ordered logically
- Rules prevent common mistakes
- Self-improvement section captures what to learn from usage

### Step 3 — Review & Place

- Show the user the draft for approval
- Save to `.claude/commands/[skill-name].md`
- Update CLAUDE.md auto-trigger section with the new skill's trigger patterns

### Step 4 — Follow-Up

After creating or editing a skill, offer:

1. "Want me to test-run this skill with a sample prompt?"
2. "Should I adjust the trigger description to be more/less sensitive?"
3. "Want to add this to the global commands too (`~/.claude/commands/`)?"

---

## Rules

- Every skill MUST follow the convention structure — no exceptions
- Skill names are always kebab-case (e.g. `deep-researcher`, not `DeepResearcher`)
- Descriptions must include explicit trigger phrases — vague descriptions cause missed triggers
- Never create a skill without asking the user's intent first
- After creating a skill, always update CLAUDE.md auto-trigger section
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files

- `.claude/commands/` — all existing skills for reference
- `CLAUDE.md` — project rules and auto-trigger section

---

## Self-Improvement

After each skill creation or edit, note:

- Which trigger phrases the user corrected or refined
- What structure adjustments were requested
- Common patterns in the user's skill requests
