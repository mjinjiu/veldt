import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UploadZone from "../upload-zone";

describe("UploadZone", () => {
  it("renders upload instructions", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={true} />);
    expect(screen.getByText(/Drop documents here/i)).toBeInTheDocument();
  });

  it("shows supported formats", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={true} />);
    expect(screen.getAllByText(/PDF, Markdown, or TXT/i).length).toBeGreaterThan(0);
  });

  it("shows offline state when aiOnline is false", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={false} />);
    expect(screen.getByText(/AI service offline/i)).toBeInTheDocument();
  });
});
