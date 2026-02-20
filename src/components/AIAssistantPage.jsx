import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ===== CONSTANTS =====
const PROVIDER_INFO = {
  ollama:      { label: 'Ollama (Local)', icon: '🖥️', color: 'bg-gray-100 text-gray-700', tagline: '100% gratuit, local' },
  groq:        { label: 'Groq API',       icon: '⚡', color: 'bg-orange-100 text-orange-700', tagline: 'Gratuit · rapid' },
  gemini:      { label: 'Google Gemini',  icon: '✨', color: 'bg-blue-100 text-blue-700', tagline: 'Gratuit · Google' },
  openrouter:  { label: 'OpenRouter',     icon: '🌐', color: 'bg-purple-100 text-purple-700', tagline: 'Modele gratuite' },
  huggingface: { label: 'HuggingFace',    icon: '🤗', color: 'bg-yellow-100 text-yellow-700', tagline: 'Open source' },
  demo:        { label: 'Demo',           icon: '🎭', color: 'bg-gray-100 text-gray-500', tagline: 'Fără cheie AI' },
  auto:        { label: 'Auto',           icon: '🔄', color: 'bg-green-100 text-green-700', tagline: 'Selectare automată' },
};

const ANALYSIS_TYPES = [
  { id: 'sales',   label: '📊 Vânzări',         hint: 'Analizează trendul vânzărilor' },
  { id: 'menu',    label: '🍽️ Meniu',            hint: 'BCG Matrix, STAR/DOG/PUZZLE/PLOWHORSE' },
  { id: 'stock',   label: '📦 Stocuri',          hint: 'Recomandări reaprovizionare' },
  { id: 'pricing', label: '💰 Prețuri',          hint: 'Elasticitate și ajustări optime' },
  { id: 'staff',   label: '👥 Personal',         hint: 'Optimizare ture și eficiență' },
];

const QUICK_PROMPTS = [
  'Ce produse ar trebui să scoatem din meniu luna asta?',
  'Cum pot reduce costul de personal în zilele cu trafic mic?',
  'Care este cel mai bun moment pentru Happy Hour azi?',
  'Cum optimizăm stocurile pentru weekend?',
  'Sugerează 3 promoții pentru a crește comenzile de marți.',
  'Analizează de ce a scăzut AOV-ul față de săptămâna trecută.',
];

// ===== COMPONENTS =====
const ProviderBadge = ({ provider }) => {
  const info = PROVIDER_INFO[provider] || PROVIDER_INFO.demo;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      {info.icon} {info.label}
    </span>
  );
};

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
        {!isUser && msg.provider && (
          <div className="mb-1.5">
            <ProviderBadge provider={msg.provider} />
            {msg.demo && <span className="ml-1 text-xs text-orange-500 font-medium">⚠ Demo</span>}
          </div>
        )}
        <div className="whitespace-pre-wrap">{msg.content}</div>
        <div className={`text-xs mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
          {new Date(msg.ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const AIAssistantPage = () => {
  const [providers, setProviders] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [selectedModel, setSelectedModel] = useState('');
  const [analyzeType, setAnalyzeType] = useState('sales');
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState('auto');
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadProviders = async () => {
    try {
      const res = await axios.get('/api/ai-assistant/providers');
      setProviders(res.data.providers || []);
      setActiveProvider(res.data.active_provider || 'auto');
    } catch {
      setProviders([
        { id: 'ollama', name: 'Ollama (Local)', status: 'offline', configured: false, free: true, requires_key: false, docs_url: 'https://ollama.ai', env_key: 'OLLAMA_BASE_URL' },
        { id: 'groq', name: 'Groq API', status: 'needs_key', configured: false, free: true, requires_key: true, docs_url: 'https://console.groq.com', env_key: 'GROQ_API_KEY' },
        { id: 'gemini', name: 'Google Gemini', status: 'needs_key', configured: false, free: true, requires_key: true, docs_url: 'https://aistudio.google.com', env_key: 'GEMINI_API_KEY' },
        { id: 'openrouter', name: 'OpenRouter', status: 'needs_key', configured: false, free: true, requires_key: true, docs_url: 'https://openrouter.ai', env_key: 'OPENROUTER_API_KEY' },
        { id: 'huggingface', name: 'HuggingFace', status: 'needs_key', configured: false, free: true, requires_key: true, docs_url: 'https://huggingface.co/settings/tokens', env_key: 'HUGGINGFACE_API_KEY' },
      ]);
    }
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    const userEntry = { role: 'user', content: userMsg, ts: Date.now() };
    setChatHistory(prev => [...prev, userEntry]);
    setLoading(true);

    try {
      const history = chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post('/api/ai-assistant/chat', {
        message: userMsg,
        history,
        provider: selectedProvider !== 'auto' ? selectedProvider : undefined,
        model: selectedModel || undefined,
      });
      const assistantEntry = {
        role: 'assistant',
        content: res.data.reply || 'Răspuns indisponibil.',
        provider: res.data.provider,
        demo: res.data.demo,
        ts: Date.now(),
      };
      setChatHistory(prev => [...prev, assistantEntry]);
    } catch (err) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Eroare la conectarea cu motorul AI. Verificați configurarea în .env.',
        provider: 'demo',
        demo: true,
        ts: Date.now(),
      }]);
    }
    setLoading(false);
  };

  const runAnalysis = async () => {
    setAnalyzeLoading(true);
    setAnalyzeResult('');
    try {
      const res = await axios.post('/api/ai-assistant/analyze', {
        type: analyzeType,
        provider: selectedProvider !== 'auto' ? selectedProvider : undefined,
        model: selectedModel || undefined,
      });
      setAnalyzeResult(res.data.analysis || 'Niciun rezultat.');
    } catch {
      setAnalyzeResult('Eroare la analiză. Verificați configurarea AI în .env.');
    }
    setAnalyzeLoading(false);
  };

  const configuredCount = providers.filter(p => p.configured || p.status === 'online').length;
  const hasAny = configuredCount > 0;

  const tabs = [
    { id: 'chat',     label: '💬 Chat AI' },
    { id: 'analyze',  label: '🔍 Analiză' },
    { id: 'engines',  label: `⚙️ Motoare (${configuredCount}/${providers.length})` },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">🤖 Asistent AI Restaurant</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Motoare AI gratuite: Ollama (local) · Groq · Gemini · OpenRouter · HuggingFace
        </p>
      </div>

      {/* No AI configured banner */}
      {!hasAny && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
          <strong>⚠️ Niciun motor AI configurat.</strong> Funcționează în modul Demo.
          Configurați cel puțin unul din motoarele gratuite în fișierul <code className="bg-orange-100 px-1 rounded">.env</code> (tab „Motoare" pentru instrucțiuni).
        </div>
      )}

      {/* Provider + Model Selector */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">Motor AI</label>
          <select
            value={selectedProvider}
            onChange={e => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="auto">🔄 Auto (prioritate: Ollama → Groq → Gemini → OpenRouter → HF)</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {PROVIDER_INFO[p.id]?.icon || '🤖'} {p.name} {p.status === 'online' ? '✅' : p.configured ? '✅' : '— neconfigurat'}
              </option>
            ))}
          </select>
        </div>
        {selectedProvider !== 'auto' && (
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Model (opțional)</label>
            <input
              type="text"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              placeholder="ex. llama3, gemini-1.5-flash"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white w-52"
            />
          </div>
        )}
        {activeProvider && (
          <div className="ml-auto text-xs text-gray-400">
            Provider activ: <ProviderBadge provider={activeProvider} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'bg-white border-t border-l border-r border-gray-200 text-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200">
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col" style={{ height: '520px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {chatHistory.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-sm mb-4">Bun venit! Pot răspunde la întrebări despre restaurantul tău.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p)}
                        className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-200 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {loading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Întreabă ceva despre restaurant... (Enter pentru trimitere)"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  ➤
                </button>
                {chatHistory.length > 0 && (
                  <button
                    onClick={() => setChatHistory([])}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs"
                    title="Șterge conversația"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYZE TAB */}
        {activeTab === 'analyze' && (
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-4">Selectează tipul de analiză și AI-ul va genera recomandări bazate pe datele din sistem.</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {ANALYSIS_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setAnalyzeType(t.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${analyzeType === t.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.hint}</div>
                </button>
              ))}
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzeLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm mb-4 transition-colors"
            >
              {analyzeLoading ? '⟳ Se analizează...' : '🔍 Rulează Analiza AI'}
            </button>

            {analyzeResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Rezultat Analiză</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{analyzeResult}</div>
              </div>
            )}
          </div>
        )}

        {/* ENGINES TAB */}
        {activeTab === 'engines' && (
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-4">
              Toate motoarele AI de mai jos sunt <strong>100% gratuite</strong>. Configurați cel puțin unul adăugând cheia corespunzătoare în <code className="bg-gray-100 px-1 rounded">.env</code>.
            </p>

            <div className="space-y-3">
              {providers.map(p => {
                const info = PROVIDER_INFO[p.id] || {};
                const isOnline = p.status === 'online' || p.configured;
                return (
                  <div key={p.id} className={`border rounded-xl p-4 ${isOnline ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.icon || '🤖'}</span>
                        <div>
                          <div className="font-bold text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-500">{info.tagline}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status === 'online' ? '✅ Online' : p.configured ? '✅ Configurat' : p.status === 'needs_key' ? '🔑 Necesită cheie' : '⭕ Offline'}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">GRATUIT</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-600">{p.description}</div>

                    {p.models && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.models.slice(0, 4).map(m => (
                          <code key={m} className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{m}</code>
                        ))}
                      </div>
                    )}

                    {p.available_models && p.available_models.length > 0 && (
                      <div className="mt-1 text-xs text-green-600">
                        Modele instalate: {p.available_models.slice(0, 5).join(', ')}
                      </div>
                    )}

                    {!isOnline && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <strong>Configurare:</strong> Adaugă în <code className="bg-gray-100 px-1 rounded">.env</code>:{' '}
                        <code className="bg-blue-50 text-blue-700 px-1 rounded">{p.env_key}=YOUR_KEY_HERE</code>
                        {p.id === 'ollama' && (
                          <span className="block mt-1 text-gray-500">
                            Fără cheie: instalați Ollama de la{' '}
                            <a href={p.docs_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">ollama.ai</a>{' '}
                            și rulați <code className="bg-gray-100 px-1 rounded">ollama pull llama3</code>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2">
                      <a href={p.docs_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                        📖 Documentație și înregistrare →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
              <strong>💡 Recomandare:</strong> Pornind cu <strong>Groq</strong> (cel mai rapid, 14,400 req/zi gratuit) sau <strong>Ollama</strong> (100% local, fără date în cloud).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantPage;
