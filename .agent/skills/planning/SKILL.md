---
name: planning
description: Generates detailed, step-by-step implementation plans for complex coding tasks. Use when you have a spec or requirements and need to break them down into bite-sized actions before coding.
---

# Planning Implementation

## When to use this skill
- You have a clear design or feature request (e.g., from `brainstorming`).
- The task involves multiple files or complex logic.
- You need to ensure a TDD (Test Driven Development) approach.
- The user wants a detailed roadmap before you start changing code.

## Core Philosophy
- **Bite-Sized**: Each task should be a 2-5 minute action.
- **TDD Integration**: Fail -> Pass -> Refactor -> Commit.
- **Context-Free**: The plan should be clear enough that *another* developer could execute it without prior context.
- **Explicit Paths**: Always use full file paths.

## Plan Structure (Template)

Save the plan to: `docs/plans/YYYY-MM-DD-<feature-name>.md`

```markdown
# [Feature Name] Implementation Plan

**Goal**: [One sentence summary]
**Architecture**: [Brief approach description]
**Tech Stack**: [Relevant libraries/frameworks]

---

### Task 1: [Component/Function Name]
**Files**:
- Create: \`path/to/new/file.ts\`
- Modify: \`path/to/existing.ts\`
- Test: \`path/to/test.ts\`

**Step 1: Write/Update the test**
\`\`\`typescript
// Define the expected behavior (failing state)
it('should perform X', () => { ... })
\`\`\`

**Step 2: Run test to verify failure**
- Command: \`npm test -- path/to/test.ts\`
- Expected: FAIL

**Step 3: Implementation**
- Write minimum code to satisfy the test.

**Step 4: Verify Success**
- Command: \`npm test -- path/to/test.ts\`
- Expected: PASS

**Step 5: Commit**
- Command: \`git add ... && git commit -m "feat: ..."\`
```

## Workflow

1.  **Initialize**: Create the `docs/plans` directory if it doesn't exist.
2.  **Draft**: specific the headers and key metadata.
3.  **Breakdown**: Split the feature into small, logical Tasks (e.g., "Setup Types", "Create Util", "Build UI Component").
4.  **Detail**: For each task, fill out the Files, Test, and Implementation steps.
5.  **Review**: Ask the user to review the plan.
    - "I've drafted the implementation plan at [path]. Does this breakdown look correct?"
6.  **Execute**: Once approved, you (or the user) can execute the plan task-by-task.

## Best Practices
- **DRY**: Don't repeat code in the plan if it's obvious, but be specific about *logic*.
- **Atomic Commits**: Every task should end with a working, committable state.
- **Verification**: Include manual verification steps if automated tests aren't covering UI visuals.
