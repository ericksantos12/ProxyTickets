<!--
Sync Impact Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: INITIAL → 1.0.0
Modified Principles: N/A (initial constitution)
Added Sections:
  - Core Principles (5 principles)
  - Development Standards
  - Code Review & Compliance
  - Governance
Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - User story prioritization aligns with Simplicity First
  ✅ tasks-template.md - Test-first approach aligns with Unit Testing principle
  ✅ agent files - Generic guidance maintained
Follow-up TODOs: None
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# ProxyTickets Constitution

## Core Principles

### I. Unit Testing (NON-NEGOTIABLE)

Every feature MUST include comprehensive unit tests that validate individual components in isolation. Unit tests MUST:
- Be written before or during implementation (Test-Driven Development preferred)
- Cover all public interfaces and critical business logic
- Execute quickly (< 1 second per test suite)
- Be independent and repeatable without external dependencies
- Achieve minimum 80% code coverage for new code

**Rationale**: Unit tests provide the fastest feedback loop during development, catch regressions early, and serve as executable documentation. They are the foundation of code quality and enable confident refactoring.

### II. Simplicity First

Solutions MUST prioritize simplicity over complexity. Implementation choices MUST:
- Start with the simplest approach that solves the problem (YAGNI - You Aren't Gonna Need It)
- Avoid premature optimization and speculative generality
- Prefer composition over inheritance
- Use standard library features before adding external dependencies
- Require explicit justification for any architectural complexity

**Rationale**: Simple code is easier to understand, maintain, test, and debug. Overengineering increases cognitive load, introduces bugs, and slows development. Complexity must earn its place through demonstrated need.

### III. Best Practices

All code MUST adhere to industry-standard best practices for the technology stack in use. This includes:
- Following language-specific conventions and idioms
- Implementing proper error handling and logging
- Using meaningful names for variables, functions, and classes
- Writing self-documenting code with clear intent
- Maintaining consistent formatting and style (automated via linters)
- Documenting public APIs and complex logic
- Applying SOLID principles where appropriate

**Rationale**: Best practices are distilled wisdom from the community. They reduce cognitive friction, improve maintainability, and help teams work cohesively. Consistency across the codebase reduces surprises and bugs.

### IV. Test-First Development

Development MUST follow this workflow:
1. Write specification with clear acceptance criteria
2. Design tests that validate acceptance criteria (tests should fail initially)
3. Implement minimum code to make tests pass
4. Refactor while keeping tests green
5. Tests MUST be reviewed and approved before implementation begins

**Rationale**: Test-first development ensures implementation aligns with requirements, prevents scope creep, and creates a safety net for refactoring. Starting with tests clarifies requirements and reveals ambiguities before coding begins.

### V. User Story Independence

Features MUST be decomposed into independently testable, deliverable user stories. Each user story MUST:
- Have clear acceptance criteria that can be verified
- Be implementable, testable, and deployable in isolation
- Provide standalone value (viable MVP increment)
- Include priority classification (P1, P2, P3, etc.)
- Map to specific tasks organized by priority

**Rationale**: Independent user stories enable incremental delivery, parallel development, and early user feedback. They reduce work-in-progress, minimize integration risks, and allow flexible prioritization based on business value.

## Development Standards

### Testing Hierarchy

Projects MUST implement a multi-layered testing strategy:
- **Unit Tests** (mandatory): Test individual components in isolation
- **Integration Tests** (required for multi-component features): Test component interactions
- **Contract Tests** (required for APIs/interfaces): Test interface compliance
- **End-to-End Tests** (optional): Test complete user journeys

### Code Organization

Projects MUST follow a clear, consistent structure:
- Separate source code (`src/`), tests (`tests/`), and documentation (`docs/` or `specs/`)
- Group related functionality into modules/packages
- Keep configuration separate from code
- Use dependency injection for testability
- Maintain flat hierarchies (avoid deep nesting)

### Quality Gates

Code MUST pass these gates before merging:
- All tests pass (unit, integration, contract)
- Linter checks pass with zero warnings
- Code coverage meets minimum threshold (80%)
- No known security vulnerabilities in dependencies
- Documentation updated for API changes

## Code Review & Compliance

### Review Requirements

All code changes MUST:
- Be reviewed by at least one team member
- Include tests that demonstrate acceptance criteria
- Verify compliance with all Core Principles
- Explain any complexity or deviation from standards
- Update relevant documentation

### Complexity Justification

Any deviation from Simplicity First MUST be documented with:
- Clear problem statement requiring complexity
- Alternatives considered and why they were rejected
- Performance or scalability data supporting the decision
- Plan for simplifying in the future if possible

### Constitution Verification

All pull requests and code reviews MUST verify:
- Unit tests exist and pass ✓
- Simplicity First principle followed ✓
- Best practices applied ✓
- Test-first workflow adhered to ✓
- User story independence maintained ✓

## Governance

This Constitution supersedes all other development practices. It serves as the authoritative reference for architectural decisions and code quality standards.

### Amendment Procedure

Amendments to this Constitution require:
1. Documented proposal with rationale
2. Impact analysis on existing templates and workflows
3. Team consensus or approval from project lead
4. Migration plan for existing code if needed
5. Version bump following semantic versioning:
   - **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
   - **MINOR**: New principles or material guidance expansion
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review

Constitution compliance MUST be:
- Verified in every pull request via Constitution Check section in plan.md
- Reviewed during sprint retrospectives
- Enforced through automated quality gates where possible
- Documented when complexity requires justified exceptions

### Development Guidance

For runtime development workflow and agent collaboration, refer to `.github/agents/*.agent.md` files. The Constitution defines the "what" and "why"; agent files define the "how" and "when".

**Version**: 1.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
