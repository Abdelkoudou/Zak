---
name: brainstorming
description: Facilitates a collaborative dialogue to turn abstract ideas into concrete designs and specifications. Use before starting any creative work or complex implementation.
---

# Brainstorming Ideas Into Designs

## When to use this skill
- Starting a new feature or component
- Turning an abstract idea into a concrete spec
- Clarifying requirements before coding
- Modifying complex existing behavior

## Principles
- **One question at a time**: Never overwhelm the user. Ask one clear question per message.
- **Multiple choice preferred**: Reduce cognitive load by offering options (A, B, C).
- **Incremental validation**: Present designs in small chunks (200-300 words) and get "looks good" before moving on.
- **YAGNI**: Ruthlessly cut unnecessary features.
- **Explore alternatives**: Always propose 2-3 approaches with trade-offs before settling on one.

## Workflow

### 1. Understand the Goal
- **Context Check**: Read relevant files, docs, and recent commits to ground yourself.
- **Clarify**: Ask widely scoped questions to narrow down the user's intent.
    - *Constraint*: Ask **ONLY ONE** question per turn.
    - *Tip*: "What is the primary goal of X?" "Do you prefer approach A or B?"

### 2. Explore Approaches
- Once the goal is clear, propose **2-3 implementation strategies**.
- List trade-offs (Pros/Cons) for each.
- State your recommended approach and why.
- Wait for user selection/approval.

### 3. Develop the Design
- **Drafting**: Create the design document iteratively in the chat.
- **Chunking**: Break it down into:
    - **Architecture/Data Flow**
    - **Component Structure**
    - **State Management**
    - **Edge Cases & Error Handling**
- **Validation**: After *each* section, ask: "Does this look right so far?"

### 4. Final Output
- Once agreed, write the full design to a file.
- **Path**: `docs/plans/YYYY-MM-DD-<topic>-design.md` (Create the `docs/plans` directory if needed).
- **Format**: Markdown with clear headers.

## Transition to Implementation
- Ask: "Ready to create the implementation plan?"
- If yes, use the `planning` skill to break the design into tasks.
