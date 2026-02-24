---
description: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.
tools: ['execute/getTerminalOutput', 'execute/awaitTerminal', 'execute/killTerminal', 'execute/createAndRunTask', 'execute/runInTerminal', 'execute/runNotebookCell', 'execute/testFailure', 'execute/runTests', 'read/terminalSelection', 'read/terminalLastCommand', 'read/getNotebookSummary', 'read/problems', 'read/readFile', 'read/readNotebookCellOutput', 'github-copilot-app-modernization-deploy/appmod-analyze-repository', 'github-copilot-app-modernization-deploy/appmod-check-quota', 'github-copilot-app-modernization-deploy/appmod-diagnostic-existing-resources', 'github-copilot-app-modernization-deploy/appmod-generate-architecture-diagram', 'github-copilot-app-modernization-deploy/appmod-get-available-region', 'github-copilot-app-modernization-deploy/appmod-get-available-region-sku', 'github-copilot-app-modernization-deploy/appmod-get-azd-app-logs', 'github-copilot-app-modernization-deploy/appmod-get-azure-landing-zone-plan', 'github-copilot-app-modernization-deploy/appmod-get-cicd-pipeline-guidance', 'github-copilot-app-modernization-deploy/appmod-get-containerization-plan', 'github-copilot-app-modernization-deploy/appmod-get-iac-rules', 'github-copilot-app-modernization-deploy/appmod-get-plan', 'github-copilot-app-modernization-deploy/appmod-get-waf-rules', 'github-copilot-app-modernization-deploy/appmod-plan-generate-dockerfile', 'github-copilot-app-modernization-deploy/appmod-summarize-result', 'vscjava.migrate-java-to-azure/appmod-install-appcat', 'vscjava.migrate-java-to-azure/appmod-precheck-assessment', 'vscjava.migrate-java-to-azure/appmod-run-assessment', 'vscjava.migrate-java-to-azure/appmod-get-vscode-config', 'vscjava.migrate-java-to-azure/appmod-preview-markdown', 'vscjava.migrate-java-to-azure/migration_assessmentReport', 'vscjava.migrate-java-to-azure/migration_assessmentReportsList', 'vscjava.migrate-java-to-azure/uploadAssessSummaryReport', 'vscjava.migrate-java-to-azure/appmod-search-knowledgebase', 'vscjava.migrate-java-to-azure/appmod-search-file', 'vscjava.migrate-java-to-azure/appmod-fetch-knowledgebase', 'vscjava.migrate-java-to-azure/appmod-create-migration-summary', 'vscjava.migrate-java-to-azure/appmod-run-task', 'vscjava.migrate-java-to-azure/appmod-consistency-validation', 'vscjava.migrate-java-to-azure/appmod-completeness-validation', 'vscjava.migrate-java-to-azure/appmod-version-control', 'vscjava.migrate-java-to-azure/appmod-dotnet-cve-check', 'vscjava.migrate-java-to-azure/appmod-dotnet-run-test', 'vscjava.migrate-java-to-azure/appmod-python-setup-env', 'vscjava.migrate-java-to-azure/appmod-python-validate-syntax', 'vscjava.migrate-java-to-azure/appmod-python-validate-lint', 'vscjava.migrate-java-to-azure/appmod-python-run-test', 'vscjava.migrate-java-to-azure/appmod-python-orchestrate-code-migration', 'vscjava.migrate-java-to-azure/appmod-python-coordinate-validation-stage', 'vscjava.migrate-java-to-azure/appmod-python-check-type', 'vscjava.migrate-java-to-azure/appmod-python-orchestrate-type-check', 'vscjava.migrate-java-to-azure/appmod-dotnet-install-appcat', 'vscjava.migrate-java-to-azure/appmod-dotnet-run-assessment', 'vscjava.migrate-java-to-azure/appmod-dotnet-build-project']
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

1. For each task in the list, use the GitHub MCP server to create a new issue in the repository that is representative of the Git remote.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL
