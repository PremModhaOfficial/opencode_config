---
name: skill-generator
description: Interactive guide for creating new Claude Agent Skills. Use when a user wants to build, validate, or scaffold a new skill for Claude or Opencode. This skill walks users through the process, provides templates, and can auto-generate a valid skill folder.
---

# Skill Generator

## Overview
This skill helps users create new Claude Agent Skills through an interactive conversation. It:
- Explains the required structure and metadata
- Asks for the skill name, description, and instructions
- Validates inputs against Anthropic's requirements
- Offers templates and best practices
- Auto-generates a new skill folder with a valid SKILL.md

## How to Use
1. **Invoke the wizard**: Use the custom command `/skill-generator-wizard` in Opencode
2. **Follow the conversation**: Claude will ask you questions step-by-step:
   - Skill name (lowercase, hyphens, max 64 chars)
   - Clear description (max 1024 chars)
   - Detailed instructions for Claude
   - Example prompts that trigger the skill
3. **Confirm**: Review the summary and confirm
4. **Done!** Your skill folder is created automatically

## Conversational Approach
Unlike traditional form-based tools, this skill uses Claude's conversational abilities to:
- Validate inputs in real-time
- Provide helpful suggestions
- Explain requirements when needed
- Create a natural, guided experience

## Example Flow
```
User: "I want to create a skill for summarizing PDFs."
Claude: "Great! Let's create a skill together. What would you like to name it? (Use lowercase with hyphens)"
User: "pdf-summarizer"
Claude: "Perfect! Now, provide a brief description of when to use this skill..."
[Continue conversation until skill is created]
```

## Best Practices
- Use clear, direct language in your skill description
- Include specific tool/command names in instructions
- Provide diverse examples that cover different use cases
- Follow Anthropic's metadata requirements
- Test your skill thoroughly after creation

## See Also
- [TEMPLATES.md](TEMPLATES.md) for ready-to-use skill templates
- [WIZARD.md](WIZARD.md) for detailed wizard documentation
- [Anthropic Skills Documentation](https://docs.anthropic.com) for official guidelines

## Structure Reference
Every skill needs:
- **Folder**: `~/.config/opencode/skills/[skill-name]/`
- **Main file**: `SKILL.md` with YAML frontmatter
- **Frontmatter**: `name` and `description` fields
- **Content**: Instructions, examples, and documentation
