# Subagent Testing Guide

## Test Prompt
Use the following prompt to test if subagents are working:

```
Task[parallel-researcher] Confirm that subagents are functioning by researching a simple topic like "what is the capital of France" and returning a concise answer.
```

## Steps to Check if Subagents Work
1. Run the above prompt in opencode.
2. Observe if the task starts without ProviderModelNotFoundError or similar.
3. Check if the subagent (parallel-researcher) executes and returns output.
4. Verify the output is relevant and not an error message.
5. If successful, the subagents are working; if not, check config and auth.

## Configuration Instructions
- Ensure the model specified in opencode.jsonc is available and authenticated (e.g., GitHub Copilot requires proper auth setup).
- Try alternative models like "github-copilot/gpt-4o" if "github/copilot" fails.
- Check models.dev for supported model names under GitHub Copilot provider.
- Run `opencode auth login` to authenticate with providers.

## List of Things Tried
- Tried model "github/grock-code-fast-1" - resulted in ProviderModelNotFoundError.
- Tried model "openai/gpt-4o" - user reported no OpenAI access.
- Tried model "github/copilot" - current configuration, assuming GitHub Copilot auth is set up.
- Verified config file path and syntax.
- Ensured subagent definitions are correct in opencode.jsonc.
- Tried parallel-researcher subagent with capital of France prompt - resulted in ProviderModelNotFoundError.

Avoid repeating these configurations without new information.