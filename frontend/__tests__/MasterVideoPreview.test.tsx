import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MasterVideoPreview } from '../components/studio/MasterVideoPreview';

describe('MasterVideoPreview Cinema Monitor Component', () => {
  let createdUrls: string[] = [];
  let revokedUrls: string[] = [];

  beforeEach(() => {
    createdUrls = [];
    revokedUrls = [];
    global.URL.createObjectURL = vi.fn((file: any) => {
      const url = `blob:http://localhost:3000/${file.name || 'mock-blob'}`;
      createdUrls.push(url);
      return url;
    });
    global.URL.revokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty placeholder when no video is loaded', () => {
    render(<MasterVideoPreview />);
    expect(screen.getByText('No Master Footage Loaded')).toBeInTheDocument();
    expect(screen.getByText(/Please ingest a video file/i)).toBeInTheDocument();
  });

  it('renders direct local disk zero-copy stream when a File object is passed', () => {
    const mockFile = new File(['fake movie data'], 'theatrical_cut.mp4', { type: 'video/mp4' });
    const { unmount } = render(<MasterVideoPreview file={mockFile} />);

    expect(screen.getByText('theatrical_cut.mp4')).toBeInTheDocument();
    expect(screen.getByText('Direct Local Disk Zero-Copy')).toBeInTheDocument();
    expect(screen.getByText('⚡ 0-Latency Blob')).toBeInTheDocument();

    const videoEl = screen.getByRole('button', { name: /play/i });
    expect(videoEl).toBeInTheDocument();

    unmount();
    expect(revokedUrls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders range stream when a diskPath is passed', () => {
    render(<MasterVideoPreview diskPath="storage/sample_movie.mp4" />);

    expect(screen.getByText('sample_movie.mp4')).toBeInTheDocument();
    expect(screen.getByText('Direct Disk NVMe Stream')).toBeInTheDocument();
    expect(screen.getByText('📡 Range Stream')).toBeInTheDocument();
  });

  it('renders sample reel badge when isSampleReel is true', () => {
    render(<MasterVideoPreview isSampleReel={true} />);

    expect(screen.getByText(/sample_movie.mp4 \(Studio 4K Reel\)/i)).toBeInTheDocument();
    expect(screen.getByText('Studio 4K Reel')).toBeInTheDocument();
  });

  it('calls onBackToSetup when button is clicked', () => {
    const handleBack = vi.fn();
    render(<MasterVideoPreview isSampleReel={true} onBackToSetup={handleBack} />);

    const backBtn = screen.getByRole('button', { name: /configure run/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
