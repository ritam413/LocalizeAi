import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Clip(Base):
    __tablename__ = "clips"

    id = Column(String, primary_key=True, default=gen_uuid)
    source_path = Column(Text, nullable=False)
    filename = Column(Text, nullable=False)
    duration_s = Column(Float, nullable=True)
    codec = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    audio_channels = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    runs = relationship("Run", back_populates="clip", cascade="all, delete-orphan")


class Preset(Base):
    __tablename__ = "presets"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(Text, nullable=False)
    project_mode = Column(Text, nullable=False)
    is_builtin = Column(Boolean, default=False, nullable=False)
    stage_config_json = Column(Text, nullable=False)
    qa_thresholds_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Run(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, default=gen_uuid)
    clip_id = Column(String, ForeignKey("clips.id"), nullable=False)
    preset_id = Column(String, ForeignKey("presets.id"), nullable=True)
    project_mode = Column(Text, nullable=False)
    source_language = Column(Text, nullable=True)
    target_languages_json = Column(Text, nullable=False)
    subtitle_only = Column(Boolean, default=False, nullable=False)
    frozen_stage_config_json = Column(Text, nullable=False)
    status = Column(Text, nullable=False) # queued, running, needs_review, completed, failed, interrupted, cancelled
    current_stage = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    clip = relationship("Clip", back_populates="runs")
    stage_runs = relationship("StageRun", back_populates="run", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="run", cascade="all, delete-orphan")
    speakers = relationship("Speaker", back_populates="run", cascade="all, delete-orphan")
    segments = relationship("Segment", back_populates="run", cascade="all, delete-orphan")


class StageRun(Base):
    __tablename__ = "stage_runs"

    id = Column(String, primary_key=True, default=gen_uuid)
    run_id = Column(String, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(Text, nullable=False) # extraction, denoise, separation, vad, diarization, transcription, translation, tts, duration_align, remix, remux, lip_sync
    target_language = Column(Text, nullable=True)
    model_id = Column(String, ForeignKey("model_registry.id"), nullable=True)
    machine = Column(Text, nullable=True) # gpu_box, laptop
    status = Column(Text, nullable=False) # pending, queued, running, needs_review, completed, failed, stale
    progress_pct = Column(Float, default=0.0, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    run = relationship("Run", back_populates="stage_runs")
    artifacts = relationship("Artifact", back_populates="stage_run", cascade="all, delete-orphan")


class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String, primary_key=True, default=gen_uuid)
    stage_run_id = Column(String, ForeignKey("stage_runs.id", ondelete="CASCADE"), nullable=False)
    run_id = Column(String, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    type = Column(Text, nullable=False) # audio, video, subtitle, json, log, image
    label = Column(Text, nullable=False)
    path = Column(Text, nullable=False)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("Run", back_populates="artifacts")
    stage_run = relationship("StageRun", back_populates="artifacts")


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(String, primary_key=True, default=gen_uuid)
    run_id = Column(String, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    label = Column(Text, nullable=False)
    color_tag = Column(Text, nullable=True)

    run = relationship("Run", back_populates="speakers")
    reference_clips = relationship("ReferenceClip", back_populates="speaker", cascade="all, delete-orphan")
    segments = relationship("Segment", back_populates="speaker")


class ReferenceClip(Base):
    __tablename__ = "reference_clips"

    id = Column(String, primary_key=True, default=gen_uuid)
    speaker_id = Column(String, ForeignKey("speakers.id", ondelete="CASCADE"), nullable=False)
    path = Column(Text, nullable=False)
    duration_s = Column(Float, nullable=True)
    is_selected = Column(Boolean, default=False, nullable=False)

    speaker = relationship("Speaker", back_populates="reference_clips")


class Segment(Base):
    __tablename__ = "segments"

    id = Column(String, primary_key=True, default=gen_uuid)
    run_id = Column(String, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    speaker_id = Column(String, ForeignKey("speakers.id"), nullable=True)
    target_language = Column(Text, nullable=True)
    start_s = Column(Float, nullable=False)
    end_s = Column(Float, nullable=False)
    source_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    target_duration_s = Column(Float, nullable=True)
    estimated_speech_duration_s = Column(Float, nullable=True)
    cps = Column(Float, nullable=True)
    gap_before_s = Column(Float, nullable=True)
    edited = Column(Boolean, default=False, nullable=False)
    approved = Column(Boolean, default=False, nullable=False)

    run = relationship("Run", back_populates="segments")
    speaker = relationship("Speaker", back_populates="segments")


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String, primary_key=True)
    stage_type = Column(Text, nullable=False) # separation, vad, diarization, asr, mt, tts, lip_sync
    display_name = Column(Text, nullable=False)
    license = Column(Text, nullable=True)
    vram_footprint_mb = Column(Integer, nullable=True)
    language_coverage_json = Column(Text, nullable=True)
    entrypoint = Column(Text, nullable=False)
    weights_path = Column(Text, nullable=True)
    installed = Column(Boolean, default=False, nullable=False)


class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True)
    display_name = Column(Text, nullable=False)
    role = Column(Text, nullable=False) # gpu_worker, preprocessing_worker, either
    last_seen_at = Column(DateTime, nullable=True)
    status = Column(Text, default="offline", nullable=False) # online, offline, busy
    current_stage_run_id = Column(String, ForeignKey("stage_runs.id"), nullable=True)


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    working_dir = Column(Text, nullable=False)
    shared_folder_path = Column(Text, nullable=True)
    retention_days = Column(Integer, nullable=True)
    gpu_vram_mb = Column(Integer, default=4096, nullable=False)
    cpu_cores = Column(Integer, nullable=True)
    qa_min_gap_ms = Column(Integer, default=100, nullable=False)
    qa_max_cps = Column(Float, default=17.0, nullable=False)
    qa_min_duration_s = Column(Float, default=1.0, nullable=False)
    qa_max_line_chars = Column(Integer, default=42, nullable=False)
