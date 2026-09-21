# TICKET-36: Frontend Deliverables File Object Streaming Bridge

## Status
- **State**: Planned (Wayfinder Map Child Issue)
- **Primary Seams**: 
  - `frontend/lib/mediaTrackHelpers.ts` (`getPreviewStreamUrl`)
  - `frontend/app/runs/[id]/page.tsx` (`BeforeAfterPlayer` stream prop wiring)
- **Verification**: Vitest (`frontend/__tests__/mediaTrackHelpers.test.ts`)
- **Blocking Dependencies**: None
- **Downstream Blocked**: None

## Objective
Safely handle manifest file objects (`{ filename, relative_path, size_bytes }`) passed to `getPreviewStreamUrl()`, preventing `GET /api/v1/clips/preview-stream?path=%5Bobject%20Object%5D` (404 Not Found) errors in the browser and backend logs.

## Seams & Interfaces
- TypeScript: `frontend/lib/mediaTrackHelpers.ts`:
  ```typescript
  export function getPreviewStreamUrl(
    filePath?: string | { relative_path?: string; path?: string; filename?: string } | null
  ): string | undefined {
    if (!filePath) return undefined;
    const rawPath = typeof filePath === 'object' ? (filePath.relative_path || filePath.path || filePath.filename) : filePath;
    if (!rawPath || typeof rawPath !== 'string') return undefined;
    return `/api/v1/clips/preview-stream?path=${encodeURIComponent(rawPath)}`;
  }
  ```

## TDD Test Specification (Red -> Green)
Test Seam: `frontend/__tests__/mediaTrackHelpers.test.ts`
```typescript
it('safely extracts relative_path or path when an object is passed', () => {
  const fileObj = {
    filename: 'mastered_soundtrack.wav',
    relative_path: './deliverables/mastered_soundtrack.wav',
    size_bytes: 3304758,
  };
  const url = getPreviewStreamUrl(fileObj as any);
  expect(url).toBe('/api/v1/clips/preview-stream?path=.%2Fdeliverables%2Fmastered_soundtrack.wav');
});
```

## Acceptance Criteria
1. `getPreviewStreamUrl` accepts either raw string paths or deliverable file metadata objects.
2. Passing an object extracts the valid `relative_path` or `path` string.
3. No `path=%5Bobject%20Object%5D` requests are generated.
