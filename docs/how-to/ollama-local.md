# Ollama (Local Model – Recommended Default)

Ollama is the **default and easiest setup** in this app.

No API key is required.  
No cloud account is required.

The app automatically handles the setup for you.

---

## How this works (important)

When you select **Ollama**:

- The app **automatically downloads a small local language model**
- The model runs **locally for you**
- Your conversations **do not go to the cloud**
- No API keys are needed

This makes Ollama the **best choice for privacy, offline use, and quick testing**.

---

## Where does the model run?

### Current implementation (realistic & honest)

- On **Android**, the app runs a **local lightweight inference runtime**
- Models are optimized for **mobile use**
- Performance depends on your phone (CPU / RAM)

You do **not** need a laptop or server for the basic setup.

---

## What happens automatically

The app will:
1. Download a default model on first use
2. Store it securely on the device
3. Start the local inference service
4. Use it immediately for chat

You only need to tap:
> **Settings → AI Provider → Ollama**

---

## Recommended default model

The app uses a **small, mobile-friendly model** by default:
- Fast
- Low memory usage
- Good conversational quality

Advanced users can change the model later.

---

## Expected behavior

- First run may take a few minutes (model download)
- Responses may be slower than cloud models
- Quality depends on your device
- Works without internet after download

This is normal and expected.

---

## Advanced setup (optional)

If you want **more powerful models**, you can connect the app to an external Ollama instance:

- Ollama running on your computer
- Same Wi-Fi network

In that case:
- Provider: Ollama
- Base URL: `http://YOUR_COMPUTER_IP:11434`
- Model: any model you have pulled

This is **optional** and meant for power users.

---

## Privacy & security

- Conversations stay on your device by default
- No data is sent to external servers
- You stay in full control

---

## When should I NOT use Ollama?

If you want:
- The absolute best model quality
- Very fast responses
- Large context windows

Then consider:
- OpenAI
- Anthropic
- Gemini

You can switch providers at any time.

---

## Summary

✔ No API key  
✔ Local by default  
✔ Privacy-friendly  
✔ Works offline  
✔ Recommended for first-time users