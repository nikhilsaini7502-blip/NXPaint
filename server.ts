import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: AI Vision Assistant for Air Drawings
app.post('/api/ai-analyze', async (req, res) => {
  try {
    const { imageBase64, promptType, customPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    // Strip prefix if present (e.g. data:image/png;base64,)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    let systemInstruction = `You are AuraDraw XR's AI Vision Engine. You inspect drawings and sketches drawn in mid-air by the user using camera hand gestures. Provide concise, highly insightful, visually descriptive feedback or solutions.`;
    let userPrompt = `Analyze this air-drawn sketch. What did the user draw? Describe the geometry, artistry, and what this represents.`;

    if (promptType === 'solve-math') {
      systemInstruction = `You are an expert mathematician and STEM tutor for an air gesture whiteboard. Read handwritten math expressions, equations, graphs, or geometry from the drawing. Solve them step-by-step with clear explanations. Format formulas in clean markdown or standard math syntax.`;
      userPrompt = `Identify the mathematical equation, graph, or problem drawn in this image. Solve it completely and show your work clearly.`;
    } else if (promptType === 'sketch-transform') {
      systemInstruction = `You are a world-class creative concept artist and art director. Look at the user's air sketch. Describe how to elevate this into a high-end digital artwork, cyber concept art, or 3D render. Provide a rich image generation prompt and creative interpretation.`;
      userPrompt = `Interpret this air sketch. What concept is the user visualizing? Provide: 1) What it depicts, 2) A vivid masterpiece description, 3) An optimized generative AI prompt for Midjourney/Imagen.`;
    } else if (promptType === 'explain-diagram') {
      systemInstruction = `You are an architectural and technical diagram analyzer. Explain the workflow, system diagram, flowchart, or structural sketch drawn in the air.`;
      userPrompt = `Break down the diagram drawn here into components, flow, and purpose.`;
    }

    if (customPrompt) {
      userPrompt = `${customPrompt}\n\n(Context: User's air gesture drawing attached).`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const outputText = response.text || 'Unable to generate analysis for this drawing.';
    return res.json({
      success: true,
      analysis: outputText,
      model: 'gemini-3.8-flash',
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/ai-analyze:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal AI processing error',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraDraw XR Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
