---
title: CLI Installation
description: Install @asenajs/asena-cli globally with Bun, verify the installation, and troubleshoot common issues
outline: deep
---

# Installation

Install the Asena CLI globally to access the `asena` command from anywhere on your system.

## Prerequisites

**Required:**
- [Bun runtime](https://bun.sh) v1.4 or higher

**Verify Bun installation:**

```bash
bun --version
```

If Bun is not installed, install it:

```bash
# macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Install Asena CLI

Install globally using Bun:

```bash
bun install -g @asenajs/asena-cli
```

## Verify Installation

Check that the CLI is installed correctly:

```bash
asena --version
```

You should see the version number (e.g., `0.7.1`).

View available commands:

```bash
asena --help
```

## Update Asena CLI

To update to the latest version:

```bash
bun install -g @asenajs/asena-cli@latest
```

## Uninstall

To remove the CLI:

```bash
bun remove -g @asenajs/asena-cli
```

## Troubleshooting

### Command Not Found

If you see `asena: command not found`, make sure Bun's global bin directory is in your PATH:

**Check your PATH:**

```bash
echo $PATH
```

**Add Bun's bin directory to your PATH** (if needed):

```bash
# For bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Errors

If you encounter permission errors during installation:

```bash
# On Linux/macOS, you may need sudo
sudo bun install -g @asenajs/asena-cli
```

### Version Mismatch

If you have an old version installed, force reinstall:

```bash
bun remove -g @asenajs/asena-cli
bun install -g @asenajs/asena-cli
```

## Related

- [CLI Overview](/docs/cli/overview) - What the CLI does
- [CLI Commands](/docs/cli/commands) - All available commands
- [CLI Configuration](/docs/cli/configuration) - Configure your project
- [CLI Examples](/docs/cli/examples) - Create your first project step by step
- [Get Started Guide](/docs/get-started) - Complete beginner's guide
