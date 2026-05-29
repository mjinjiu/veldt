## ADDED Requirements

### Requirement: Configurable AI service URL
The system SHALL read the AI backend service URL from the `AI_SERVICE_URL` environment variable, defaulting to `http://localhost:8000`.

#### Scenario: Default service URL
- **WHEN** `AI_SERVICE_URL` is not set
- **THEN** all API routes use `http://localhost:8000` to reach the Python AI service

#### Scenario: Custom service URL
- **WHEN** `AI_SERVICE_URL` is set to `http://ai-backend:8000`
- **THEN** all API routes use `http://ai-backend:8000` to reach the Python AI service

### Requirement: Graceful degradation when AI service is unavailable
The system SHALL display a clear, user-friendly message when the Python AI service cannot be reached.

#### Scenario: AI service offline on ingest
- **WHEN** user attempts to upload a document but the AI service is unreachable
- **THEN** the upload zone displays "AI service is not running. Please start the AI backend."

#### Scenario: AI service offline on chat
- **WHEN** user sends a query but the AI service is unreachable
- **THEN** the chat displays an error message "AI backend is not running. Start it with: python ai/main.py"

#### Scenario: Health check reflects service status
- **WHEN** the `/api/health` endpoint is called
- **THEN** the response includes whether the AI backend is reachable

### Requirement: File size validation
The system SHALL validate file size before upload on the client side, rejecting files larger than 50MB.

#### Scenario: File within size limit
- **WHEN** user selects a file under 50MB
- **THEN** the upload proceeds normally

#### Scenario: File exceeds size limit
- **WHEN** user selects a file over 50MB
- **THEN** an error message "File exceeds 50MB limit" is displayed in the upload zone
- **AND** the file is not uploaded

### Requirement: Ingest API size limit
The system SHALL enforce a 50MB request body size limit on the ingest API route.

#### Scenario: Ingest request exceeds limit
- **WHEN** a file upload to `/api/ingest` exceeds the configured body size limit
- **THEN** the API returns HTTP 413 with an appropriate error message
