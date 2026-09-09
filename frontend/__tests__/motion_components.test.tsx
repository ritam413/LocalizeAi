import React from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SpringButton,
  MagneticCard,
  FeatureStaggerGrid,
  MotionReveal,
} from "../components/ui/motion";

beforeAll(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

describe("Motion Components Suite (/taste & /awesome-design)", () => {
  it("renders SpringButton with custom text and variant classes", () => {
    render(<SpringButton variant="emerald">Launch Engine</SpringButton>);
    const button = screen.getByRole("button", { name: /launch engine/i });
    expect(button).toBeDefined();
    expect(button.className).toContain("bg-emerald-600");
  });

  it("renders SpringButton in disabled state", () => {
    render(<SpringButton disabled>Disabled Action</SpringButton>);
    const button = screen.getByRole("button", { name: /disabled action/i });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders MagneticCard with inner content", () => {
    render(
      <MagneticCard data-testid="magnetic-card">
        <h3>Studio Monitor</h3>
      </MagneticCard>
    );
    expect(screen.getByText("Studio Monitor")).toBeDefined();
    expect(screen.getByTestId("magnetic-card")).toBeDefined();
  });

  it("renders FeatureStaggerGrid with multiple child items", () => {
    render(
      <FeatureStaggerGrid data-testid="stagger-grid">
        <div>Item Alpha</div>
        <div>Item Beta</div>
        <div>Item Gamma</div>
      </FeatureStaggerGrid>
    );
    expect(screen.getByText("Item Alpha")).toBeDefined();
    expect(screen.getByText("Item Beta")).toBeDefined();
    expect(screen.getByText("Item Gamma")).toBeDefined();
  });

  it("renders MotionReveal wrapping content", () => {
    render(
      <MotionReveal direction="up">
        <span>Hero Announcement</span>
      </MotionReveal>
    );
    expect(screen.getByText("Hero Announcement")).toBeDefined();
  });
});
