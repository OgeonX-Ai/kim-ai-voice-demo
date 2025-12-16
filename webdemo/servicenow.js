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
let callActive = false;
let runtimePoll = null;
let logsSource = null;
let sessionId = crypto.randomUUID();

function ts() {
  return new Date().toLocaleTimeString();
}

function byId(id) {
  return document.getElementById(id);
}

function setCallStatus(state, detail = "") {
  const pill = byId("call-status");
  if (pill) {
    pill.textContent = state;
    pill.dataset.state = state;
  }
  const hint = byId("call-hint");
  if (hint) hint.textContent = detail || "";
}

function setTranscriptState(state) {
  const pill = byId("transcript-state");
  if (pill) pill.textContent = state;
}

function log(message) {
  const container = byId("logs");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "log-entry";
  div.textContent = `[${ts()}] ${message}`;
  container.prepend(div);
}

function addTimeline(type, title, detail) {
  const container = byId("timeline");
  if (!container) return;
  const entry = document.createElement("div");
  entry.className = "timeline-entry";
  entry.innerHTML = `<div class="timeline-type">${type}</div><div><strong>${title}</strong><p>${detail || ""}</p></div>`;
  container.prepend(entry);
}

function appendTranscript(text) {
  const container = byId("transcript");
  if (!container) return;
  const line = document.createElement("p");
  line.innerHTML = `<span class="ts">${ts()}</span> ${text}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function getBackendUrl() {
  const value = byId("backend-url")?.value?.trim();
  return value || "http://127.0.0.1:8000";
}

function getSettings() {
  return {
    model: byId("model-select")?.value || "tiny",
    language: byId("language-select")?.value || "auto",
    beam_width: Number(byId("beam-width")?.value || 3),
    chunk_seconds: Number(byId("chunk-seconds")?.value || 3),
    vad: Boolean(byId("vad-toggle")?.checked),
  };
}

function updateBaseUrlLabel() {
  const url = getBackendUrl();
  const baseLabels = document.querySelectorAll("#backend-url-label, #base-url-label");
  baseLabels.forEach((el) => (el.textContent = url));
}

async function checkCapabilities() {
  const backendUrl = getBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/v1/tools/servicenow/capabilities`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const mock = data?.mock ?? data?.mode === "mock";
    const mockText = mock ? "Mock mode" : "Real mode";
    const pill = byId("mock-mode-pill");
    if (pill) pill.textContent = `Mode: ${mockText}`;
    const label = byId("mock-mode");
    if (label) label.textContent = mock ? "Mock mode" : "Real / live";
  } catch (err) {
    const pill = byId("mock-mode-pill");
    if (pill) pill.textContent = "Mode: unknown";
    const label = byId("mock-mode");
    if (label) label.textContent = "Unknown (capabilities endpoint not reachable)";
  }
}

async function checkBackend() {
  const backendUrl = getBackendUrl();
  updateBaseUrlLabel();
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
      // continue
    }
  }
  const backendStatus = byId("backend-status");
  const backendPill = byId("backend-pill");
  const callBtn = byId("call-btn");
  const lastError = byId("last-error");
  if (backendStatus) backendStatus.textContent = healthy ? "Backend OK" : "Backend down";
  if (backendPill) {
    backendPill.textContent = healthy ? "backend ok" : "backend down";
    backendPill.dataset.state = healthy ? "ok" : "down";
  }
  if (callBtn) callBtn.disabled = !healthy;
  if (!healthy && lastError) lastError.textContent = "Last error: backend not reachable";
  return healthy;
}

async function fetchRuntime() {
  const backendUrl = getBackendUrl();
  try {
    const res = await fetch(`${backendUrl}/v1/runtime`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    byId("runtime-provider").textContent = `Provider: ${data?.provider || "-"}`;
    byId("runtime-model").textContent = `Model: ${data?.model || "-"}`;
    byId("runtime-hardware").textContent = `Hardware: ${data?.hardware || "-"}`;
    byId("runtime-status").textContent = `Status: ${data?.status || "ok"}`;
    byId("runtime-requests").textContent = `Total requests: ${data?.total_requests ?? "-"}`;
    byId("runtime-p50").textContent = `p50 latency: ${data?.latency_p50_ms ?? "-"} ms`;
    byId("runtime-p95").textContent = `p95 latency: ${data?.latency_p95_ms ?? "-"} ms`;
    byId("runtime-error").textContent = `Last error: ${data?.last_error ?? "-"}`;
  } catch (err) {
    byId("runtime-status").textContent = `Status: error`;
    byId("runtime-error").textContent = `Last error: ${err.message}`;
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

function startLogs() {
  const backendUrl = getBackendUrl();
  if (logsSource) logsSource.close();
  try {
    logsSource = new EventSource(`${backendUrl}/v1/logs/stream`);
    logsSource.onmessage = (event) => log(event.data || "(log)");
    logsSource.onerror = () => log("Log stream disconnected. Check backend.");
  } catch (err) {
    log("SSE not supported or endpoint missing.");
  }
}

function stopLogs() {
  if (logsSource) logsSource.close();
  logsSource = null;
}

function clearLogs() {
  const logs = byId("logs");
  if (logs) logs.innerHTML = "";
}

function clearTimeline() {
  const tl = byId("timeline");
  if (tl) tl.innerHTML = "";
}

async function sendIntent(text) {
  const backendUrl = getBackendUrl();
  const payload = { input_text: text, session_id: sessionId, mode: "servicenow_demo" };
  const endpoints = ["/v1/agent/plan-and-act", "/v1/chat"];
  for (const path of endpoints) {
    try {
      const res = await fetch(`${backendUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Status ${res.status}`);
      const finalText = data.final_text || data.response || data.text || "(no response)";
      const toolCalls = data.tool_calls || [];
      if (toolCalls.length) {
        toolCalls.forEach((call) => {
          addTimeline(
            "tool",
            call.name || "tool call",
            `<pre>${JSON.stringify(call.request || {}, null, 2)}</pre><pre>${JSON.stringify(call.response || {}, null, 2)}</pre>`
          );
        });
      }
      addTimeline("agent", "Final response", finalText);
      appendTranscript(`Agent: ${finalText}`);
      return;
    } catch (err) {
      log(`Intent route ${path} failed: ${err.message}`);
    }
  }
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
      else msg = "Network error. Start backend locally.";
      setCallStatus(callStates.error, msg);
      log(msg);
      return;
    }
    const text = data.text || data.transcript || data.result || "(no transcript returned)";
    appendTranscript(text);
    addTimeline("transcript", "Heard", text);
    setCallStatus(callStates.live, "Live — next chunk");
    setTranscriptState("received");
    await sendIntent(text);
  } catch (err) {
    const msg = err?.message?.includes("CORS") ? "Enable CORS in backend." : "Network error. Start backend locally.";
    setCallStatus(callStates.error, msg);
    log(msg);
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
  if (!mediaStream) return;
  const chunkMs = Math.max(1, getSettings().chunk_seconds) * 1000;
  mediaRecorder = new MediaRecorder(mediaStream);
  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0 && callActive) {
      await uploadChunk(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    if (callActive) setTimeout(() => startRecorder(), 50);
  };
  mediaRecorder.start();
  if (chunkTimer) clearInterval(chunkTimer);
  chunkTimer = setInterval(() => {
    if (callActive && mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }, chunkMs);
  setCallStatus(callStates.live, "Live — recording");
}

async function startCall() {
  const callBtn = byId("call-btn");
  const endBtn = byId("end-btn");
  if (callBtn) callBtn.disabled = true;
  if (endBtn) endBtn.disabled = false;
  setCallStatus(callStates.requesting, "Requesting mic permission...");
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    callActive = true;
    setCallStatus(callStates.live, "Mic granted. Recording...");
    startRecorder();
    startRuntimePoll();
    startLogs();
  } catch (err) {
    callActive = false;
    setCallStatus(callStates.error, "Mic permission denied or unavailable.");
    log("Mic permission denied or unavailable.");
    if (endBtn) endBtn.disabled = true;
    if (callBtn) callBtn.disabled = false;
  }
}

function endCall() {
  callActive = false;
  stopRecording(true);
  stopRuntimePoll();
  stopLogs();
  const callBtn = byId("call-btn");
  const endBtn = byId("end-btn");
  if (callBtn) callBtn.disabled = false;
  if (endBtn) endBtn.disabled = true;
  setCallStatus(callStates.idle, "Call ended. Press Call to start again.");
  log("Call ended and mic released.");
}

function attachHandlers() {
  byId("call-btn")?.addEventListener("click", async () => {
    const healthy = await checkBackend();
    if (!healthy) {
      setCallStatus(callStates.error, "Backend unavailable. Start it first.");
      return;
    }
    checkCapabilities();
    startCall();
  });
  byId("end-btn")?.addEventListener("click", endCall);
  byId("clear-logs")?.addEventListener("click", clearLogs);
  byId("clear-timeline")?.addEventListener("click", clearTimeline);
  const backendInput = byId("backend-url");
  if (backendInput) {
    backendInput.addEventListener("change", () => {
      checkBackend();
      checkCapabilities();
      fetchRuntime();
      updateBaseUrlLabel();
    });
  }
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.copy;
      navigator.clipboard.writeText(value).then(() => {
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      });
    });
  });
}

async function init() {
  attachHandlers();
  updateBaseUrlLabel();
  const healthy = await checkBackend();
  if (healthy) {
    checkCapabilities();
    fetchRuntime();
    startLogs();
  } else {
    setCallStatus(callStates.error, "Backend not running. Call disabled.");
  }
}

document.addEventListener("DOMContentLoaded", init);
