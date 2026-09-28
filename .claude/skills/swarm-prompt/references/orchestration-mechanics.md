# Orchestration mechanics in Claude Code

What subagents can and cannot do. Briefs that contradict these produce runs that look busy and deliver nothing.

## The constraints that shape everything

**Subagents start blind.** A subagent receives only the prompt the orchestrator passes it. Not the conversation, not the user's original message, not what sibling agents found. Every agent prompt must therefore be self-contained: shared context, its own task, its output path, its output format.

**Subagents cannot message each other.** There is no channel between them. Everything they "say" to one another goes through files written by one round and read by the next.

**Subagents usually cannot spawn subagents.** Don't design nested hierarchies. The orchestrator runs the rounds; agents are leaves.

**Parallelism requires one message.** Multiple Task calls issued in a single message run concurrently; issued across separate messages they run in sequence. The brief must say so explicitly, because the default drift is to spawn one, wait, spawn the next — which is just a slow single agent.

**Context returns compressed.** What comes back from an agent is a summary, not its full working. If the detail matters, the agent must write it to a file and return only a short pointer plus its headline findings. This is why file-based output isn't optional for anything substantial.

**Agents fail sometimes.** Timeouts, tool errors, a refused operation. The brief needs a rule: continue with the survivors, mark the gap explicitly in the synthesis, do not silently produce an N-1 result as if it were complete.

## File-based coordination protocol

The whole design rests on this. Give the run a directory and a fixed layout:

```
.swarm/<run-name>/
├── context.md              written by orchestrator before round 1
├── round1/
│   ├── <agent-a>.md
│   ├── <agent-b>.md
│   └── ...
├── round2/
│   ├── <agent-a>-review.md   A's critique OF the others
│   └── ...
├── round3/
│   └── <agent-a>-final.md
└── synthesis.md
```

Rules that make it work:

- **One writer per file.** Concurrent writes to the same path lose data. Agents read siblings' files freely; they write only their own.
- **The orchestrator writes `context.md` first**, before spawning anything. Shared facts live there: what the project is, what's being decided, constraints, vocabulary. Each agent prompt tells the agent to read it.
- **Paths are stated literally in each agent's prompt.** "Write your output to `.swarm/pm-analysis/round1/chronology.md`" — not "write your output to the round 1 directory".
- **Round N+1 agents are told exactly which files to read.** Not "read the other agents' work" — list the paths.

## Spawning agents

Two ways to give an agent its character:

**Inline prompt** (default). The orchestrator passes the full instructions in the Task call. Flexible, nothing to install, good for one-off runs. This is what most briefs should use.

**Agent definition files** in `.claude/agents/<name>.md` with frontmatter (`name`, `description`, `tools`). Worth it when the same roles recur across runs, or when a role needs a restricted toolset — a reviewer that can read but not write, for instance. Mention this as an option when the user says the workflow will repeat; don't build it for a one-off.

Tool restriction is worth calling out in either case. A reviewer agent that can edit files will start editing files. If the platform supports narrowing tools per agent, narrow them; otherwise state the prohibition in the agent's prompt and make it specific.

## Anatomy of an agent prompt

Every one needs these, in this order:

```
1. Identity and stance      "You are analyzing X from the perspective of Y."
2. Shared context           read .swarm/<run>/context.md — plus the 3-5 facts
                            that matter most, restated inline
3. The specific task        one workstream, stated as a question to answer
4. Sources                  exactly which files, tools, or data to use
5. Output path              the literal path, one file, owned by this agent
6. Output format            the section headings, verbatim
7. Boundaries               what not to touch; what to do when blocked
8. Return value             what to say back to the orchestrator — a short
                            summary plus the file path, never the whole document
```

Item 6 is what makes synthesis possible. Five agents with identical section headings merge cleanly; five agents with freeform structure do not.

## Round design

**Round 1 — fan-out.** All agents spawned in one message. Each answers its own question against the shared context. No agent sees another's output; that independence is the point, and it's what makes the later disagreements informative rather than anchored.

**Round 2 — cross-review.** Each agent reads the *other* agents' round 1 files and writes a critique. Required output shape:

```
## Contradictions
[where another agent's finding conflicts with mine, with both quoted]

## Gaps
[what another agent missed that my workstream shows is relevant]

## Corrections to my own work
[what I got wrong or overstated, now that I've seen the others]

## Confidence
[which of my own findings I'd defend, which I'd drop]
```

"Corrections to my own work" is the section that earns the round. Without it agents only attack outward and nothing improves. With it, the round produces actual convergence.

Reviewing every agent's output by every other agent is quadratic. Above four agents, use a ring — each agent reviews the next two — and say so in the brief.

**Round 3 — revision.** Each agent reads the critiques aimed at it and revises its own file. It must state what it changed and what criticism it rejected, with a reason. Rejected criticism is signal: a disagreement that survives an explicit rebuttal is a real one, and it belongs in the synthesis as an open question.

**Synthesis.** The orchestrator does this itself, not via an agent. It reads the final files and produces: the merged picture, an explicit list of surviving disagreements with each side's position, gaps nobody covered, and — separately — anything that needs a human decision. Never average two positions into a middle one.

## Budget

State the shape up front in every brief: N agents × R rounds, roughly N×R agent-runs plus synthesis. A 4×3 run is twelve agent-runs; on long context that's substantial.

The brief should forbid the orchestrator from spawning extra agents mid-run "to check something". If a gap appears, it goes in the synthesis as a gap, and the user decides whether to run again.

Cheapest real savings: fewer agents with better-differentiated questions, and skipping round 3 when round 2 produced no material corrections. Put both in the brief as explicit permissions.
