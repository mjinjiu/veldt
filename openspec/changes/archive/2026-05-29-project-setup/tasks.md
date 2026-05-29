## 1. Project Governance Setup

- [x] 1.1 Initialize Comet state with `comet-state.sh init project-setup full`
- [x] 1.2 Create `.env.example` with `AI_SERVICE_URL` documentation
- [x] 1.3 Fix header GitHub icon link from `github.com` to actual repo URL

## 2. Service Resilience

- [x] 2.1 Add `AI_SERVICE_URL` env var support to `app/api/ingest/route.ts` with default `http://localhost:8000`
- [x] 2.2 Add `AI_SERVICE_URL` env var support to `app/api/chat/route.ts` with default `http://localhost:8000`
- [x] 2.3 Add graceful error display in `upload-zone.tsx` when AI service is unreachable
- [x] 2.4 Add graceful error display in `chat-panel.tsx` when AI service is unreachable
- [x] 2.5 Add client-side file size validation (50MB limit) in `upload-zone.tsx`
- [x] 2.6 Add `bodySizeLimit` config to ingest route (Next.js `export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }`)
- [x] 2.7 Improve `/api/health` to check AI backend connectivity and return both services' status

## 3. Document Management

- [x] 3.1 Add `GET /api/documents` route that queries LanceDB for distinct document list
- [x] 3.2 Add `DELETE /api/documents/[doc_id]` route that removes all chunks for a doc_id
- [x] 3.3 Add `DELETE /api/documents` route that drops and recreates the LanceDB table
- [x] 3.4 Create `components/document-manager.tsx` with document list, delete buttons, and preview
- [x] 3.5 Integrate `DocumentManager` into `app/page.tsx` main layout
- [x] 3.6 Add confirmation dialog component for destructive actions (delete, clear all)

## 4. Chat Persistence

- [x] 4.1 Add localStorage save/load for chat messages in `chat-panel.tsx`
- [x] 4.2 Add "New Conversation" button that resets messages but keeps documents
- [x] 4.3 Add multi-turn context: include last 3 message pairs in LLM prompt in `app/api/chat/route.ts`
- [x] 4.4 Fix global mutable `nextId` in `chat-panel.tsx` by using `useRef` instead

## 5. Text File Support

- [x] 5.1 Add `.txt` parsing branch in `ai/main.py` `_parse_markdown` or new `_parse_txt` function
- [x] 5.2 Update `upload-zone.tsx` accept attribute to include `.txt`
- [x] 5.3 Update upload zone helper text to mention TXT files

## 6. DevOps Pipeline

- [x] 6.1 Install Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- [x] 6.2 Add `vitest.config.ts` with jsdom environment and path aliases
- [x] 6.3 Write component test for `upload-zone.tsx`: renders, handles file selection
- [x] 6.4 Write component test for `chat-panel.tsx`: renders placeholder, enables input with config
- [x] 6.5 Write component test for `api-key-config.tsx`: renders provider options, persists to localStorage
- [x] 6.6 Add `test` script to `package.json`: `"test": "vitest run"`
- [x] 6.7 Create `.github/workflows/ci.yml` with lint, type-check, and test jobs
