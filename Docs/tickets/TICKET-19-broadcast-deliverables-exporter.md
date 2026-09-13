# TICKET-19: Broadcast Video Multiplexing & Studio Deliverables Exporter

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/engine/stages/exporter.py` (`BroadcastDeliverablesExporter`) & `backend/app/api/deliverables.py`
- **Verification**: Pytest (`backend/tests/test_deliverables_exporter.py`) & Vitest (`frontend/__tests__/deliverables.test.ts`)
- **Blocking Dependencies**: TICKET-06, TICKET-13, TICKET-16, TICKET-17

## Objective
Build a broadcast video multiplexer and packaging engine that assembles final release deliverables into studio-standard formats:
1. **Multiplexed Release MP4**: Original H.264 video + EBU R128 mastered audio track + embedded soft subtitle stream (.vtt/.srt).
2. **Dialogue Stem Bus WAV**: Isolated, aligned localized dialogue bus.
3. **Master Composite Soundtrack WAV**: Fully ducked and mastered composite audio mix.
4. **Subtitle Package**: Standalone `.srt` and `.vtt` timed subtitle files.
5. **Studio Delivery Manifest**: Structured `deliverables.json` manifest with file checksums, codecs, and durations.

## TDD Strategy (`/tdd`)
1. **Red Test**: Author `backend/tests/test_deliverables_exporter.py` verifying:
   - FFmpeg remuxing command produces valid MP4 container without re-encoding video stream (`-c:v copy -c:a aac -b:a 192k -c:s mov_text`).
   - Generates manifest JSON referencing all 4 delivery assets with correct byte sizes and relative paths.
   - Handles missing video gracefully by exporting audio/subtitle bundle only.
2. **Green Implementation**: Implement `BroadcastDeliverablesExporter.package_release()` in `backend/app/engine/stages/exporter.py` and API route `GET /api/v1/runs/{id}/deliverables`.
3. **Refactor**: Connect UI download triggers in `frontend/app/runs/[id]/output/page.tsx`.

## Seams & Interfaces
- Python: `backend/app/engine/stages/exporter.py`
  ```python
  @dataclass
  class DeliverablesManifest:
      job_id: str
      release_video_mp4: Optional[Path]
      mastered_soundtrack_wav: Optional[Path]
      dialogue_bus_wav: Optional[Path]
      subtitles_srt: Optional[Path]
      subtitles_vtt: Optional[Path]
      metadata: Dict[str, Any]
      created_at: str

  class BroadcastDeliverablesExporter:
      async def package_release(
          self,
          source_video_path: Path,
          mastered_audio_path: Path,
          dialogue_bus_path: Path,
          subtitles_vtt_path: Path,
          subtitles_srt_path: Path,
          output_dir: Path,
          target_language: str,
      ) -> DeliverablesManifest:
          pass
  ```

## Input / Output Contracts
- **Input**: Source video, mastered audio, dialogue bus, subtitles paths, and destination directory.
- **Output**: `DeliverablesManifest` with verified paths to generated assets.

## Acceptance Criteria
1. Video remuxing uses stream copy (`-c:v copy`) to preserve visual fidelity without lossy video recompression.
2. Mastered audio is encoded to AAC 192kbps in the MP4 container for broad compatibility across web players, Apple TV, and broadcast devices.
3. Subtitle streams are embedded as soft-subs (`mov_text`) in MP4 and persisted as standalone `.srt` and `.vtt` files.
4. Generates a valid JSON manifest in the output directory containing sha256 checksums and durations for each asset.
5. Pytest suite passes 100% in `backend/tests/test_deliverables_exporter.py`.
