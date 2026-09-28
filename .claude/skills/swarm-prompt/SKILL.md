---
name: swarm-prompt
description: Writes long, multi-agent orchestration briefs for Claude Code — prompts that tell Claude Code to decompose a goal into workstreams, spawn one subagent per workstream in parallel, have them cross-review and correct each other, and converge on a synthesized result. Use this whenever the user wants a Claude Code prompt that involves multiple agents, subagents, parallel workstreams, agent teams, brainstorming between agents, agents reviewing or correcting each other, debate, consensus, or red-teaming — and also whenever they hand over a goal with several distinct parts and want Claude Code to "work through all of it" rather than do one thing. Trigger on phrases like "spawn agents for each point", "let them brainstorm", "have them check each other", "multi-agent", "swarm", "parallel agents", "agent team", "prompt pre Claude Code s agentmi". For a single-threaded prompt with no subagents, use prompt-builder instead.
---

# Swarm Prompt

Produces one artifact: a long, self-contained brief to paste into Claude Code, which turns Claude Code into an orchestrator running a team of subagents over a multi-part goal.

The hard part is not asking for agents. It's that **subagents share nothing**. Each one starts blind — no conversation history, no memory of what siblings found, no way to talk to each other. Every brief that ignores this produces agents that duplicate work, contradict each other, and hand back a pile the orchestrator can't merge. Coordination has to be designed explicitly, and it runs through files.

Read `references/orchestration-mechanics.md` before writing the first brief in a session. It covers what Claude Code's subagents can and cannot do, and the file-based coordination protocol that makes cross-review actually work.

## When a swarm is the wrong shape

Push back before writing. A swarm helps when the goal has **genuinely parallel parts that benefit from independent perspectives**. It hurts when:

- The parts are sequential — B needs A's answer. Agents can't wait for each other; you get guesswork. Write a staged single-agent prompt instead.
- The task is mechanical — running a migration, applying a rename. Parallelism without judgment is just a slower single agent with merge conflicts.
- The work all touches the same files. Parallel writers to one file lose each other's edits.
- The goal has one part. Two agents on one question is a debate, not a swarm — that's a different pattern, still in this skill, but say so.

Say plainly when the user's goal doesn't split. Handing back a swarm brief for a sequential task wastes an expensive run.

## Workflow

### 1. Extract the goal structure

The user usually gives a paragraph of intent. Convert it into workstreams before writing anything.

For each candidate workstream, check three things:
- **Independently answerable?** Can an agent produce something useful without knowing the other agents' outputs?
- **Distinct deliverable?** If two workstreams produce the same artifact, merge them.
- **Named output?** Every workstream must end in a specific file. "Think about X" is not a workstream.

Aim for **3–6 agents**. Below three there's nothing to cross-review. Above six, the review round becomes quadratic and the synthesis turns into summary-of-summaries mush. If the goal has ten parts, group them into five workstreams; don't spawn ten agents.

### 2. Pick the round pattern

Read `references/round-patterns.md` and choose:

| Pattern | Use when | Rounds |
|---|---|---|
| **Fan-out → cross-review → converge** | Multi-part goal, parts are different in kind | 3 |
| **Parallel debate** | One question, no obvious answer | 3–4 |
| **Stochastic consensus** | Want the solution space explored, not a verdict | 2 |
| **Red team / blue team** | A plan or design exists and needs attacking | 2 |
| **Staged pipeline with gates** | Parts are sequential but each is big | N |

The default for "give me longer goals and let agents work through them" is fan-out → cross-review → converge. It's what the rest of this file assumes.

### 3. Assign distinct framings

Agents given the same framing produce the same answer, and the cross-review round turns into mutual agreement — expensive and useless. Groupthink is the main failure mode of multi-agent setups, and framing is the lever against it.

Two ways to differentiate, and they combine:

- **By domain** — each agent owns a different workstream. Natural when the goal has distinct parts.
- **By stance** — when agents look at overlapping material, assign opposing priors: conservative / aggressive, build / buy, ship-now / harden-first, optimist / skeptic. Tell each agent its stance is a role, not a belief, and that it should state where its own stance is weakest.

### 4. Write the brief

Use the template in `assets/brief-template.md`. It's a skeleton with placeholders — fill every one; unfilled placeholders reaching the user are a defect.

Structure of every brief:

```
GOAL + SUCCESS CRITERIA     what "done" means, checkable
SETUP                       artifact directory, shared context file
ROUND 1: FAN-OUT            N agents, spawned in one message, each writing to its own file
ROUND 2: CROSS-REVIEW       each agent reads siblings' outputs, files structured critiques
ROUND 3: REVISION           each agent revises against critiques received
SYNTHESIS                   orchestrator merges, resolves conflicts, escalates the rest
RULES                       scope, write permissions, budget, stop conditions
```

Non-negotiables in the brief, because these are what fail in practice:

- **Every agent prompt is self-contained.** It repeats the shared context, states the agent's own workstream, names its exact output path, and specifies the output format. The subagent sees nothing else.
- **Every agent writes to its own file.** Never two agents to one file.
- **Cross-review has a required output shape.** "Review each other's work" yields "looks good". Force: what's wrong, where specifically, what should change, and how confident. See the template.
- **Disagreement is surfaced, not averaged.** The synthesis must list unresolved conflicts as open decisions for the user, not split the difference. Averaged positions are the worst output of any multi-agent run — they read as consensus while representing nobody's actual reasoning.
- **Stop conditions on every round.** If reviews produce no material change, skip the next round and say so. If an agent fails, continue with the rest and note the gap.
- **Explicit budget.** State the agent count and round count up front, and that no further agents are to be spawned.

### 5. Deliver

```
**Pattern: [name]** — [one sentence on why]
**Shape: [N] agents × [R] rounds** — [rough cost expectation]

---
[the brief, one copy-paste block]
---

**Assumptions:** [any you made]
**Watch for:** [the most likely failure in this specific run]
```

The brief goes in one block with nothing else inside it. Then offer one adjustment round — agent count, framings, or a different pattern.

## Worked shape

Goal: "analyze our project management, understand what's been done, what's priority, where we are."

Bad decomposition — four agents all reading the same data, producing four overlapping summaries that the synthesizer flattens into a fifth.

Good decomposition — different **questions** over the same data:
- Agent A: chronology — what was actually built, in what order, at what pace
- Agent B: current state — what's open, stalled, blocked, and for how long
- Agent C: stated vs. revealed priorities — where the labels disagree with the activity
- Agent D: gaps — what the project needs that no workstream covers

Then cross-review works, because A's chronology can contradict C's priority reading, and that contradiction is exactly the finding worth having. Four summaries of the same data can't contradict each other usefully.

The test for a decomposition: **could two of these agents disagree about something real?** If not, the cross-review round buys nothing and you should cut agents and rounds.

## Anti-patterns

- **Agents with no output contract.** "Research X and report back" produces five differently-shaped reports and an unmergeable synthesis. Specify the sections.
- **Cross-review without teeth.** Agents default to politeness. Require at least one substantive criticism per review, and permit "no material issues found" only with a stated reason.
- **Unbounded rounds.** "Iterate until consensus" runs until the budget dies. Cap rounds; consensus is not guaranteed and forced consensus is worse than a stated disagreement.
- **Swarm for prestige.** Five agents on a question one agent answers well is a slow, expensive, noisier answer.
- **Parallel writes to shared files.** Every agent gets its own path. Always.
- **Orchestrator that only concatenates.** If the synthesis is just the four reports stapled together, the run added nothing over four separate prompts. The synthesis must state what agents disagreed about and what the merged picture is.

## Output language

The brief is written in the language the user is working in. Code, paths and file names stay in English; instructions, section headings and the agents' output format follow the user's language, since the deliverable is usually read by the user and their colleagues.
