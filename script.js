document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("demo-form");
  const textField = document.getElementById("demo-text");
  const audioPlayer = document.getElementById("audio-player");
  const agentAutoForm = document.getElementById("agent-auto-form");
  const agentAutoStatus = document.getElementById("agent-auto-status");
  const agentAutoResult = document.getElementById("agent-auto-result");
  const whisperForm = document.getElementById("whisper-form");
  const whisperStatus = document.getElementById("whisper-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textField.value.trim();
    if (!text) {
      alert("Please type something to demo.");
      return;
    }

    // This demo mode does not make real API calls yet.
    // It just shows a placeholder message.
    alert("Demo: Text received.\nBackend integration coming soon!");
  });

  if (agentAutoForm) {
    agentAutoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      agentAutoStatus.textContent = "Creating agent and fetching invite link...";
      agentAutoResult.hidden = true;
      agentAutoResult.textContent = "";

      const apiKey = document.getElementById("api-key").value.trim();
      const agentName = document.getElementById("agent-name").value.trim();

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

  if (whisperForm) {
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
});
