# 🧠 AI Companion – Personal, Voice-First AI Assistant

A privacy-first AI companion with voice, presence, and customizable personalities.

This project demonstrates how to build a modern AI assistant across Android, web, and backend services, supporting:

- Bring-Your-Own-LLM (BYOK)
- Local and cloud models
- Custom characters
- Voice interaction
- A talking 3D avatar (Android + Web)

The entire project is built openly and publicly to document real-world AI system design.

---

## 🌐 Live Web Demo

A public demo with a talking 3D character and voice presence:

👉 https://USERNAME.github.io/REPO/

- No account required
- Runs fully in the browser
- Shows voice + avatar lip-sync
- Uses a local demo audio (no API keys)

---

## 🎯 Core Features

### 🤖 AI & LLM
- Multiple LLM providers (BYOK):
  - OpenAI
  - Azure OpenAI
  - Anthropic (Claude)
  - Google Gemini
  - Mistral
  - Groq
- Local models (Ollama, LM Studio)
- Provider & model switching per character

### 🎭 Characters
- Create multiple AI characters
- Each character has:
  - Personality (system prompt)
  - Preferred provider & model
  - Voice configuration
  - Optional access to personal knowledge

### 🗣️ Voice & Presence
- High-quality TTS via ElevenLabs
- Real-time voice conversations
- Talking 3D avatar with lip-sync
- Planned phone call features (wake-up calls, reminders)

### 📚 Personal Knowledge Base
- Upload documents
- Per-user isolation
- Optional per-character access
- Designed for RAG (Retrieval Augmented Generation)

### 🔐 Privacy-First Design
- Users bring their own API keys
- Keys stored securely on device
- Local-first options available
- No vendor lock-in

---

## 🧱 Architecture Overview

Android App
- UI (Jetpack Compose)
- Character & Provider management
- Secure API key storage
- Voice & avatar rendering

Backend (local or Azure)
- LLM orchestration (BYOK)
- Knowledge base (RAG)
- Voice services
- Scheduling (future phone calls)

Web Demo (GitHub Pages)
- Three.js
- GLB avatar with blendshapes
- Audio-driven lip-sync
- Public showcase

---

## 📁 Repository Structure

.
├── README.md
├── docs/
│   └── how-to/          # API key & provider guides
├── web-demo/            # GitHub Pages demo
│   ├── index.html
│   ├── main.js
│   ├── avatar.glb
│   └── demo-voice.mp3
├── android/             # Android application
└── backend/             # Backend services (FastAPI / Node)

---

## 🔑 API Key & Provider Setup

Step-by-step setup guides for all supported providers:

👉 docs/how-to/README.md

Includes:
- Cloud LLMs
- Local LLMs
- Voice services
- Security notes

---

## 🗣️ Voice Provider (ElevenLabs)

This project uses ElevenLabs for high-quality voice output.

Quick start link used in demos:

👉 https://ogeonx-ai.github.io/kim-ai-voice-demo/elevenlabs

This is an affiliate link.  
Using it supports the development of this open-source project at no extra cost.

Full setup guide:
- docs/how-to/elevenlabs.md

---

## 🚀 Current Status

- Android app skeleton
- Provider abstraction
- Character system
- Web demo with talking avatar
- Local & cloud LLM support
- Voice calls & alarms (in progress)
- Full RAG pipeline (in progress)

---

## 💡 Why this project exists

Most AI assistants today are:
- Locked to one provider
- Cloud-only
- Hard to customize
- Opaque in how they work

This project explores an alternative:

A personal, transparent, voice-first AI companion that users fully control.

---

## 📄 License

This project is published openly for learning, experimentation, and demonstration purposes.

---

## 🙌 Contributing / Feedback

Ideas, discussions, and feedback are welcome.

If you’re interested in:
- Android development
- AI systems
- Voice interfaces
- Privacy-first design

Feel free to explore the code and documentation.

---

## ✨ Author

Built openly to demonstrate real-world AI system design across platforms.

---

### 🔧 Replace before pushing
- USERNAME → your GitHub username
- REPO → repository name