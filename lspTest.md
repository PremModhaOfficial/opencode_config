# LSP Testing and Troubleshooting Guide

## Current LSP Configuration (from opencode.jsonc)

```jsonc
"lsp": {
  "jdtls": {
    "command": [
      "/home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls"
    ],
    "extensions": [
      ".java"
    ]
  }
}
```

## Steps Taken So Far

1. **Configuration Review**: Verified LSP section in opencode.jsonc includes jdtls setup with correct path and Java extensions.
2. **Path Verification**: Confirmed jdtls binary exists at `/home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls`.
3. **Extension Mapping**: Noted that LSP is configured for `.java` files only.

## Testing LSP Functionality

### 1. Basic LSP Test
- Create a simple Java file (e.g., `Test.java`) with basic syntax
- Open the file in opencode
- Check if LSP provides:
  - Syntax highlighting
  - Error diagnostics
  - Code completion
  - Hover information

### 2. Error Simulation
- Introduce a deliberate syntax error in the Java file
- Verify LSP detects and reports the error
- Fix the error and confirm LSP clears the diagnostic

### 3. Code Completion Test
- Type partial method names or variable names
- Check if LSP suggests completions
- Test completion for imports and class references

## Testing LSP Servers

### 1. Verify LSP Server Process
```bash
# Check if jdtls process is running
ps aux | grep jdtls

# Or check for Java processes (since jdtls is Java-based)
ps aux | grep java | grep -v grep
```

### 2. Test LSP Server Startup
- Open a Java file in opencode
- Monitor system processes to see if jdtls starts
- Check opencode logs for LSP initialization messages

### 3. LSP Server Health Check
```bash
# Check if the jdtls binary is executable
ls -la /home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls

# Test basic execution (may require specific arguments)
timeout 5s /home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls --version 2>&1 || echo "Server may require specific startup parameters"
```

### 4. Network/Port Testing (if applicable)
- If LSP uses network communication, check for open ports
- Verify no firewall blocking LSP communication

### 5. Server Response Testing
- Open a Java file with known issues
- Check if LSP server responds with diagnostics within reasonable time
- Test server restart by closing and reopening files

## Troubleshooting Steps

### 1. Verify jdtls Installation
```bash
ls -la /home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls
```

### 2. Check LSP Logs
- Look for LSP-related errors in opencode logs
- Check if jdtls process starts successfully

### 3. Test with Different Java Files
- Try with a minimal Java class
- Test with different project structures

### 4. Configuration Validation
- Ensure opencode.jsonc syntax is valid JSONC
- Verify no typos in LSP configuration paths

### 5. Permission Check
```bash
chmod +x /home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls
```

## Common Issues and Solutions

- **LSP not starting**: Check jdtls binary path and permissions
- **No diagnostics**: Verify file extensions match LSP configuration
- **Performance issues**: Check system resources and jdtls logs
- **Configuration errors**: Validate JSONC syntax and paths

## Next Steps
- Run basic LSP test with a sample Java file
- Document any errors or unexpected behavior
- Check opencode logs for LSP-related messages