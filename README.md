# ProxyTickets

A project built following rigorous engineering principles defined in the [ProxyTickets Constitution](.specify/memory/constitution.md).

## Development Principles

This project adheres to five core principles:

1. **Unit Testing (NON-NEGOTIABLE)**: Comprehensive unit tests with ≥80% coverage
2. **Simplicity First**: Avoid overengineering; start simple, justify complexity
3. **Best Practices**: Follow industry standards and language conventions
4. **Test-First Development**: Write tests before implementation
5. **User Story Independence**: Each story is independently testable and deliverable

For full details, see [.specify/memory/constitution.md](.specify/memory/constitution.md).

## Project Structure

```text
ProxyTickets/
├── .github/
│   ├── agents/          # Speckit workflow agents
│   └── prompts/         # Agent prompt files
├── .specify/
│   ├── memory/
│   │   └── constitution.md    # Project constitution (authoritative)
│   ├── templates/             # Workflow templates
│   └── scripts/               # Automation scripts
├── specs/               # Feature specifications (created per feature)
├── src/                 # Source code (to be created)
└── tests/              # Test suites (to be created)
    ├── unit/           # Unit tests (mandatory)
    ├── integration/    # Integration tests
    └── contract/       # Contract tests for APIs
```

## Development Workflow

This project uses the Speckit framework for structured feature development:

1. **Specify** (`/speckit.specify`): Create feature specification with user stories
2. **Plan** (`/speckit.plan`): Generate implementation plan and design artifacts
3. **Tasks** (`/speckit.tasks`): Break down into actionable, ordered tasks
4. **Implement** (`/speckit.implement`): Execute tasks with constitution compliance
5. **Analyze** (`/speckit.analyze`): Verify consistency and quality

Each phase includes a **Constitution Check** to ensure compliance with core principles.

## Getting Started

*(To be added as the project develops)*

## Quality Standards

All code must pass these gates:

- ✅ Unit tests pass (≥80% coverage)
- ✅ Linter checks pass
- ✅ No security vulnerabilities
- ✅ Constitution principles verified
- ✅ Code review approved

## Contributing

When contributing:

1. Review the [Constitution](.specify/memory/constitution.md)
2. Follow the test-first workflow
3. Start with the simplest solution
4. Justify any complexity
5. Ensure user stories are independent

## License

*(To be determined)*
