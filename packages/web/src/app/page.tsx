"use client";

import React, { useState, useEffect, useRef } from "react";

interface MessageItem {
  id: string;
  role: "user" | "recode" | "system" | "tool";
  content: string;
  thinking?: string;
  thinkingDuration?: number;
  toolCall?: { name: string; args: any };
  toolResult?: { success: boolean; output: string };
}

export default function WebTerminal() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingElapsed, setThinkingElapsed] = useState(0);
  const [activeModel, setActiveModel] = useState("gemini-2.5-flash");
  const [mode, setMode] = useState<"build" | "plan">("build");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [tokenCount, setTokenCount] = useState(1420);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingElapsed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Thinking timer
  useEffect(() => {
    let timer: any;
    if (isProcessing) {
      const start = Date.now();
      timer = setInterval(() => {
        setThinkingElapsed((Date.now() - start) / 1000);
      }, 100);
    } else {
      setThinkingElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const handleCommand = (cmdStr: string): boolean => {
    const trimmed = cmdStr.trim();
    if (!trimmed.startsWith("/")) return false;

    const parts = trimmed.slice(1).split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "help") {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "system",
          content: `╭─ [help] Recode Web Terminal Reference ─────────────────────────────
│ Commands:
│   /mode [build|plan]  Toggle autonomous editing vs read-only plan mode
│   /models             List available AI models
│   /model <name>       Switch active model (e.g. /model gemini-2.5-flash)
│   /connect <p> <key>  Connect API key (gemini, openai, anthropic, deepseek)
│   /clear              Clear terminal history
│   /status             Show engine and session status
│   /help               Show this reference guide
╰────────────────────────────────────────────────────────────────────`,
        },
      ]);
      return true;
    }

    if (cmd === "clear" || cmd === "cls") {
      setMessages([]);
      return true;
    }

    if (cmd === "mode") {
      const nextMode = args[0] === "plan" ? "plan" : args[0] === "build" ? "build" : mode === "build" ? "plan" : "build";
      setMode(nextMode);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "system",
          content: `[✓] Switched mode to [${nextMode.toUpperCase()}] (${nextMode === "build" ? "Full autonomous code modification" : "Read-only architecture analysis"})`,
        },
      ]);
      return true;
    }

    if (cmd === "model") {
      if (args[0]) {
        setActiveModel(args[0]);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "system",
            content: `[✓] Active model switched to: ${args[0]}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "system",
            content: `Current model: ${activeModel}`,
          },
        ]);
      }
      return true;
    }

    if (cmd === "models") {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "system",
          content: `Available Models in Recode:
  GEMINI    gemini-2.5-flash    1000k ctx    [Recommended] Free tier, ultra-fast
  GEMINI    gemini-2.5-pro      2000k ctx    Deep reasoning & massive context
  OPENAI    gpt-4o              128k ctx     Flagship omni model
  OPENAI    o3-mini             200k ctx     High reasoning math & code
  ANTHROPIC claude-3-7-sonnet   200k ctx     State-of-the-art coding agent
  DEEPSEEK  deepseek-chat       64k ctx      Fast open-weights V3
  DEEPSEEK  deepseek-reasoner   64k ctx      DeepSeek R1 reasoning chain`,
        },
      ]);
      return true;
    }

    if (cmd === "connect") {
      const prov = args[0]?.toLowerCase();
      const key = args.slice(1).join(" ");
      if (prov && key) {
        localStorage.setItem(`recode_key_${prov}`, key);
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "system",
            content: `[✓] Stored API key for ${prov.toUpperCase()} in browser storage!`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "system",
            content: `Usage: /connect <provider> <api_key>\nExample: /connect gemini AIzaSy...`,
          },
        ]);
      }
      return true;
    }

    if (cmd === "status") {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "system",
          content: `Engine Status:
  Engine: Recode v1.30.2
  Active Model: ${activeModel}
  Mode: [${mode.toUpperCase()}]
  Thread: recode-web-${Math.random().toString(36).slice(2, 7)}
  Cumulative Tokens: ${(tokenCount / 1000).toFixed(1)}k`,
        },
      ]);
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput("");
    setHistory((prev) => [...prev, userText]);
    setHistoryIdx(-1);

    if (handleCommand(userText)) return;

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userText },
    ]);

    setIsProcessing(true);
    const startTime = Date.now();
    let accumulatedThinking = "";
    let accumulatedContent = "";

    // Read stored BYOK keys
    const providerKeys: Record<string, string> = {
      gemini: localStorage.getItem("recode_key_gemini") || "",
      openai: localStorage.getItem("recode_key_openai") || "",
      anthropic: localStorage.getItem("recode_key_anthropic") || "",
      deepseek: localStorage.getItem("recode_key_deepseek") || "",
      groq: localStorage.getItem("recode_key_groq") || "",
    };

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userText },
          ],
          model: activeModel,
          mode,
          providerKeys,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      if (!res.body) throw new Error("No response body received");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "thinking" && event.content) {
              accumulatedThinking += event.content;
              const durationSec = (Date.now() - startTime) / 1000;
              setMessages((prev) => {
                const existing = prev.find((m) => m.id === assistantMsgId);
                if (existing) {
                  return prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, thinking: accumulatedThinking, thinkingDuration: durationSec }
                      : m
                  );
                }
                return [
                  ...prev,
                  {
                    id: assistantMsgId,
                    role: "recode",
                    content: "",
                    thinking: accumulatedThinking,
                    thinkingDuration: durationSec,
                  },
                ];
              });
            } else if (event.type === "token" && event.content) {
              accumulatedContent += event.content;
              const durationSec = (Date.now() - startTime) / 1000;
              setMessages((prev) => {
                const existing = prev.find((m) => m.id === assistantMsgId);
                if (existing) {
                  return prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent, thinkingDuration: durationSec }
                      : m
                  );
                }
                return [
                  ...prev,
                  {
                    id: assistantMsgId,
                    role: "recode",
                    content: accumulatedContent,
                    thinking: accumulatedThinking || undefined,
                    thinkingDuration: durationSec,
                  },
                ];
              });
            } else if (event.type === "error") {
              setMessages((prev) => [
                ...prev,
                { id: `err_${Date.now()}`, role: "system", content: `[x] Error: ${event.error}` },
              ]);
            }
          } catch {}
        }
      }

      const turnTokens = Math.ceil((userText.length + accumulatedContent.length) / 4);
      setTokenCount((prev) => prev + turnTokens);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "system",
          content: `[x] Request failed: ${err.message}\nConfigure your API keys in Vercel Environment Variables or type /connect.`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14] text-gray-200 font-mono text-sm sm:text-base leading-relaxed">
      {/* Top Banner / Navbar */}
      <div className="border-b border-[#1e293b] bg-[#0f141c] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">*</span>
          <span className="font-bold tracking-wider text-white">RECODE WEB TERMINAL</span>
          <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">
            v1.30.2
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => setMode(mode === "build" ? "plan" : "build")}
            className={`px-2 py-1 rounded font-bold uppercase border transition-colors ${
              mode === "build"
                ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                : "bg-purple-950 border-purple-700 text-purple-400"
            }`}
          >
            [{mode}]
          </button>
          <span className="text-gray-400 hidden sm:inline">{activeModel}</span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-4">
        {/* Top Pill Badge (Image 1 & 4) */}
        <div className="border border-cyan-900 bg-cyan-950/40 text-cyan-300 px-3 py-1.5 rounded inline-block text-xs sm:text-sm">
          * Welcome to Recode Terminal Coding Agent! [v1.30.2]
        </div>

        {/* Double-stroke Retro ASCII Banner (Image 1 & 2) */}
        <pre className="text-cyan-400 text-[10px] sm:text-xs font-bold leading-none select-none overflow-x-auto py-2">
{` ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗
 ██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
 ██████╔╝█████╗  ██║     ██║   ██║██║  ██║█████╗  
 ██╔══██╗██╔══╝  ██║     ██║   ██║██║  ██║██╔══╝  
 ██║  ██║███████╗╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`}
        </pre>
        <div className="text-xs text-gray-500">
          Autonomous AI Software Engineering Terminal · <span className="text-cyan-400 font-bold">v1.30.2</span>
        </div>

        {/* Philosophy Block (Image 4) */}
        <div className="bg-[#10151f] border border-[#1e293b] rounded p-4 text-xs sm:text-sm text-gray-400 font-mono">
          <div className="text-gray-500">while(<span className="text-cyan-400">curious</span>) &#123;</div>
          <div className="pl-4 text-purple-400">question_everything();</div>
          <div className="pl-4 text-purple-400">dig_deeper();</div>
          <div className="pl-4 text-purple-400">connect_dots(<span className="text-gray-500">unexpected</span>);</div>
          <div className="pl-4 text-gray-500 mt-1">if (<span className="text-cyan-400">stuck</span>) &#123;</div>
          <div className="pl-8 text-amber-400 font-bold">keep_thinking();</div>
          <div className="pl-4 text-gray-500">&#125;</div>
          <div className="text-gray-500">&#125;</div>
        </div>

        {/* Multi-Column Dashboard Card (Image 3) */}
        <div className="border border-[#1e293b] bg-[#0e131b] rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="space-y-2 border-b md:border-b-0 md:border-r border-[#1e293b] pb-4 md:pb-0 md:pr-4">
            <div className="font-bold text-white">Welcome back!</div>
            <pre className="text-cyan-400 font-mono text-xs select-none">
{`    [■■■]
   [ o o ]
    [===]`}
            </pre>
            <div className="text-gray-400">
              <span className="text-white font-bold">Model:</span> <span className="text-cyan-400">{activeModel}</span>
            </div>
            <div className="text-gray-400">
              <span className="text-white font-bold">Mode:</span>{" "}
              <span className={mode === "build" ? "text-emerald-400" : "text-purple-400"}>
                [{mode.toUpperCase()}] ({mode === "build" ? "Auto-edit" : "Read-only plan"})
              </span>
            </div>
            <div className="text-gray-400">
              <span className="text-white font-bold">Workspace:</span> ~/recode-web-playground
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="font-bold text-white mb-1">Recent Activity</div>
              <div className="text-gray-400 text-xs space-y-0.5">
                <div><span className="text-gray-600">1m ago</span>   Initialized Web Terminal container</div>
                <div><span className="text-gray-600">8m ago</span>   Connected AI provider routes</div>
                <div><span className="text-gray-600">2d ago</span>   Published Recode v1.30.2 engine</div>
              </div>
            </div>
            <div className="border-t border-[#1e293b] pt-2">
              <div className="font-bold text-white mb-1">What's new</div>
              <div className="text-gray-400 text-xs space-y-0.5">
                <div><span className="text-cyan-400">/mode</span>      Toggle build vs plan mode</div>
                <div><span className="text-cyan-400">/connect</span>   Set BYOK provider API keys</div>
                <div><span className="text-cyan-400">/models</span>    Explore multi-provider catalog</div>
                <div><span className="text-cyan-400">/help</span>      Command reference</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ready Checks (Image 2) */}
        <div className="text-xs space-y-1 text-gray-400">
          <div><span className="text-emerald-400">[✓]</span> Recode engine: <span className="font-bold text-white">ready</span></div>
          <div><span className="text-emerald-400">[✓]</span> Thread: <span className="text-cyan-400">recode-web-live</span></div>
          <div><span className="text-emerald-400">[✓]</span> Loaded autonomous engineering loop</div>
          <div className="text-white font-bold pt-2">Ready to code! What would you like to build?</div>
          <div className="text-gray-500">Enter send  •  /help commands  •  /mode switch</div>
        </div>

        {/* Conversation Turns */}
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="py-2">
                <div className="border-l-2 border-cyan-400 pl-3 py-1 font-bold text-white text-sm sm:text-base">
                  &gt; {m.content}
                </div>
              </div>
            );
          }

          if (m.role === "recode") {
            return (
              <div key={m.id} className="space-y-2 py-2">
                {/* Thinking Container (Image 4 & User Request) */}
                {m.thinking && (
                  <div className="border border-amber-900/60 bg-amber-950/20 rounded p-3 text-xs sm:text-sm">
                    <div className="text-amber-400 font-bold mb-1 flex items-center justify-between">
                      <span>╭─ [think] (Reasoning · {m.thinkingDuration ? `${m.thinkingDuration.toFixed(1)}s` : "complete"})</span>
                    </div>
                    <div className="text-gray-400 whitespace-pre-wrap pl-2 border-l border-amber-800/40">
                      {m.thinking}
                    </div>
                    <div className="text-amber-400/60 text-[10px] mt-1">╰──────────────────────────────────────────────────</div>
                  </div>
                )}

                {/* Assistant Output Container */}
                <div className="border border-cyan-900/50 bg-[#0d121a] rounded p-4 text-xs sm:text-sm text-gray-200">
                  <div className="text-cyan-400 font-bold text-xs mb-2">╭─ [recode]</div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                  <div className="text-cyan-900 text-xs mt-3">╰──────────────────────────────────────────────────</div>
                </div>
              </div>
            );
          }

          if (m.role === "system") {
            return (
              <div key={m.id} className="border border-gray-800 bg-[#12161f] rounded p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {m.content}
              </div>
            );
          }

          return null;
        })}

        {/* Live Thinking Status (Image 4) */}
        {isProcessing && (
          <div className="py-2 text-amber-400 text-xs flex items-center space-x-2">
            <span className="animate-spin text-amber-400">*</span>
            <span className="font-bold">Thinking...</span>
            <span className="text-gray-500">[{thinkingElapsed.toFixed(1)}s]</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom Status Dock (Image 2) */}
      <div className="border-t border-[#1e293b] bg-[#0c1017] px-4 py-1.5 text-xs text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className={`font-bold ${mode === "build" ? "text-emerald-400" : "text-purple-400"}`}>
            [{mode.toUpperCase()}]
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">~/web-workspace</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">{(tokenCount / 1000).toFixed(1)}k tokens</span>
        </div>
        <div className="text-cyan-400 font-mono">
          {activeModel}
        </div>
      </div>

      {/* Input Prompt Dock */}
      <form onSubmit={handleSubmit} className="border-t border-[#1e293b] bg-[#090c10] p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex items-center space-x-3">
          <div className="text-cyan-400 font-bold select-none">&gt;</div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={isProcessing}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessing ? "Recode is thinking..." : "Ready to code! What would you like to build? (or type /help)"}
            className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-sm sm:text-base placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 text-cyan-300 px-4 py-1.5 rounded text-xs sm:text-sm font-bold disabled:opacity-30 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
