const callStates = {
  idle: "idle",
  requesting: "requesting mic",
  live: "live",
  uploading: "uploading",
  error: "error",
};

let mediaStream = null;
let mediaRecorder = null;
let chunkTimer = null;
let runtimePoll = null;
let healthPoll = null;
let callActive = false;

function timestamp() {
  return new Date().toLocaleTimeString();
}

function updateTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setCallStatus(state, detail = "") {
  const pill = document.getElementById("call-status");
  if (pill) {
    pill.textContent = state;
    pill.dataset.state = state;
  }
  const hint = document.getElementById("call-hint");
  if (hint) {
    hint.textContent = detail;
  }
}

function setTranscriptState(state) {
  updateTextContent("transcript-state", state);
}

function addLog(message) {
  const logContainer = document.getElementById("call-logs");
  if (!logContainer) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = `[${timestamp()}] ${message}`;
  logContainer.prepend(entry);
}
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("demo-form");
  const textField = document.getElementById("demo-text");
  const audioPlayer = document.getElementById("audio-player");
  const agentAutoForm = document.getElementById("agent-auto-form");
  const agentAutoStatus = document.getElementById("agent-auto-status");
  const agentAutoResult = document.getElementById("agent-auto-result");
  const whisperForm = document.getElementById("whisper-form");
  const whisperStatus = document.getElementById("whisper-status");

function appendTranscript(text) {
  const transcript = document.getElementById("call-transcript");
  if (!transcript) return;
  const line = document.createElement("p");
  line.innerHTML = `<span class="ts">${timestamp()}</span> ${text}`;
  transcript.appendChild(line);
}

function getBackendUrl() {
  const input = document.getElementById("backend-url");
  const value = input?.value?.trim();
  return value || "http://127.0.0.1:8000";
}

function getSettings() {
  return {
    model: document.getElementById("whisper-model")?.value || "tiny",
    language: document.getElementById("whisper-language")?.value || "auto",
    beam_width: Number(document.getElementById("beam-width")?.value || 3),
    chunk_seconds: Number(document.getElementById("chunk-seconds")?.value || 3),
    vad: Boolean(document.getElementById("vad-toggle")?.checked),
  };
}

function updateBackendLabel() {
  const backendUrl = getBackendUrl();
  updateTextContent("backend-url-label", backendUrl);
  updateTextContent("runtime-url", `Backend: ${backendUrl}`);
}

async function checkBackendHealth() {
  const backendUrl = getBackendUrl();
  const banner = document.getElementById("backend-banner");
  const backendStatus = document.getElementById("backend-status");
  const callBtn = document.getElementById("call-btn");

  updateBackendLabel();

  const targets = ["/healthz", "/api/health", "/health"];
  let healthy = false;
  for (const path of targets) {
    try {
      const res = await fetch(`${backendUrl}${path}`);
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch (err) {
      // continue trying other endpoints
    }
  }

  if (backendStatus) {
    backendStatus.textContent = healthy ? "backend ok" : "backend down";
    backendStatus.dataset.state = healthy ? "ok" : "down";
  }
  if (banner) banner.hidden = healthy;
  if (callBtn) callBtn.disabled = !healthy;
  return healthy;
}

async function fetchRuntime() {
  const backendUrl = getBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/v1/runtime`);
    if (!res.ok) {
      const statusText = res.status === 404 ? "Endpoint missing" : `Status ${res.status}`;
      updateTextContent("runtime-status", `Status: ${statusText}`);
      updateTextContent("runtime-error", `Last error: ${statusText}`);
      return;
    }
    const data = await res.json();
    updateTextContent("runtime-provider", `Provider: ${data?.provider || "-"}`);
    updateTextContent("runtime-model", `Model: ${data?.model || "-"}`);
    updateTextContent("runtime-hardware", `Hardware: ${data?.hardware || data?.device || "-"}`);
    updateTextContent("runtime-status", `Status: ${data?.status || "ok"}`);
    updateTextContent("runtime-requests", `Total requests: ${data?.total_requests ?? data?.requests ?? "-"}`);
    updateTextContent("runtime-p50", `p50 latency: ${data?.p50_ms ?? data?.p50 ?? "-"} ms`);
    updateTextContent("runtime-p95", `p95 latency: ${data?.p95_ms ?? data?.p95 ?? "-"} ms`);
    updateTextContent("runtime-error", `Last error: ${data?.last_error || "None"}`);
  } catch (err) {
    updateTextContent("runtime-status", "Status: Down");
    updateTextContent("runtime-error", "Last error: Cannot reach backend");
  }
}

function startRuntimePoll() {
  if (runtimePoll) clearInterval(runtimePoll);
  runtimePoll = setInterval(fetchRuntime, 2000);
}

function stopRuntimePoll() {
  if (runtimePoll) clearInterval(runtimePoll);
  runtimePoll = null;
}

function startHealthPoll() {
  if (healthPoll) clearInterval(healthPoll);
  healthPoll = setInterval(checkBackendHealth, 30000);
}

function stopHealthPoll() {
  if (healthPoll) clearInterval(healthPoll);
  healthPoll = null;
}

function resetTranscript() {
  const transcript = document.getElementById("call-transcript");
  if (transcript) transcript.innerHTML = "";
  setTranscriptState("waiting");
}

function resetLogs() {
  const logs = document.getElementById("call-logs");
  if (logs) logs.innerHTML = "";
}

async function uploadChunk(blob) {
  const backendUrl = getBackendUrl();
  const settings = getSettings();
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");
  formData.append("settings", JSON.stringify(settings));

  setCallStatus(callStates.uploading, "Uploading chunk...");
  setTranscriptState("thinking...");

  try {
    const res = await fetch(`${backendUrl}/v1/audio/transcribe-file`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let msg = "Upload failed.";
      if (res.status === 404) msg = "Backend missing /v1/audio/transcribe-file. Update backend.";
      else if (res.status === 415) msg = "Unsupported audio format. Try WAV.";
      else if (res.type === "opaque") msg = "Enable CORS in backend.";
      else if (res.status === 0) msg = "Start backend locally.";
      setCallStatus(callStates.error, msg);
      addLog(msg);
      return;
    }

    const text = data?.text || data?.transcript || data?.result || "(no transcript returned)";
    appendTranscript(text);
    const timing = data?.timings || data?.latency_ms;
    addLog(`Transcribed chunk${timing ? ` in ${JSON.stringify(timing)}` : ""}`);
    setCallStatus(callStates.live, "Live — next chunk recording");
    setTranscriptState("received");
  } catch (err) {
    const msg = err?.message?.includes("CORS") ? "Enable CORS in backend." : "Network error. Start backend locally.";
    setCallStatus(callStates.error, msg);
    addLog(msg);
  }
}

function stopRecording(finalStop = false) {
  if (chunkTimer) clearInterval(chunkTimer);
  chunkTimer = null;
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.ondataavailable = null;
    mediaRecorder.stop();
  }
  mediaRecorder = null;
  if (finalStop && mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

function startRecorder() {
  const settings = getSettings();
  if (!mediaStream) return;
  const chunkMs = Math.max(1, settings.chunk_seconds) * 1000;
  mediaRecorder = new MediaRecorder(mediaStream);
  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0 && callActive) {
      await uploadChunk(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    if (callActive) {
      setTimeout(() => startRecorder(), 50);
    }
  };
  mediaRecorder.start();
  if (chunkTimer) clearInterval(chunkTimer);
  chunkTimer = setInterval(() => {
    if (callActive && mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }, chunkMs);
  setCallStatus(callStates.live, "Live — recording chunks");
}

async function startCall() {
  const callBtn = document.getElementById("call-btn");
  const endBtn = document.getElementById("end-call-btn");
  if (callBtn) callBtn.disabled = true;
  if (endBtn) endBtn.disabled = false;
  resetTranscript();
  addLog("Requesting microphone...");
  setCallStatus(callStates.requesting, "Requesting mic permission...");

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    callActive = true;
    setCallStatus(callStates.live, "Mic granted. Recording...");
    startRecorder();
    startRuntimePoll();
  } catch (err) {
    callActive = false;
    setCallStatus(callStates.error, "Mic permission denied or unavailable.");
    addLog("Mic permission denied or unavailable.");
    if (endBtn) endBtn.disabled = true;
    if (callBtn) callBtn.disabled = false;
  }
}

function endCall() {
  callActive = false;
  stopRecording(true);
  stopRuntimePoll();
  const callBtn = document.getElementById("call-btn");
  const endBtn = document.getElementById("end-call-btn");
  if (callBtn) callBtn.disabled = false;
  if (endBtn) endBtn.disabled = true;
  setCallStatus(callStates.idle, "Call ended. Press Call to start again.");
  addLog("Call ended and mic released.");
}

function attachEventHandlers() {
  const form = document.getElementById("demo-form");
  const textField = document.getElementById("demo-text");
  if (form && textField) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textField.value.trim();
      if (!text) {
        alert("Please type something to demo.");
        return;
      }
      alert("Demo: Text received.\nBackend integration coming soon!");
    });
  }

  const agentAutoForm = document.getElementById("agent-auto-form");
  const agentAutoStatus = document.getElementById("agent-auto-status");
  const agentAutoResult = document.getElementById("agent-auto-result");
  if (agentAutoForm && agentAutoStatus && agentAutoResult) {
    agentAutoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      agentAutoStatus.textContent = "Creating agent and fetching invite link...";
      agentAutoResult.hidden = true;
      agentAutoResult.textContent = "";

      const apiKey = document.getElementById("api-key")?.value?.trim();
      const agentName = document.getElementById("agent-name")?.value?.trim();

      if (!apiKey || !agentName) {
        agentAutoStatus.textContent = "Please provide both an API key and an agent name.";
        return;
      }

      try {
        const response = await fetch("/api/elevenlabs/agent-auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, agent_name: agentName }),
        });

        const data = await response.json();
        if (!response.ok) {
          agentAutoStatus.textContent = data?.error || "Automation failed. Please try manual setup.";
          return;
        }

        agentAutoStatus.textContent = "Success! Invite link ready.";
        agentAutoResult.innerHTML = `
          <p><strong>Agent ID:</strong> ${data.agent_id}</p>
          <p><strong>Share link:</strong> <a href="${data.share_link}" target="_blank" rel="noopener noreferrer">${data.share_link}</a></p>
          <p class="note">Time-limited invite link (minimum 10 minutes). Update or revoke in ElevenLabs anytime.</p>
        `;
        agentAutoResult.hidden = false;
      } catch (error) {
        agentAutoStatus.textContent = "Request failed. Check your backend URL or try manual setup.";
      }
    });
  }

  const whisperForm = document.getElementById("whisper-form");
  const whisperStatus = document.getElementById("whisper-status");
  if (whisperForm && whisperStatus) {
    whisperForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      whisperStatus.textContent = "Uploading audio...";

      const fileInput = document.getElementById("whisper-audio");
      const file = fileInput?.files?.[0];
      if (!file) {
        whisperStatus.textContent = "Please choose an audio file.";
        return;
      }

      const formData = new FormData();
      formData.append("audio", file);

      try {
        const response = await fetch("/api/whisper-test", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          whisperStatus.textContent = data?.error || "Transcription failed.";
          return;
        }
        whisperStatus.textContent = data?.transcript || "Received.";
      } catch (error) {
        whisperStatus.textContent = "Upload failed. Is the backend running?";
      }
    });
  }

  const backendInput = document.getElementById("backend-url");
  if (backendInput) {
    backendInput.addEventListener("change", checkBackendHealth);
    backendInput.addEventListener("blur", checkBackendHealth);
  }

  const callBtn = document.getElementById("call-btn");
  const endBtn = document.getElementById("end-call-btn");
  if (callBtn) {
    callBtn.addEventListener("click", async () => {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        setCallStatus(callStates.error, "Backend unavailable. Start it first.");
        return;
      }
      startCall();
    });
  }
  if (endBtn) {
    endBtn.addEventListener("click", endCall);
  }

  const clearLogsBtn = document.getElementById("clear-logs");
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener("click", resetLogs);
  }
}

function initWhisperSection() {
  checkBackendHealth();
  fetchRuntime();
  startHealthPoll();
}

function init() {
  attachEventHandlers();
  initWhisperSection();
}

document.addEventListener("DOMContentLoaded", init);
