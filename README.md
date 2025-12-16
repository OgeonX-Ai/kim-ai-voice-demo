# 🔊 Real-Time AI Voice Demo (Web + Mobile)

A clean demonstration of real-time AI voice workflows using ElevenLabs, speech-to-text, text-to-speech, and a lightweight frontend hosted on GitHub Pages. It also shows how to mask affiliate URLs with a GitHub Pages redirect.

---

## 🚀 Live Demo & Links

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open-blue?style=for-the-badge&logo=github)](https://ogeonx-ai.github.io/kim-ai-voice-demo/)
[![Try the Voice Engine](https://img.shields.io/badge/Build_your_AI_CV-Launch-orange?style=for-the-badge&logo=ai)](https://ogeonx-ai.github.io/kim-ai-voice-demo/elevenlabs)

*Disclosure: The ElevenLabs link redirects via my tracking page (affiliate). No extra cost.*

---

## 🧰 Tech Stack

![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![DevOps](https://img.shields.io/badge/DevOps-Automation-blueviolet?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice_AI-orange?style=for-the-badge)
![Azure DevOps](https://img.shields.io/badge/Azure%20DevOps-%230078D4.svg?style=flat-square&logo=azuredevops&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-%232671E5.svg?style=flat-square&logo=githubactions&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-%2334D058.svg?style=flat-square&logo=terraform&logoColor=white)
![Bicep](https://img.shields.io/badge/Bicep-%2317A8E3.svg?style=flat-square&logo=azure&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-%23326CE5.svg?style=flat-square&logo=kubernetes&logoColor=white)
![Mermaid](https://img.shields.io/badge/Mermaid-DM99FF?style=flat-square&logo=mermaid&logoColor=white)
![Security](https://img.shields.io/badge/Security-ISO27000-compliant-blue?style=flat-square)


---

## ✨ Features

- Real-time TTS (text-to-speech)
- Custom system messages / personas
- Multiple voice + language options
- Clean UI hosted on GitHub Pages
- Easy backend integration (Node/Python)
- Masked affiliate redirect
- Developer-friendly structure and demo flow
- Whisper Playground (mic capture → multipart upload to `/v1/audio/transcribe-file`)
- Auto-published Dev Updates blog from merged PRs

---

## 🏁 Quick start: build your interactive AI CV

Live page with the full guide: https://ogeonx-ai.github.io/kim-ai-voice-demo/

1) **Open ElevenLabs** — Use the GitHub Pages CTA redirect: [`/elevenlabs`](https://ogeonx-ai.github.io/kim-ai-voice-demo/elevenlabs).
2) **Create an Agent** — Agents → New agent, choose voice + language.
3) **Upload the Knowledge Base** — Add Markdown files from [`/kb-templates/`](kb-templates/): `cv.md`, `projects.md`, `skills.md`, `glossary.md`, `tone.md`.
4) **System prompt** — Ground answers in the KB only; if something isn’t in the KB, say so; keep sentences short and friendly.
5) **Evaluation criteria** — Grounding to CV, answer relevance, clarity of technical explanations, accurate seniority, user satisfaction.
6) **Invite link (10-minute minimum)** — In your agent: Security / Share → create a time-limited invite link (minimum 10 minutes) and share it via DM/email/featured link.
7) **Share** — Post the project with your invite link or GitHub Pages redirect.

---

## 🧠 Partial automation backend

`enterprise-ai-gateway` adds an optional API to create an ElevenLabs agent and return a time-limited invite link.

- **Endpoint:** `POST /api/elevenlabs/agent-auto`
  - Body: `{ "api_key": "<your_key>", "agent_name": "My CV Agent" }`
  - Validates the key, calls `convai/agents/create`, then fetches the agent share link.
  - Returns: `{ agent_id, share_link }`
- **Security:** API keys are only used in-memory per request. They are **not** stored. If you need persistent storage, use a vault such as Azure Key Vault.
- **Whisper test:** `POST /api/whisper-test` accepts an audio file and returns a stub transcript (swap in your STT provider).

## 🎙 Whisper Playground

- Page: [`/webdemo/whisper.html`](webdemo/whisper.html)
- What it does: records microphone audio via MediaRecorder, then uploads a single `multipart/form-data` request with the blob as `audio.wav` plus JSON `settings`.
- Default backend target: `http://127.0.0.1:8000/v1/audio/transcribe-file` (edit the input to match your host).
- Controls include model (tiny/small/medium), language (fi/en/auto), beam size, VAD toggle, and chunk seconds slider.
- Panels show logs, live status, transcription text, and any timing metrics returned by the backend.

### Run locally

```bash
cd enterprise-ai-gateway
npm install
npm start
```

The server listens on port `3001` by default. Point the frontend calls at your running backend (e.g., proxy `/api` locally).

---

## 📂 Project Structure

~~~text
kim-ai-voice-demo/
│── index.html         # Main landing page + demo UI
│── style.css          # Styling
│── script.js          # Frontend logic
│
│── elevenlabs/
│     └── index.html   # Affiliate redirect
│
│── kb-templates/      # Markdown templates for your agent KB
│     ├── cv.md
│     ├── projects.md
│     ├── skills.md
│     ├── glossary.md
│     └── tone.md
│
│── webdemo/
│     ├── index.html      # Auxiliary voice companion demo
│     └── whisper.html    # Whisper Playground (mic capture + upload)
│     └── updates/        # Auto-generated Dev Updates posts + index
│
├── scripts/
│     └── generate-dev-update.mjs # Script run by GitHub Actions to publish PR summaries
│
├── .github/workflows/
│     └── publish-dev-updates.yml # Automates Dev Updates on merged PRs to main
│
├── enterprise-ai-gateway/  # Optional backend for automation + Whisper test
│     ├── package.json
│     └── server.js
└── assets/            # (optional) images, screenshots
~~~

---

## 📌 Coming Soon

- Secure backend examples (Node.js + Python)
- Android app source code (real-time TTS + STT)
- Azure Functions deployment template
- Voice agent architecture diagrams
- Live streaming + WebSocket integration

---

## 📚 How It Works

1. **Frontend (GitHub Pages)**  
   Text, language, persona → forms → backend API.

2. **Backend (Node/Python — coming soon)**  
   Handles ElevenLabs requests using environment-stored secrets.

3. **Audio Response**  
   Returns audio files or streams back to browser/mobile app.

---

## 👤 About Me

Hi, I'm **Kim** — Azure Architect, DevOps Engineer, and AI Voice Developer.  
I design automation-heavy cloud architectures and build cutting-edge real-time voice experiences using ElevenLabs and other AI tools.

If you're exploring Azure, DevOps, hybrid cloud, or AI voice technology, feel free to connect.

🔗 **LinkedIn:**  
https://linkedin.com/in/kimharjamaki  

🔗 **Live Demo:**
https://ogeonx-ai.github.io/kim-ai-voice-demo/

🔥 **Try the same voice engine I use:**
https://ogeonx-ai.github.io/kim-ai-voice-demo/elevenlabs

*Disclosure: The ElevenLabs link redirects via my tracking page (affiliate). No extra cost.*

---
