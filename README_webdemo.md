# Web Demo Guide

This repo publishes a GitHub Pages demo for voice + ServiceNow workflows. Everything runs client-side with a **local backend** (http://127.0.0.1:8000). No secrets are stored on GitHub Pages.

## Run the local backend
1) Clone the repo and start your gateway (example with Python/FastAPI):
```bash
git clone https://github.com/OgeonX-Ai/kim-ai-voice-demo.git
cd kim-ai-voice-demo
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # or your backend deps
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
2) Verify it responds:
- http://127.0.0.1:8000/healthz
- http://127.0.0.1:8000/docs

## Use the GitHub Pages demo
Open the live site and navigate to **Voice → ServiceNow Assistant** (`/webdemo/servicenow.html`). The page checks backend reachability, mock/real ServiceNow mode, and streams live logs over SSE.

## Voice-to-ServiceNow flow
- Click **Call** to start mic capture; chunks stream to `/v1/audio/transcribe-file`.
- Each transcript is sent to `/v1/agent/plan-and-act` (fallback: `/v1/chat`) with `mode=servicenow_demo`.
- The backend returns tool calls + final text; the UI renders an actions timeline.
- Mock ServiceNow is supported; no keys are stored in the browser.

## Example prompts
- "Check INC0012345 status"
- "Add a work note: user confirmed reboot didn't help"
- "Notify resolver and ask for ETA"
- "Schedule a follow-up with resolver tomorrow morning"

## Whisper Playground
The secondary `/webdemo/whisper.html` page is a chunked mic → Whisper upload playground pointed at the same local backend.

## ElevenLabs Agent (optional)
If you want ElevenLabs to handle the conversational TTS:
- Create a time-limited invite link (minimum 10 minutes) in the ElevenLabs dashboard.
- Wire tool endpoints from this backend (see the setup accordion on `/webdemo/servicenow.html`).
- API keys are entered manually in the UI and held only in-memory/session.
