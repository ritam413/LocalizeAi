# TICKET-36: Frontend Deliverables File Object Streaming Bridge

## Status
- **State**: Implemented (Closed)
- **Primary Seams**: 
  - `frontend/lib/mediaTrackHelpers.ts` (`getPreviewStreamUrl`)
  - `backend/app/engine/stages/exporter.py` (`files_dict` storage_path serialization)
  - `frontend/app/runs/[id]/page.tsx` (`BeforeAfterPlayer` stream prop wiring)
- **Verification**: Vitest (`frontend/__tests__/mediaTrackHelpers.test.ts` - 15/15 passed)
- **Blocking Dependencies**: None
- **Downstream Blocked**: None

## Objective
Safely handle manifest file objects (`{ filename, relative_path, storage_path, size_bytes }`) passed to `getPreviewStreamUrl()`, preventing `GET /api/v1/clips/preview-stream?path=%5Bobject%20Object%5D` and orphaned relative subpath 404 errors in the browser and backend logs.

## Seams & Interfaces
- TypeScript: `frontend/lib/mediaTrackHelpers.ts`:
  ```typescript
  export type StreamablePathInput =
    | string
    | {
        relative_path?: string;
        storage_path?: string;
        path?: string;
        filename?: string;
        url?: string;
      }
    | null
    | undefined;

  export function getPreviewStreamUrl(
    filePath?: StreamablePathInput,
    fallbackRunId?: string
  ): string | undefined {
    if (!filePath) return undefined;

    let raw: string | undefined;
    if (typeof filePath === 'object') {
      raw =
        filePath.storage_path ||
        filePath.url ||
        filePath.path ||
        filePath.relative_path ||
        filePath.filename;

      if (raw && raw.startsWith('./deliverables/') && fallbackRunId) {
        raw = `storage/runs/${fallbackRunId}/${raw.replace('./', '')}`;
      }
    } else {
      raw = filePath;
    }

    if (!raw || typeof raw !== 'string') return undefined;

    const trimmed = raw.trim().replace(/\\/g, '/');
    if (!trimmed) return undefined;

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('/api/v1/clips/preview-stream')
    ) {
      return trimmed;
    }

    return `/api/v1/clips/preview-stream?path=${encodeURIComponent(trimmed)}`;
  }
  ```

## Acceptance Criteria
1. `getPreviewStreamUrl` accepts either raw string paths or deliverable file metadata objects.
2. Passing an object extracts `storage_path`, `url`, `path`, or `relative_path`.
3. Normalizes Windows backslashes and handles idempotency on HTTP/blob/API URLs.
4. Backend `BroadcastDeliverablesExporter` emits `storage_path` for direct stream routing.
5. No `path=%5Bobject%20Object%5D` requests are generated.

