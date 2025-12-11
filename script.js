document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("demo-form");
  const textField = document.getElementById("demo-text");
  const audioPlayer = document.getElementById("audio-player");

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
});
