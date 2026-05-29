## ADDED Requirements

### Requirement: TXT file upload
The system SHALL accept `.txt` files for upload and ingestion, in addition to `.pdf` and `.md`/`.markdown` files.

#### Scenario: Upload a text file
- **WHEN** user uploads a `.txt` file
- **THEN** the file is read as UTF-8 text, chunked, embedded, and stored in the vector database

#### Scenario: Upload a text file with non-UTF-8 encoding
- **WHEN** user uploads a `.txt` file with non-UTF-8 encoding
- **THEN** the system attempts UTF-8 decoding with error replacement and processes available text

### Requirement: Upload accept attribute reflects supported formats
The system SHALL include `.txt` in the file input accept attribute and UI copy.

#### Scenario: File picker shows supported formats
- **WHEN** user opens the file picker dialog
- **THEN** `.txt`, `.pdf`, `.md`, and `.markdown` files are selectable

#### Scenario: Drag-and-drop hint includes TXT
- **WHEN** the upload zone is displayed
- **THEN** the helper text mentions PDF, Markdown, and TXT as supported formats
