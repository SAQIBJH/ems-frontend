---
description: Build multiple INDEPENDENT modules in parallel using Task subagents. Each subagent runs in its own context window — saves the main session's token budget. Only use when modules don't depend on each other.
argument-hint: <module-1> <module-2> [<module-3> ...]
---

# /parallel-modules $ARGUMENTS

You will spawn one Task subagent per module listed above and have them run concurrently. Each subagent works in its own context window, isolated from the others. The main session does not load every module's files — that's the token saving.

## Critical rules

1. **Only do this if the modules are truly independent.** If module B imports from module A, this won't work — they must be built sequentially.

2. **Each subagent receives the SAME constraint set.** Verbatim, not paraphrased:
   - Read CLAUDE.md sections 2, 5, 6 before writing code.
   - Follow the `/new-module` workflow for that one module.
   - Do NOT touch any module other than its own.
   - Do NOT modify shared files (lib/, shared/, components/ui/) without flagging it.
   - Report back with: files created, any blockers, any conflicts with CLAUDE.md.

3. **Spawn all subagents in ONE message with multiple Task tool calls in parallel.** Not sequentially — that defeats the point.

4. **After they complete, review their outputs.** If any subagent reports a conflict or a stuck state, address it before merging.

## When NOT to use this

- For a single module → just use `/new-module`.
- For modules that share state, types, or schemas in-flight → sequential is faster.
- When you haven't run `pnpm install` and basic setup yet — subagents can't help with bootstrap.
- For polish or styling passes that need to feel cohesive across screens — humans do that better.

## Token note

Parallel subagents do NOT use less total tokens — they use roughly the same in total, but spread across isolated contexts so the main session stays clean. The benefit is **your main session's context window stays small**, which means longer productive sessions before you need to `/clear`.

## Now: spawn the subagents.

Modules to build in parallel: $ARGUMENTS
