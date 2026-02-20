import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =============================================================================
// FREE AI ENGINES SUPPORTED
// =============================================================================
//
// 1. Groq API (FREE TIER) — https://console.groq.com
//    Models: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
//    Free: 30 req/min, 14,400 req/day, 500K tokens/day
//    Env: GROQ_API_KEY=gsk_...
//
// 2. Google Gemini (FREE TIER) — https://aistudio.google.com
//    Models: gemini-1.5-flash (free), gemini-1.5-pro (free limited)
//    Free: 15 RPM, 1M tokens/day for Flash
//    Env: GEMINI_API_KEY=AIza...
//
// 3. HuggingFace Inference API (FREE TIER) — https://huggingface.co/settings/tokens
//    Models: mistralai/Mistral-7B-Instruct, meta-llama/Llama-2-7b-chat-hf
//    Free: limited rate, no billing needed for public models
//    Env: HUGGINGFACE_API_KEY=hf_...
//
// 4. OpenRouter (FREE MODELS) — https://openrouter.ai
//    Free models: google/gemma-2-9b-it:free, meta-llama/llama-3.1-8b-instruct:free
//    Env: OPENROUTER_API_KEY=sk-or-...
//
// 5. Ollama (LOCAL, 100% FREE) — https://ollama.ai
//    Run any LLM locally: llama3, mistral, gemma, phi3, etc.
//    No API key, completely offline
//    Env: OLLAMA_BASE_URL=http://localhost:11434 (default)
//         OLLAMA_MODEL=llama3 (default)
//
// =============================================================================

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const HUGGINGFACE_BASE = 'https://api-inference.huggingface.co/models';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getOllamaBase() {
  return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
}

// ===== AI PROVIDER CALLERS =====

async function callGroq(messages, model) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: model || 'llama-3.1-8b-instant', messages, max_tokens: 512, temperature: 0.7 }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(messages, model) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  const m = model || 'gemini-1.5-flash';
  const contents = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
  const systemMsg = messages.find(msg => msg.role === 'system');
  const body = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  body.generationConfig = { maxOutputTokens: 512, temperature: 0.7 };
  const res = await fetch(`${GEMINI_BASE}/models/${m}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Gemini error ${res.status}: ${t.slice(0, 200)}`); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callHuggingFace(messages, model) {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) throw new Error('HUGGINGFACE_API_KEY not configured');
  const hfModel = model || 'mistralai/Mistral-7B-Instruct-v0.3';
  const prompt = messages.map(m => `${m.role === 'user' ? '[INST]' : ''}${m.content}${m.role === 'user' ? '[/INST]' : ''}`).join('\n');
  const res = await fetch(`${HUGGINGFACE_BASE}/${hfModel}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 400, return_full_text: false } }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`HuggingFace error ${res.status}: ${t.slice(0, 200)}`); }
  const data = await res.json();
  return Array.isArray(data) ? data[0]?.generated_text || '' : data?.generated_text || '';
}

async function callOpenRouter(messages, model) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://restaurant-hybrid.local',
      'X-Title': 'Restaurant Hybrid AI',
    },
    body: JSON.stringify({ model: model || 'google/gemma-2-9b-it:free', messages, max_tokens: 512 }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`OpenRouter error ${res.status}: ${t.slice(0, 200)}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOllama(messages, model) {
  const base = getOllamaBase();
  const m = model || process.env.OLLAMA_MODEL || 'llama3';
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: m, messages, stream: false }),
    signal: AbortSignal.timeout(15000), // 15s timeout for local models
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Ollama error ${res.status}: ${t.slice(0, 200)}`); }
  const data = await res.json();
  return data.message?.content || '';
}

// ===== PROVIDER AUTO-SELECTION =====
// Priority: Ollama (local) → Groq → Gemini → OpenRouter → HuggingFace → Demo

async function callAI(messages, preferredProvider, preferredModel) {
  const provider = preferredProvider || process.env.AI_PROVIDER || 'auto';

  const tryProviders = provider === 'auto'
    ? ['ollama', 'groq', 'gemini', 'openrouter', 'huggingface']
    : [provider];

  for (const p of tryProviders) {
    try {
      let text = '';
      if (p === 'groq') text = await callGroq(messages, preferredModel);
      else if (p === 'gemini') text = await callGemini(messages, preferredModel);
      else if (p === 'huggingface') text = await callHuggingFace(messages, preferredModel);
      else if (p === 'openrouter') text = await callOpenRouter(messages, preferredModel);
      else if (p === 'ollama') text = await callOllama(messages, preferredModel);
      if (text) return { text, provider: p, demo: false };
    } catch (e) {
      logger.warn(`AI provider ${p} failed: ${e.message}`);
    }
  }

  // All providers failed — return demo response
  return { text: null, provider: 'demo', demo: true };
}

// ===== SYSTEM PROMPT FOR RESTAURANT CONTEXT =====
const RESTAURANT_SYSTEM_PROMPT = `Ești un asistent AI specializat pentru restaurante. Ajuți manageri și operatori cu:
- Analiza vânzărilor și KPI-urilor
- Optimizarea meniului și prețurilor
- Gestionarea stocurilor și ingredientelor
- Planificarea personalului
- Sugestii pentru marketing și oferte
- Interpretarea datelor din sistemul de gestiune

Răspunde întotdeauna în română. Fii concis, practic și oferă recomandări acționabile.
Nu inventa date — bazează-te pe contextul furnizat sau cere clarificări.`;

// ===== DEMO RESPONSES FOR EACH CONTEXT =====
const DEMO_RESPONSES = {
  general: 'Asistentul AI este în modul demonstrativ. Configurați unul din motoarele AI gratuite (Groq, Gemini, OpenRouter sau Ollama local) în fișierul .env pentru a activa răspunsuri reale.',
  analyze_sales: 'DEMO: Vânzările din ultimele 7 zile arată o tendință pozitivă de +12%. Vârful de vânzări este vineri seara (18:00-21:00). Recomand: activați o promoție "Happy Monday" pentru a crește vânzările de luni.',
  menu_advice: 'DEMO: Pe baza datelor de vânzări, produsul "Ciorba de burtă" este un STAR (marjă ridicată + popularitate ridicată). Considerați promovarea acestuia pe prima poziție în meniu digital.',
  stock_advice: 'DEMO: Stocul de roșii este la 2 zile — recomand o comandă urgentă la furnizorul principal. Prețul mediu al roșiilor a crescut cu 15% față de luna trecută — considerați alternative sezoniere.',
  pricing: 'DEMO: Produsul "Pizza Margherita" are elasticitate scăzută (-0.3) — o creștere de preț cu 8% ar genera +5.4% venituri cu scădere minimă a cererii.',
  staff: 'DEMO: Pe baza prognozei de trafic, vineri seara va fi necesară o echipă de 4 chelneri și 2 bucătari. Riscul de ore suplimentare pentru Ion Dumitrescu este RIDICAT (38h/40h săptămâna aceasta).',
};

// ===== ROUTES =====

// GET /providers — list available AI providers and their status
router.get('/providers', async (req, res) => {
  const providers = [
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      description: '100% gratuit, rulează local pe server. Fără date trimise în cloud.',
      free: true,
      requires_key: false,
      models: ['llama3', 'mistral', 'gemma2', 'phi3', 'codellama'],
      configured: true, // Always potentially available
      status: null,
      docs_url: 'https://ollama.ai',
      env_key: 'OLLAMA_BASE_URL (optional, default: localhost:11434)',
    },
    {
      id: 'groq',
      name: 'Groq API',
      description: 'Gratuit (30 req/min, 14400 req/zi, 500K tokens/zi). Cel mai rapid.',
      free: true,
      requires_key: true,
      models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      configured: !!process.env.GROQ_API_KEY,
      status: process.env.GROQ_API_KEY ? 'configured' : 'needs_key',
      docs_url: 'https://console.groq.com',
      env_key: 'GROQ_API_KEY',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gratuit (15 req/min, 1M tokens/zi pentru Flash). Model Google puternic.',
      free: true,
      requires_key: true,
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
      configured: !!process.env.GEMINI_API_KEY,
      status: process.env.GEMINI_API_KEY ? 'configured' : 'needs_key',
      docs_url: 'https://aistudio.google.com',
      env_key: 'GEMINI_API_KEY',
    },
    {
      id: 'openrouter',
      name: 'OpenRouter (Modele Gratuite)',
      description: 'Acces la modele gratuite: Gemma 2, Llama 3.1, Mistral, Qwen etc.',
      free: true,
      requires_key: true,
      models: ['google/gemma-2-9b-it:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free'],
      configured: !!process.env.OPENROUTER_API_KEY,
      status: process.env.OPENROUTER_API_KEY ? 'configured' : 'needs_key',
      docs_url: 'https://openrouter.ai',
      env_key: 'OPENROUTER_API_KEY',
    },
    {
      id: 'huggingface',
      name: 'HuggingFace Inference',
      description: 'Gratuit pentru modele publice. Rată limitată, ideal pentru testare.',
      free: true,
      requires_key: true,
      models: ['mistralai/Mistral-7B-Instruct-v0.3', 'HuggingFaceH4/zephyr-7b-beta'],
      configured: !!process.env.HUGGINGFACE_API_KEY,
      status: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'needs_key',
      docs_url: 'https://huggingface.co/settings/tokens',
      env_key: 'HUGGINGFACE_API_KEY',
    },
  ];

  // Check Ollama availability
  try {
    const ollamaRes = await fetch(`${getOllamaBase()}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      providers[0].status = 'online';
      providers[0].available_models = data.models?.map(m => m.name) || [];
    } else {
      providers[0].status = 'offline';
    }
  } catch {
    providers[0].status = 'offline';
    providers[0].note = 'Ollama nu rulează local. Instalați de la ollama.ai';
  }

  const activeProvider = process.env.AI_PROVIDER || 'auto';
  res.json({ providers, active_provider: activeProvider });
});

// POST /chat — generic chat endpoint
router.post('/chat', async (req, res) => {
  const { message, history = [], provider, model, context } = req.body;
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message este obligatoriu și max 2000 caractere' });
  }

  const systemPrompt = context
    ? `${RESTAURANT_SYSTEM_PROMPT}\n\nContext suplimentar: ${String(context).slice(0, 1000)}`
    : RESTAURANT_SYSTEM_PROMPT;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(h => ({ role: h.role, content: String(h.content).slice(0, 500) })), // keep last 10 messages
    { role: 'user', content: message },
  ];

  const result = await callAI(messages, provider, model);

  res.json({
    reply: result.demo
      ? DEMO_RESPONSES.general
      : result.text,
    provider: result.provider,
    demo: result.demo,
  });
});

// POST /analyze — analyze restaurant data with AI
router.post('/analyze', async (req, res) => {
  const { type, data, provider, model } = req.body;
  if (!type) return res.status(400).json({ error: 'type este obligatoriu' });

  const prompts = {
    sales: `Analizează aceste date de vânzări pentru un restaurant și oferă 3 recomandări concrete:\n${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`,
    menu: `Analizează performanța acestor produse din meniu (BCG matrix: STAR/PLOWHORSE/PUZZLE/DOG) și oferă recomandări:\n${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`,
    stock: `Analizează situația stocurilor și oferă recomandări de reaprovizionare:\n${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`,
    pricing: `Analizează elasticitatea prețurilor și sugerează ajustări optime:\n${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`,
    staff: `Analizează datele de personal și eficiență, și sugerează optimizări:\n${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`,
  };

  const userPrompt = prompts[type] || `Analizează aceste date: ${JSON.stringify(data || {}, null, 2).slice(0, 1500)}`;
  const messages = [
    { role: 'system', content: RESTAURANT_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const result = await callAI(messages, provider, model);
  const demoKey = type === 'sales' ? 'analyze_sales' : type === 'menu' ? 'menu_advice' : type === 'stock' ? 'stock_advice' : type === 'pricing' ? 'pricing' : 'staff';

  res.json({
    analysis: result.demo ? DEMO_RESPONSES[demoKey] : result.text,
    type,
    provider: result.provider,
    demo: result.demo,
  });
});

// POST /suggest — get AI suggestions for a specific scenario
router.post('/suggest', async (req, res) => {
  const { scenario, context, provider, model } = req.body;
  if (!scenario || typeof scenario !== 'string') {
    return res.status(400).json({ error: 'scenario este obligatoriu' });
  }

  const messages = [
    { role: 'system', content: RESTAURANT_SYSTEM_PROMPT },
    { role: 'user', content: `Scenariu: ${scenario.slice(0, 500)}\n\nContext: ${String(context || '').slice(0, 800)}\n\nOferă 3 sugestii concrete și acționabile.` },
  ];

  const result = await callAI(messages, provider, model);

  res.json({
    suggestions: result.demo ? DEMO_RESPONSES.general : result.text,
    provider: result.provider,
    demo: result.demo,
  });
});

export default router;
