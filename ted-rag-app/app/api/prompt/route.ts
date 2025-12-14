// app/api/prompt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runRag } from "@/lib/rag";

const bodySchema = z.object({
  question: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = bodySchema.parse(body);

    const result = await runRag(question);

    return NextResponse.json({
      response: result.response,
      context: result.context.map((c) => ({
        talk_id: String(c.talk_id),
        title: c.title,
        //speaker: c.speaker,
        //topics: c.topics,
        chunk: c.chunk,
        score: c.score,
      })),
        Augmented_prompt: {
          System: result.Augmented_prompt.System,
          User: result.Augmented_prompt.User,
        },
    });
  } catch (err: any) {
    console.error("Error in /api/prompt:", err);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
