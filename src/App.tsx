import { useState, useEffect } from "react";
import { KeyRound, Zap, LoaderCircle } from "lucide-react";
import Alert from 'react-bootstrap/Alert';


interface Variable {
  key: string;
  value: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [promptA, setPromptA] = useState(
    "## TASK\nYou are a helpful assistant. Summarize this input user text precisely: \n\n## INPUT TEXT\n{{text}}",
  );
  const [promptB, setPromptB] = useState(
    "## ROLE: Expert Copywriter\nYou are rewriting input copy for clarity and maximum engagement. Keep it clean:\n\n## RAW INPUT\n{{text}}",
  );

  const [variable, setVariable] = useState<Variable>({
    key: "text",
    value:
      "Vite is a blazing fast frontend build tool powering the next generation of web development.",
  });

  const [outputA, setOutputA] = useState("");
  const [outputB, setOutputB] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelName] = useState("");
  const [modelNotice, setModelNotice] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState("");

  // Helper to inject user variables into raw prompts
  const injectVariables = (rawPrompt: string, v: Variable) => {
    const regex = new RegExp(`{{${v.key}}}`, "g");
    return rawPrompt.replace(regex, v.value);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gemini_api_key") || "";
      if (saved) setApiKey(saved);
    } catch (e) {
      // ignore localStorage errors in restricted environments
    }
  }, []);

  const saveApiKey = () => {
    if (!tempKey) return alert("Please paste your Gemini API key.");
    setApiKey(tempKey);
    try {
      localStorage.setItem("gemini_api_key", tempKey);
    } catch (e) {
      // ignore
    }
    setEditingKey(false);
    setTempKey("");
    setModelNotice("API key saved");
    setTimeout(() => setModelNotice(""), 3000);
  };

  const runEvaluation = async () => {
    if (!apiKey)
      return alert(
        "PromptDiff requires a valid Gemini API Key to function. Enter it in the settings bar.",
      );
    if (!variable.value)
      return alert("Please enter a test value for your variable bench.");
    setLoading(true);

    const finalA = injectVariables(promptA, variable);
    const finalB = injectVariables(promptB, variable);

    const discoverModel = async () => {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      if (!listResponse.ok) {
        throw new Error(listData.error?.message || listResponse.statusText);
      }

      const models = Array.isArray(listData.models) ? listData.models : [];

      const supportedModels = models.filter((m: any) => {
        const actions = [
          ...(m.supportedGenerationMethods ?? []),
          ...(m.supportedActions ?? []),
        ].map(String);
        return actions.some((action) =>
          action.toLowerCase().includes("generatecontent"),
        );
      });

      const selected =
        supportedModels.find((m: any) => /gemini/i.test(m.name)) ||
        supportedModels[0];
      if (!selected) {
        throw new Error(
          "No available models support generateContent for this API key.",
        );
      }

      const modelLabel = selected.name.replace(/^models\//, "");
      setModelNotice(`Using available model: ${modelLabel}`);
      return selected.name;
    };

    const fetchLLM = async (promptText: string) => {
      const normalizeModel = (rawModel: string) =>
        rawModel.startsWith("models/") ? rawModel : `models/${rawModel}`;
      const tryRequest = async (modelResource: string) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelResource}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        });
        const data = await response.json();
        return { response, data };
      };

      let modelResource = modelName
        ? normalizeModel(modelName)
        : await discoverModel();
      let { response, data } = await tryRequest(modelResource);

      if (!response.ok) {
        const message = String(
          data.error?.message || response.statusText,
        ).toLowerCase();
        if (
          message.includes("not found") ||
          message.includes("not supported")
        ) {
          modelResource = await discoverModel();
          ({ response, data } = await tryRequest(modelResource));
        }
      }

      if (!response.ok) {
        return `API Error: ${data.error?.message || response.statusText}`;
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof rawText === "string" && rawText.includes("Error")) {
        return "ERROR_RESPONSE";
      }
      return rawText || "ERROR_RESPONSE";
    };

    try {
      const [resA, resB] = await Promise.all([
        fetchLLM(finalA),
        fetchLLM(finalB),
      ]);
      setOutputA(resA === "ERROR_RESPONSE" ? "" : resA);
      setOutputB(resB === "ERROR_RESPONSE" ? "" : resB);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const isErrorOutput = (text: string) => /error/i.test(text);
  const displayOutputA = outputA && !isErrorOutput(outputA) ? outputA : "";
  const displayOutputB = outputB && !isErrorOutput(outputB) ? outputB : "";

  return (
    <div className="flex flex-col h-screen dark bg-slate-950 text-slate-100 selection:bg-slate-700">
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* <Scale className="size-7 text-indigo-500" /> */}
          <h1 className="text-xl font-bold tracking-tight">
            Prompt<span className="text-indigo-400">Diff</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* <button onClick={() => setShowSettings(!showSettings)} className="text-slate-500 hover:text-white p-2">
            <Settings2 className="size-5" />
          </button> */}
          {/* <button className="text-slate-500 hover:text-white p-2">
            <HelpCircle className="size-5" />
          </button> */}
        </div>
      </header>

      {/* Settings Bar (API Key) */}
      {
        <div
          className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex items-center gap-4"
          style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
        >
          <KeyRound className="size-5 text-slate-500" />
          {!apiKey || editingKey ? (
            <>
              <input
                type="password"
                placeholder="Paste your Gemini API Key here (Free tier works)..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveApiKey();
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-base font-mono w-full focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
              <button
                onClick={saveApiKey}
                className="text-indigo-400 px-3 py-2 rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingKey(false);
                  setTempKey("");
                }}
                className="text-slate-500 px-3 py-2"
              >
                Close
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-row items-center gap-3 w-full">
                <div className="flex-1 text-sm text-slate-300">
                  Key saved ••••{apiKey.slice(-4)}
                </div>
              </div>

              <div className="flex flex-row items-center justify-start gap-4 w-full">
                <button
                  onClick={() => {
                    setEditingKey(true);
                    setTempKey(apiKey);
                  }}
                  className="text-indigo-400 px-4 py-2 rounded-md hover:bg-slate-800 flex-shrink-0"
                  style={{ marginRight: "10px" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setApiKey("");
                    try {
                      localStorage.removeItem("gemini_api_key");
                    } catch {}
                    setModelNotice("API key cleared");
                    setTimeout(() => setModelNotice(""), 3000);
                  }}
                  className="text-slate-500 px-4 py-2 rounded-md hover:bg-slate-800 flex-shrink-0"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      }

      {/* Main Workspace: Split Editor Panel */}
      <main
        className="flex-1 flex overflow-hidden"
        style={{ marginTop: "20px" }}
      >
        <div className="grid grid-cols-3 gap-4" style={{ display: "flex", justifyContent: "space-around" }}>
          <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800">
            <h2 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">
              PROMPT VERSION A
            </h2>

             <textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              placeholder="Draft Prompt A..."
              style={{ width: 500, height: 200 }}
              className="bg-slate-950 p-6 text-lg font-mono leading-relaxed resize-none focus:outline-none placeholder:text-slate-700"
            />
          </div>

          <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800">
            <h2 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">
              PROMPT VERSION B (Challenger)
            </h2>

            <textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              placeholder="Draft Prompt B..."
              style={{ width: 500, height: 200 }}
              className="bg-slate-950 p-6 text-lg font-mono leading-relaxed resize-none focus:outline-none placeholder:text-slate-700"
            />
          </div>
        </div>
      </main>

      {/* Shared Comparison Action & Variables Command Bar (Floating at Bottom) */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-10">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-lg">
          {/* Variables Bench (Now Central) */}
          <div className="grid grid-cols-[160px,1fr] gap-4 items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">
                {"{"}
              </span>
              <input
                type="text"
                value={variable.key}
                onChange={(e) =>
                  setVariable({ ...variable, key: e.target.value })
                }
                className="w-full bg-transparent border-b border-slate-700 px-7 py-1 text-base font-mono text-indigo-400 placeholder:text-slate-700"
                placeholder="Key (e.g. text)"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">
                {"}"}
              </span>
            </div>

            <div className="flex items-center gap-2" style={{ marginTop: "15px" }}>
              <span> Write your prompt here </span>
            </div>
            <textarea
              value={variable.value}
              onChange={(e) =>
                setVariable({ ...variable, value: e.target.value })
              }
              rows={4}
              style={{width: '550px'}}
              className="flex-1 bg-transparent border border-slate-700 rounded-lg px-4 py-2 text-base text-slate-300 placeholder:text-slate-700 resize-none"
              placeholder="Paste dynamic test value for substitution..."
            />
          </div>
          {modelNotice && (
            <div className="text-sm text-slate-300 mt-2">{modelNotice}</div>
          )}

              <button
            onClick={runEvaluation}
            disabled={loading}
            style={{backgroundColor: "green", border: "none"}}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 font-semibold text-lg text-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] whitespace-nowrap"
          >
            {loading ? (
              <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LoaderCircle className="size-6 text-indigo-200" style={{ animation: "spin 1s linear infinite" }} />
                <span>
                  Loading Response...
                </span>
              </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap className="size-6 text-yellow-400" fill="yellow"/>
                <span>Run Evaluation</span>
              </div>
            )}
          </button>
          {isErrorOutput(outputA)  && (
            <Alert  variant={'danger'} style={{backgroundColor: "red"}}>
          User request exceeded limit. Please try again later.
        </Alert>
          )}
        </div>
      </footer>

      {/* Evaluation Output Section (Only shown after generation) */}
      {!isErrorOutput(outputA) && outputA.length > 0? (
        <div className="border-t border-slate-800 bg-slate-900 min-h-[35vh] p-4">
          <div style={{display: "flex", justifyContent: "space-around"}}>
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Output A
              </div>
              <div className="flex-1 w-full p-6 text-base font-sans whitespace-pre-wrap leading-relaxed text-slate-200 selection:bg-slate-700">
                {displayOutputA || (
                  <span className="text-slate-700 font-mono">Running...</span>
                )}
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Output B
              </div>
              <div className="flex-1 w-full p-6 text-base font-sans whitespace-pre-wrap leading-relaxed text-slate-200 selection:bg-slate-700">
                {displayOutputB || (
                  <span className="text-slate-700 font-mono">Running...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : <></>}

      {/* Spacer so the floating footer doesn't overlap text when output appears */}
      {(outputA || outputB) && <div className="h-[200px]"></div>}
    </div>
  );
}
