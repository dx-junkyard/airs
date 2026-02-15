# !/bin/bash
mkdir -p .claude/skills
mkdir -p .codex/skills

# Create symbolic links
ln -s ../.agent/skills .claude/skills
ln -s ../.agent/skills .codex/skills
ln -s AGENTS.md CLAUDE.md
