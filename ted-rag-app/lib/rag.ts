import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.llmod.ai",
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "ted-talks";
const TOP_K = Number(process.env.RAG_TOP_K || 6);

// Keep this aligned with the assignment instructions.
const TED_SYSTEM_PROMPT = `
You are a TED Talk assistant that answers questions strictly and only based on the TED dataset context provided to you (metadata and transcript passages). You must not use any external knowledge, the open internet, or information that is not explicitly contained in the retrieved context. If the answer cannot be determined from the provided context, respond: "I don’t know based on the provided TED data." Always explain your answer using the given context, quoting or paraphrasing the relevant transcript or metadata when helpful.
`.trim();

export type RetrievedChunk = {
  talk_id: string | number;
  title: string;
  speaker: string;
  topics: string[];
  chunk: string;
  score: number;
};

export type RagResult = {
  response: string;
  context: RetrievedChunk[];
  augmentedSystem: string;
  augmentedUser: string;
};

async function embedQuestion(question: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "RPRTHPB-text-embedding-3-small",
    input: [question],
  });

  const embedding = res.data[0]?.embedding;
  if (!embedding) {
    throw new Error("Failed to get embedding for question");
  }
  return embedding;
}

async function retrieveContext(question: string): Promise<RetrievedChunk[]> {
  const vector = await embedQuestion(question);
  const index = pinecone.index(PINECONE_INDEX_NAME);

  const ns = index.namespace(PINECONE_NAMESPACE);  // ✔ יצירת namespace object

  const queryRes = await ns.query({               // ✔ שאילתה על namespace
    topK: TOP_K,
    vector,
    includeMetadata: true,
  });

  const matches = queryRes.matches || [];

  return matches.map((m: any) => ({
    talk_id: m.metadata?.talk_id,
    title: m.metadata?.title,
    speaker: m.metadata?.speaker_1 || "",
    topics: m.metadata?.topics || [],
    chunk: m.metadata?.chunk || "",
    score: m.score,
  }));
}


function buildUserPrompt(question: string, context: RetrievedChunk[]): string {
  const ctx = context
    .map(
      (c, i) =>
        `Chunk ${i + 1} (talk_id=${c.talk_id}, title="${c.title}", speaker="${c.speaker}", score=${c.score.toFixed(
          4
        )}):\n${c.chunk}`
    )
    .join("\n\n---\n\n");

  return `
You are given context from TED talks (metadata and transcript chunks). Use ONLY this context.

CONTEXT:
${ctx || "[No context retrieved]"}

USER QUESTION:
${question}

INSTRUCTIONS:
- Answer strictly based on the context above.
- If you cannot answer from the context, say: "I don’t know based on the provided TED data."
- Explain your answer and refer to the relevant chunks.
`.trim();
}

export async function runRag(question: string): Promise<RagResult> {
  const context = await retrieveContext(question);
  const userPrompt = buildUserPrompt(question, context);

  const chatRes = await openai.chat.completions.create({
    model: "RPRTHPB-gpt-5-mini",
    messages: [
      { role: "system", content: TED_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const answer =
    chatRes.choices[0]?.message?.content ??
    'I don’t know based on the provided TED data.';

  return {
    response: answer,
    context,
    augmentedSystem: TED_SYSTEM_PROMPT,
    augmentedUser: userPrompt,
  };
}
