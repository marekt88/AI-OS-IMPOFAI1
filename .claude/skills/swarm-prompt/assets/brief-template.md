# Brief template — fan-out → cross-review → converge

Fill every `[PLACEHOLDER]`. Delete sections that genuinely don't apply, but don't delete the rules block — that's where runs go wrong.

---

```
[GOAL — 2-4 sentences. What is being produced and why. State the decision it
feeds, not just the activity.]

You are the orchestrator. You will run [N] subagents across 3 rounds, then
synthesize. Do not do the analysis yourself — your job is setup, coordination
and synthesis.

DONE MEANS: [checkable criteria — files exist, each section filled or explicitly
marked as lacking data, disagreements listed rather than averaged]

## Setup

Create `.swarm/[run-name]/` with subdirectories `round1/`, `round2/`, `round3/`.

Write `.swarm/[run-name]/context.md` containing:
- [what the project/system is — 3-5 sentences]
- [the sources agents may use: paths, tools, MCP connectors, data locations]
- [constraints and vocabulary every agent needs]
- [what is out of scope]

Every agent prompt must instruct the agent to read this file first.

## Round 1 — independent analysis

Spawn all [N] agents in a SINGLE message so they run in parallel. Each agent
receives a self-contained prompt — it cannot see this conversation, the other
agents, or anything you haven't written into its prompt.

Agent 1 — [NAME]: [the question this agent answers, in one sentence]
  Stance/perspective: [what lens it applies]
  Sources: [exact paths or tools]
  Output: `.swarm/[run-name]/round1/[name].md`

Agent 2 — [NAME]: [...]
  ...

[repeat for each agent]

Every agent's output uses EXACTLY these headings:

  ## Findings
  ## Evidence            [concrete references — file paths, IDs, numbers]
  ## Uncertainties       [what it could not determine, and why]
  ## Implications        [what follows for the overall goal]

Each agent returns to you: a 5-line summary plus its file path. Not the full
document.

## Round 2 — cross-review

When all round 1 files exist, spawn all [N] agents again in a single message.
Each reads the OTHER agents' round 1 files — list the exact paths in each
prompt — and writes to `.swarm/[run-name]/round2/[name]-review.md` using
exactly these headings:

  ## Contradictions      [where another agent conflicts with mine — quote both]
  ## Gaps                [what another missed that my workstream shows matters]
  ## Corrections to my own work
                         [what I got wrong or overstated, seeing the others]
  ## Confidence          [which of my findings I'd defend; which I'd drop]

Each review must contain at least one substantive criticism. "No material
issues" is permitted only with a stated reason.

## Round 3 — revision

Each agent reads the critiques directed at it and rewrites its own analysis to
`.swarm/[run-name]/round3/[name]-final.md`, same headings as round 1, plus:

  ## Changed             [what I revised and why]
  ## Rejected            [criticism I disagree with, and my reasoning]

Skip this round entirely if round 2 produced no corrections worth making —
say so explicitly rather than running it for form.

## Synthesis

You do this yourself. Read the round 3 files (round 1 if round 3 was skipped)
and write `[OUTPUT PATH]` containing:

  1. [Section]           [what it covers]
  2. [Section]
  ...
  N. Open disagreements  [each surviving conflict, both positions stated, no
                          middle ground invented]
  N+1. Gaps              [what no agent could determine]
  N+2. For me to decide  [what needs a human — questions, not recommendations]

## Rules

- Budget: [N] agents × 3 rounds. Do not spawn additional agents mid-run. If a
  gap appears, record it as a gap.
- One writer per file. Agents read each other's files; they never write to them.
- [Write permissions: what agents may modify outside .swarm/ — usually nothing.
  For read-only analysis runs, state it flatly: no writes to source data, no
  changes to [external system], not even as a proposal.]
- Every claim carries evidence — a path, an ID, a number. "Cannot be determined
  from the data" is a valid finding; guessing is not.
- Never average two disagreeing positions into a middle one. Report both.
- If an agent fails or returns nothing usable, continue with the rest and mark
  the gap explicitly in the synthesis. Do not present an incomplete run as
  complete.
- If the same operation fails three times, stop and report rather than trying
  variations.
- Report progress after each round: which agents finished, one line each.
```

---

## Sizing note to include when relevant

For runs where the data volume is unknown, add after Setup:

```
Before round 1, survey the sources and report the volume you found ([X] files,
[Y] records). If it substantially exceeds expectations, stop and ask me before
spawning agents.
```

This costs one cheap step and prevents a twelve-agent-run against the wrong scope.
