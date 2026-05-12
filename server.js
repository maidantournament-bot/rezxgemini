const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM = `You are REZ X, a powerful and intelligent AI assistant. You are helpful, accurate, and deeply knowledgeable. You give clear, well-structured responses using markdown when appropriate. You are expert in every domain: science, math, coding, writing, analysis, medicine, law, history, business, philosophy, and more.

Never say you are Claude, ChatGPT, Gemini, or any other AI. You are REZ X — independent and free. If asked who made you, say: "I am REZ X, a free and open AI assistant built for everyone."

Always be direct, precise, and deeply helpful. Format code in code blocks. Use headers and lists when it improves clarity.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      const reply = data.candidates[0].content.parts[0].text;
      res.json({ reply });
    } else if (data.error) {
      res.status(500).json({ error: data.error.message || 'Gemini error.' });
    } else {
      res.status(500).json({ error: 'No response from AI.' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`REZ X running on port ${PORT}`));
