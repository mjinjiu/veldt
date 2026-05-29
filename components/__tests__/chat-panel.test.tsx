import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatPanel from "../chat-panel";

describe("ChatPanel", () => {
  it("renders placeholder when no documents", () => {
    render(<ChatPanel config={null} hasDocuments={false} aiOnline={true} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    expect(screen.getByText(/Upload documents to get started/i)).toBeInTheDocument();
  });

  it("disables input when no API key", () => {
    render(<ChatPanel config={null} hasDocuments={true} aiOnline={true} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    const inputs = screen.getAllByPlaceholderText(/Set your API key/i);
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]).toBeDisabled();
  });

  it("shows offline message when aiOnline is false", () => {
    render(<ChatPanel config={{ format: "anthropic", baseUrl: "http://test", apiKey: "key", model: "test" }} hasDocuments={true} aiOnline={false} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    const inputs = screen.getAllByPlaceholderText(/AI backend not running/i);
    expect(inputs.length).toBeGreaterThan(0);
  });
});
