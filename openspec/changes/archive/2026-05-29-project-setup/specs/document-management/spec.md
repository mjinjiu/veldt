## ADDED Requirements

### Requirement: Document list display
The system SHALL display a list of all uploaded documents with filename and chunk count.

#### Scenario: Show document list after upload
- **WHEN** user uploads one or more documents
- **THEN** the system displays each document's filename and chunk count in a document management panel

#### Scenario: Show document list on page load
- **WHEN** the page loads with existing documents in the vector database
- **THEN** the system fetches and displays the list of all uploaded documents

### Requirement: Document deletion
The system SHALL allow users to delete individual documents by doc_id, removing all associated chunks from the vector database.

#### Scenario: Delete a single document
- **WHEN** user clicks "Delete" on a document in the management panel
- **THEN** all chunks associated with that doc_id are removed from LanceDB
- **AND** the document disappears from the list

#### Scenario: Delete with confirmation
- **WHEN** user clicks "Delete" on a document
- **THEN** a confirmation prompt appears before deletion executes

### Requirement: Document content preview
The system SHALL allow users to preview the text content of an uploaded document's chunks.

#### Scenario: Preview document chunks
- **WHEN** user clicks "Preview" on a document in the management panel
- **THEN** the concatenated text of all chunks for that document is displayed in a read-only view

### Requirement: Delete all documents
The system SHALL allow users to delete all documents at once, clearing the entire vector database.

#### Scenario: Clear all documents
- **WHEN** user clicks "Clear All" in the document management panel
- **THEN** a confirmation dialog appears
- **AND** upon confirmation, all documents are removed from LanceDB
- **AND** the document list becomes empty
