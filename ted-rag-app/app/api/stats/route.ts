// app/api/stats/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const chunkSize = Number(process.env.RAG_CHUNK_SIZE || 1000);
  const overlapRatio = Number(process.env.RAG_OVERLAP_RATIO || 0.1);
  const topK = Number(process.env.RAG_TOP_K || 10);

  return NextResponse.json({
    chunk_size: chunkSize,
    overlap_ratio: overlapRatio,
    top_k: topK,
  });
}
