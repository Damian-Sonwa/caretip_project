/**
 * CareTip landing AI audit harness (no secrets printed).
 * Run: npm run audit:landing-ai
 */
import "../loadEnv.js";
import { generateLandingAiReply } from "../services/landingAi.service.js";
import { rankFaqEntries } from "../services/landingAiKnowledge.js";

type Classification = "faq_only" | "partial" | "generated";

function classify(source: "openai" | "knowledge", reply: string, userText: string): Classification {
  if (source === "openai") return "generated";
  const ranked = rankFaqEntries(userText, undefined, 2);
  if (ranked.length === 0) return "partial";
  const needle = ranked[0].en.slice(0, 48).toLowerCase();
  if (reply.toLowerCase().includes(needle.slice(0, 24))) return "faq_only";
  return "partial";
}

const SCENARIOS: Array<{ category: string; question: string; locale?: string }> = [
  { category: "business", question: "How can I increase tips?" },
  { category: "business", question: "Why are tips lower this week?" },
  { category: "business", question: "How should I onboard my staff?" },
  { category: "business", question: "What are the benefits of QR tipping?" },
  { category: "business", question: "How can CareTip help a restaurant improve service?" },
  { category: "product", question: "Explain CareTip to a hotel manager" },
  { category: "product", question: "Compare CareTip with cash tipping" },
  { category: "product", question: "What KPIs should I monitor?" },
  { category: "reasoning", question: "Hospitality growth recommendations for a small hotel" },
  { category: "reasoning", question: "Employee motivation suggestions for tipped staff" },
  { category: "reasoning", question: "Customer experience improvement ideas for restaurants" },
];

async function probeOpenAiReachability(): Promise<{
  configured: boolean;
  model: string;
  baseUrl: string;
  reachable: boolean;
  httpStatus?: number;
  errorHint?: string;
}> {
  const apiKey =
    process.env.LANDING_AI_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  const model =
    process.env.LANDING_AI_OPENAI_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";
  const baseUrl = (
    process.env.LANDING_AI_OPENAI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1"
  ).replace(/\/+$/, "");

  if (!apiKey) {
    return { configured: false, model, baseUrl, reachable: false, errorHint: "no_api_key" };
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 8,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return {
        configured: true,
        model,
        baseUrl,
        reachable: false,
        httpStatus: res.status,
        errorHint: text.slice(0, 120) || "http_error",
      };
    }
    return { configured: true, model, baseUrl, reachable: true, httpStatus: res.status };
  } catch (e) {
    return {
      configured: true,
      model,
      baseUrl,
      reachable: false,
      errorHint: e instanceof Error ? e.message : "fetch_failed",
    };
  }
}

async function main(): Promise<void> {
  const landingKey = !!process.env.LANDING_AI_OPENAI_API_KEY?.trim();
  const openaiKey = !!process.env.OPENAI_API_KEY?.trim();

  console.log("=== CareTip Landing AI Audit ===\n");
  console.log("Environment");
  console.log("  NODE_ENV:", process.env.NODE_ENV ?? "(unset)");
  console.log("  LANDING_AI_OPENAI_API_KEY set:", landingKey);
  console.log("  OPENAI_API_KEY set:", openaiKey);
  console.log("  Effective key available:", landingKey || openaiKey);

  const probe = await probeOpenAiReachability();
  console.log("\nOpenAI probe");
  console.log("  model:", probe.model);
  console.log("  baseUrl:", probe.baseUrl);
  console.log("  reachable:", probe.reachable);
  if (probe.httpStatus) console.log("  httpStatus:", probe.httpStatus);
  if (probe.errorHint) console.log("  hint:", probe.errorHint);

  console.log("\nScenario runs (source + classification)");
  const results: Array<{
    category: string;
    question: string;
    source: string;
    classification: Classification;
    preview: string;
  }> = [];

  for (const s of SCENARIOS) {
    const locale = s.locale ?? "en";
    const { reply, source, fallbackReason } = await generateLandingAiReply({
      messages: [{ role: "user", content: s.question }],
      locale,
    });
    const classification = classify(source, reply, s.question);
    results.push({
      category: s.category,
      question: s.question,
      source,
      classification,
      preview: reply.replace(/\s+/g, " ").slice(0, 160),
    });
    console.log(`\n[${s.category}] ${s.question}`);
    console.log(`  source=${source} fallback=${fallbackReason ?? "none"} class=${classification}`);
    console.log(`  preview: ${results[results.length - 1].preview}…`);
  }

  const openaiCount = results.filter((r) => r.source === "openai").length;
  const faqOnly = results.filter((r) => r.classification === "faq_only").length;
  console.log("\n=== Summary ===");
  console.log(`  OpenAI replies: ${openaiCount}/${results.length}`);
  console.log(`  FAQ-only (knowledge path): ${faqOnly}/${results.length}`);
  console.log(
    `  Intelligence score (heuristic): ${Math.round((openaiCount / results.length) * 70 + ((results.length - faqOnly) / results.length) * 30)} / 100`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
