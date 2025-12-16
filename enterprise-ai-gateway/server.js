import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 3001;
const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

// Using memory storage only; no persistent storage of user API keys or uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function validateApiKey(apiKey) {
  const response = await fetch(`${ELEVEN_BASE}/user`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'xi-api-key': apiKey
    }
  });
  return response.ok;
}

async function createAgent(apiKey, agentName) {
  const payload = {
    name: agentName,
    description: 'Auto-created via GitHub Pages onboarding. Update safely in the ElevenLabs dashboard.',
    voice: {
      // Default voice ID commonly available in ElevenLabs. Replace after creation if you prefer a different voice.
      voice_id: 'pNInz6obpgDQGcFmaJgB'
    },
    metadata: {
      created_by: 'kim-ai-voice-demo',
      purpose: 'cv-assistant'
    }
  };

  const response = await fetch(`${ELEVEN_BASE}/convai/agents/create`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Agent creation failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data?.agent_id;
}

async function fetchShareLink(apiKey, agentId) {
  const response = await fetch(`${ELEVEN_BASE}/convai/agents/${agentId}/link`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'xi-api-key': apiKey
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Share link fetch failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data?.link;
}

app.post('/api/elevenlabs/agent-auto', async (req, res) => {
  const { api_key: apiKey, agent_name: agentName } = req.body ?? {};

  if (!apiKey || !agentName) {
    return res.status(400).json({ error: 'api_key and agent_name are required.' });
  }

  try {
    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid ElevenLabs API key. Please double-check and try again.' });
    }

    // The API key is used only for outbound ElevenLabs calls during this request and never persisted.
    const agentId = await createAgent(apiKey, agentName);
    const shareLink = await fetchShareLink(apiKey, agentId);

    return res.json({ agent_id: agentId, share_link: shareLink });
  } catch (error) {
    console.error('Automation error', error);
    return res.status(500).json({ error: error.message || 'Automation failed. Please continue in the ElevenLabs dashboard.' });
  }
});

app.post('/api/whisper-test', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  // Demo-only placeholder: swap in your preferred Whisper/STT service here.
  const summary = `Received ${req.file.originalname || 'audio'} (${req.file.size} bytes). Wire this endpoint to Whisper for transcription.`;
  res.json({ transcript: summary });
});

app.listen(port, () => {
  console.log(`enterprise-ai-gateway running on http://localhost:${port}`);
});
