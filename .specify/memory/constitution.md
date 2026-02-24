<!--
Sync Impact Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: 1.0.0 → 2.0.0 (MAJOR - Non-negotiable requirement removed)
Modified Principles:
  - Principle I: "Unit Testing (NON-NEGOTIABLE)" → "Unit Testing (Encouraged)"
    - Removed mandatory requirement
    - Changed from MUST to SHOULD for test writing
    - Removed 80% coverage threshold requirement
    - Tests now encouraged but optional
Rationale:
  - User feedback that mandatory tests create unnecessary friction
  - Tests still strongly encouraged for quality but not blocking
  - Developers can choose to implement tests based on project needs
Templates Requiring Updates:
  ⚠️  plan-template.md - Constitution Check section references mandatory testing
  ⚠️  tasks-template.md - States "tests are MANDATORY" - needs update
  ⚠️  specs/001-discord-proxy-bot/tasks.md - References mandatory tests
  ✅ spec-template.md - No changes needed (user stories unaffected)
  ✅ agent files - Generic guidance maintained
Follow-up Actions:
  1. Update plan-template.md Constitution Check to reflect optional testing
  2. Update tasks-template.md to change MANDATORY → encouraged
  3. Review existing feature tasks.md files for consistency
  4. No code changes needed (tests remain backward compatible)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# ProxyTickets Constitution

## Core Principles

### I. Unit Testing (Encouraged)

Developers are ENCOURAGED to include unit tests that validate individual components in isolation. When writing tests, they SHOULD:
- Be written before or during implementation (Test-Driven Development preferred)
- Cover public interfaces and critical business logic
- Execute quickly (< 1 second per test suite)
- Be independent and repeatable without external dependencies
- Aim for meaningful coverage of critical paths

**Rationale**: Unit tests provide fast feedback during development, catch regressions early, and serve as executable documentation. While tests significantly improve code quality and enable confident refactoring, they are optional to avoid creating unnecessary friction in the development process. Developers should use their judgment to determine when tests add value.

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

Projects MAY implement a multi-layered testing strategy:
- **Unit Tests** (optional, encouraged): Test individual components in isolation
- **Integration Tests** (optional, recommended for multi-component features): Test component interactions
- **Contract Tests** (optional, recommended for APIs/interfaces): Test interface compliance
- **End-to-End Tests** (optional): Test complete user journeys

**Note**: While all testing types are optional, they are strongly encouraged for production systems and complex features.

### Code Organization

Projects MUST follow a clear, consistent structure:
- Separate source code (`src/`), tests (`tests/`), and documentation (`docs/` or `specs/`)
- Group related functionality into modules/packages
- Keep configuration separate from code
- Use dependency injection for testability
- Maintain flat hierarchies (avoid deep nesting)

### Quality Gates

Code SHOULD pass these gates before merging:
- All tests pass (if tests are implemented)
- Linter checks pass (warnings acceptable with justification)
- No critical security vulnerabilities in dependencies
- Documentation updated for significant API changes

**Note**: These are recommended quality standards, not blocking requirements. Use judgment based on project needs and context.

## Code Review & Compliance

### Review Requirements

All code changes SHOULD:
- Be reviewed by at least one team member (when working in a team)
- Include tests when they add value
- Verify compliance with Core Principles where applicable
- Explain any complexity or deviation from standards
- Update relevant documentation for significant changes

### Complexity Justification

Any deviation from Simplicity First MUST be documented with:
- Clear problem statement requiring complexity
- Alternatives considered and why they were rejected
- Performance or scalability data supporting the decision
- Plan for simplifying in the future if possible

### Constitution Verification

All pull requests and code reviews SHOULD verify:
- Simplicity First principle followed ✓
- Best practices applied ✓
- User story independence maintained (for multi-story features) ✓
- Tests included when beneficial ○ (optional)
- Test-first workflow used when beneficial ○ (optional)

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

**Version**: 2.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
