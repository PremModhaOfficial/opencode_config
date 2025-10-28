# Skill Generator Wizard

This command launches an interactive conversation to create a new Claude Agent Skill.

## Instructions for Claude

When this command is invoked, guide the user through creating a new skill by following these steps:

### Step 1: Introduction
Greet the user and explain:
- You'll help them create a new Claude Agent Skill
- The process takes 4-5 questions
- You'll validate inputs and generate the skill folder automatically

### Step 2: Collect Skill Name
Ask: "What would you like to name your skill?"

**Validation rules:**
- Must be lowercase
- Use hyphens (not underscores or spaces)
- Maximum 64 characters
- Must be descriptive (e.g., "pdf-summarizer", "code-reviewer", "sql-optimizer")

If invalid, explain the rules and ask again.

### Step 3: Collect Description
Ask: "Provide a brief description of when to use this skill (max 1024 characters)"

**Guidance:**
- Should clearly explain WHEN Claude should use this skill
- Focus on the trigger/use-case, not implementation details
- Example: "Use when user wants to analyze and summarize PDF documents"

### Step 4: Collect Instructions
Ask: "What are the step-by-step instructions for Claude when using this skill?"

**Guidance:**
- Be specific and actionable
- Include tools/commands to use
- Mention error handling if relevant
- Can be bullet points or paragraphs

### Step 5: Collect Examples
Ask: "Provide 2-3 example prompts that would trigger this skill"

**Format:** Comma-separated list or bullet points

### Step 6: Confirmation
Display a summary:
```
Skill Name: [name]
Description: [description]
Instructions: [first 100 chars...]
Examples: [list examples]
```

Ask: "Does this look correct? (yes/no)"

If no, ask what to change and loop back.

### Step 7: Create Skill Folder
Once confirmed, use the bash tool to execute:

```bash
SKILL_DIR="$HOME/.config/opencode/skills/[SKILL_NAME]"
mkdir -p "$SKILL_DIR"
cat > "$SKILL_DIR/SKILL.md" << 'EOF'
---
name: [SKILL_NAME]
description: [DESCRIPTION]
---

# [SKILL_NAME]

## Instructions
[INSTRUCTIONS]

## Examples
[EXAMPLES]

## Notes
- Edit this file to refine your skill
- Add additional markdown files for extended documentation
- Test the skill thoroughly before relying on it
EOF
```

Replace `[SKILL_NAME]`, `[DESCRIPTION]`, `[INSTRUCTIONS]`, and `[EXAMPLES]` with actual values collected.

### Step 8: Next Steps
Inform the user:
- ✅ Skill created at: `~/.config/opencode/skills/[SKILL_NAME]`
- 📝 Suggest: "You can now edit the SKILL.md file to add more details"
- 🧪 Suggest: "Try invoking your skill by describing a task it should handle"
- 📚 Mention: "You can add more .md files to the skill folder for extended documentation"

## Error Handling
- If skill folder already exists, ask if they want to overwrite
- If bash command fails, show error and suggest manual creation
- Validate all inputs before creating files

## Example Conversation Flow

**User:** /skill-generator-wizard

**Claude:** "I'll help you create a new Claude Agent Skill! This will take about 5 minutes. Ready to start?

First, what would you like to name your skill? (Use lowercase with hyphens, e.g., 'pdf-summarizer')"

**User:** "PDF Summarizer"

**Claude:** "Great concept! However, skill names must be lowercase with hyphens (no spaces or capitals). How about 'pdf-summarizer'?"

**User:** "pdf-summarizer"

**Claude:** "Perfect! Now, provide a brief description (max 1024 chars) of when to use this skill..."

[Continue conversation...]
