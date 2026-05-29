## ADDED Requirements

### Requirement: Chat history persistence
The system SHALL persist chat messages to localStorage so they survive page reloads.

#### Scenario: Chat messages survive page reload
- **WHEN** user has an active conversation and reloads the page
- **THEN** all previous messages are restored from localStorage

#### Scenario: Multiple conversations per document set
- **WHEN** user uploads new documents
- **THEN** the system prompts to start a new conversation or continue the previous one

### Requirement: Multi-turn conversation context
The system SHALL include the last N message pairs as context when sending queries to the LLM.

#### Scenario: Context-aware follow-up question
- **WHEN** user asks a follow-up question referencing a previous answer
- **THEN** the last 3 message pairs are included in the LLM prompt as conversation history

### Requirement: Clear conversation
The system SHALL allow users to clear the current conversation without affecting uploaded documents.

#### Scenario: Clear conversation history
- **WHEN** user clicks "Clear Chat" button
- **THEN** all messages are removed from the UI and localStorage
- **AND** uploaded documents remain intact
