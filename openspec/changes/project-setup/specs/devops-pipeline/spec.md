## ADDED Requirements

### Requirement: Frontend component tests
The system SHALL have automated tests covering core UI components: upload zone, chat panel, and API key configuration.

#### Scenario: Upload zone renders correctly
- **WHEN** the UploadZone component mounts
- **THEN** it displays the drop zone with upload instructions

#### Scenario: Chat panel renders placeholder when no documents
- **WHEN** ChatPanel mounts with `hasDocuments=false`
- **THEN** it displays "Upload documents to get started."

#### Scenario: API key config persists to localStorage
- **WHEN** user enters an API key and selects a provider
- **THEN** the configuration is saved to localStorage under `veldt-api-config`

### Requirement: CI/CD pipeline
The system SHALL have a GitHub Actions workflow that runs lint, type check, and tests on every push and pull request.

#### Scenario: Push triggers CI
- **WHEN** code is pushed to any branch
- **THEN** the CI workflow runs ESLint, TypeScript type checking, and Vitest tests

#### Scenario: CI failure blocks merge
- **WHEN** any step in the CI workflow fails
- **THEN** the PR cannot be merged without admin override

### Requirement: Environment configuration reference
The system SHALL provide an `.env.example` file documenting all configurable environment variables.

#### Scenario: New developer onboarding
- **WHEN** a developer clones the repository
- **THEN** they can copy `.env.example` to `.env` to see available configuration options

### Requirement: Fixed GitHub repository link
The system SHALL link to the actual project repository instead of the generic github.com placeholder.

#### Scenario: Click header GitHub icon
- **WHEN** user clicks the GitHub icon in the header
- **THEN** they are directed to the actual Veldt repository
