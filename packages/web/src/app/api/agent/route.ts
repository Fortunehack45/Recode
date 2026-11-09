import { NextRequest, NextResponse } from "next/server";
import { LLMClient, DEFAULT_MODELS, resolveModel, ProviderKeys } from "@recode-dev/core";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], model, providerKeys = {}, mode = "build" } = body;

    // Merge server environment variables with any client-provided BYOK keys
    const mergedKeys: ProviderKeys = {
      gemini: providerKeys.gemini || process.env.GEMINI_API_KEY,
      openai: providerKeys.openai || process.env.OPENAI_API_KEY,
      anthropic: providerKeys.anthropic || process.env.ANTHROPIC_API_KEY,
      deepseek: providerKeys.deepseek || process.env.DEEPSEEK_API_KEY,
      groq: providerKeys.groq || process.env.GROQ_API_KEY,
      openrouter: providerKeys.openrouter || process.env.OPENROUTER_API_KEY,
    };

    const targetModel = model || process.env.DEFAULT_MODEL || "gemini-2.5-flash";
    const llmClient = new LLMClient(mergedKeys);

    // Verify key exists for target model
    const resolved = resolveModel(targetModel, undefined, mergedKeys);
    const key = mergedKeys[resolved.provider];
    if (!key) {
      return NextResponse.json(
        {
          error: `No API key configured for ${resolved.provider.toUpperCase()} (model: ${resolved.id}).\nConfigure in Vercel Environment Variables or use /connect in the terminal.`,
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Recode, an autonomous AI software engineering agent running in the Recode Web Terminal.
Mode: ${mode.toUpperCase()} (${mode === "plan" ? "Architecture analysis and planning only" : "Full engineering & solution generation"}).
Operating Rules:
1. Provide concise, direct, high-signal engineering solutions.
2. When thinking or reasoning, be clear and methodical.
3. Output clean code and explanation. Zero emojis in terminal output.`;

    const fullMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.filter((m: any) => m.role !== "system"),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = llmClient.streamChat(fullMessages, {
            model: resolved.id,
          });

          for await (const chunk of llmStream) {
            const jsonLine = JSON.stringify(chunk) + "\n";
            controller.enqueue(encoder.encode(jsonLine));
          }
          controller.close();
        } catch (err: any) {
          const errLine = JSON.stringify({ type: "error", error: err.message }) + "\n";
          controller.enqueue(encoder.encode(errLine));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
