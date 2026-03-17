---
name: skill-creator
description: >
  Creates new skills, modifies existing skills, and measures skill performance.
  Use when the user wants to create a skill from scratch, edit or optimize an
  existing skill, test a skill, benchmark performance, or optimize a skill's
  trigger description for better accuracy. Trigger when the user says "create a
  skill", "new skill", "edit skill", "improve this skill", "test this skill",
  or anything about skill authoring and management.
---

# Skill Creator Skill

## Goal
Author, edit, test, and optimize skills — ensuring every skill follows the project
convention, triggers reliably, and delivers high-quality results.

---

## Step-by-Step Process

### Step 1 — Understand the Request
Determine what the user needs:
- **Create**: build a new skill from scratch
- **Edit**: modify an existing skill's content or structure
- **Optimize**: improve trigger description for better activation
- **Test**: run a skill with sample prompts to verify behavior

Ask: "What skill do you want to work on — creating something new, or improving an existing one?"

### Step 2 — Follow the Convention
Every skill MUST follow the structure defined in `/skill-builder`. Use that command
as the authoritative reference for:
- YAML frontmatter format
- Section order (Goal -> Steps -> Rules -> References -> Self-Improvement)
- Naming conventions (kebab-case)
- Trigger description best practices

### Step 3 — Draft or Edit
**For new skills:**
- Gather requirements: purpose, audience, triggers, expected output
- Write the full skill file following convention
- Include rich trigger descriptions with explicit phrases

**For edits:**
- Read the existing skill file
- Make targeted changes while maintaining convention compliance
- Update the trigger description if the scope changed

### Step 4 — Validate
Before saving, verify:
- All convention sections are present
- Trigger description is specific and comprehensive
- Steps are actionable and ordered logically
- Rules prevent common mistakes

### Step 5 — Deploy & Follow-Up
- Save to `.claude/commands/[skill-name].md`
- Update CLAUDE.md auto-trigger section
- Offer:
  1. "Want me to test this skill with a sample prompt?"
  2. "Should I also add it to global commands (`~/.claude/commands/`)?"
  3. "Want to adjust the trigger sensitivity?"

---

## Rules
- Always follow the convention from `/skill-builder` — no shortcuts
- Skill names must be kebab-case
- Trigger descriptions must include explicit phrases, not vague keywords
- Always update CLAUDE.md when adding or modifying skills
- Never delete a skill without user confirmation
- Test with at least one sample prompt before considering done
- Match language to the user: if they write in Turkish, respond in Turkish

---

## Reference Files
- `.claude/commands/skill-builder.md` — the authoritative skill convention
- `.claude/commands/` — all existing skills for reference

---

## Self-Improvement
After each skill creation or edit, note:
- Which trigger phrases needed refinement
- What convention sections the user cared most about
- Patterns in the types of skills being created
