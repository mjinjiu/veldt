# Veldt Deployment Guide

## Docker Quick Start

The fastest way to run Veldt is with Docker:

```bash
docker run -p 3000:3000 -v veldt_data:/data veldt
```

This starts everything in a single container.

## Manual Setup

If you prefer running without Docker, you need two terminals.

Terminal 1 starts the Python AI service on port 8000:

```bash
cd ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Terminal 2 starts the Next.js frontend on port 3000:

```bash
npm install
npm run dev
```

## Configuration

Veldt supports three LLM providers: Anthropic (Claude Sonnet), OpenAI (GPT-4o-mini), and DeepSeek. Select your provider and enter your API key in the browser UI. The key is stored in localStorage only.
