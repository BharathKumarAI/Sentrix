# Sentrix Autonomous SRE Platform Skills Catalog

This directory contains reusable Antigravity / Agentic AI skills and architectural blueprints defined for the Sentrix platform.

## Available Skills

| Skill | Path | Description |
| :--- | :--- | :--- |
| **`sentrix-platform-architecture`** | [`skills/sentrix-platform-architecture/SKILL.md`](./sentrix-platform-architecture/SKILL.md) | Complete design tokens, UI component specifications, live chat patterns, and backend connector integration guide to replicate the Sentrix Autonomous SRE Platform in any frontend and backend codebase. |

---

## How to Install / Replicate in Another Project

### Option 1: Workspace Installation (Single Repository)
Copy the `skills/` folder or the specific skill into your target project:
```bash
# In your target project root
mkdir -p .agents/skills/sentrix-platform-architecture
cp -r /path/to/Prism/skills/sentrix-platform-architecture/* .agents/skills/sentrix-platform-architecture/
```

### Option 2: Machine-Wide Global Installation
Install the skill into your global Antigravity config directory so it is automatically recognized across all your workspaces:
```bash
mkdir -p ~/.gemini/config/skills/sentrix-platform-architecture
cp -r /path/to/Prism/skills/sentrix-platform-architecture/* ~/.gemini/config/skills/sentrix-platform-architecture/
```

### Option 3: Agent Activation
Once installed, simply prompt your coding assistant:
> *"Activate the `sentrix-platform-architecture` skill and use its design tokens, hero template, and component blueprints to build this page."*
