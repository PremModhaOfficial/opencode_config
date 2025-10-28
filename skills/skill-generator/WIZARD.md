# Skill Creation Wizard

This wizard guides you through creating a new Claude Agent Skill using an interactive conversation.

## How It Works
The wizard uses Claude's conversational abilities to:
1. Ask for skill details step-by-step
2. Validate inputs in real-time
3. Provide helpful suggestions and corrections
4. Generate the skill folder automatically

## Invocation
Run the custom command in Opencode:
```
/skill-generator-wizard
```

## What You'll Need
Prepare the following information:
1. **Skill Name**: lowercase-with-hyphens (max 64 chars)
2. **Description**: Clear description of when to use this skill (max 1024 chars)
3. **Instructions**: Step-by-step guidance for Claude
4. **Examples**: 2-3 example prompts that would trigger the skill

## Conversation Flow
1. Claude asks for skill name → validates format
2. Claude asks for description → validates length/clarity
3. Claude asks for instructions → no strict validation
4. Claude asks for examples → helps with formatting
5. Claude shows summary → asks for confirmation
6. Claude creates skill folder → provides next steps

## Validation Rules

### Skill Name
- Must be lowercase
- Use hyphens (not underscores/spaces)
- Maximum 64 characters
- Should be descriptive
- Examples: `pdf-summarizer`, `code-reviewer`, `sql-optimizer`

### Description
- Maximum 1024 characters
- Should explain WHEN to use the skill
- Focus on trigger/use-case, not implementation
- Example: "Use when user wants to analyze and summarize PDF documents"

### Instructions
- Be specific and actionable
- Include tools/commands to use
- Mention error handling if relevant
- Can be bullet points or paragraphs

## Post-Creation Checklist
- [ ] Skill folder created at `~/.config/opencode/skills/[name]`
- [ ] SKILL.md contains valid YAML frontmatter
- [ ] Instructions are clear and actionable
- [ ] Examples are relevant and diverse
- [ ] Test the skill by describing a task it should handle
- [ ] (Optional) Add more .md files for extended documentation

## Tips
- Use [TEMPLATES.md](TEMPLATES.md) for inspiration
- Keep instructions concise but complete
- Include edge cases in your instructions
- Test your skill with various prompts
- Iterate and refine based on usage

## Troubleshooting

**Skill not being triggered?**
- Check description clarity (must explain WHEN to use)
- Make instructions more specific
- Add more diverse examples

**Want to edit after creation?**
- Navigate to `~/.config/opencode/skills/[name]/SKILL.md`
- Edit the file directly
- Changes take effect immediately in Opencode
