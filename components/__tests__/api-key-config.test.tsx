import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ApiKeyConfigurator from "../api-key-config";

describe("ApiKeyConfigurator", () => {
  it("renders Anthropic and OpenAI format toggles", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    expect(screen.getByText(/Anthropic Compatible/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI Compatible/i)).toBeInTheDocument();
  });

  it("renders API key input", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    const inputs = screen.getAllByPlaceholderText(/Enter your API key/i);
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders privacy notice", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    const notices = screen.getAllByText(/stored only in this browser/i);
    expect(notices.length).toBeGreaterThan(0);
  });
});
