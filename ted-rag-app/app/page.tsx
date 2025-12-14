"use client";

import { useState } from "react";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg(null);
    setResponse(null);
    setResult(null);

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(`Error ${res.status}: ${text}`);
        return;
      }

      const data = await res.json();
      setResult(data);
      setResponse(data.response || "No response returned");
    } catch (err) {
      setErrorMsg("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f9fc",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
        color: "#2a2a2a",
      }}
    >
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "28px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
          TED RAG Assistant
        </h1>

        <p style={{ marginBottom: "24px", color: "#555" }}>
          Ask a question about the indexed TED talks.
          This page calls <code>/api/prompt</code>.
        </p>

        <form onSubmit={handleAsk}>
          <label
            style={{
              fontWeight: 600,
              marginBottom: "6px",
              display: "block",
            }}
          >
            Your question
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="e.g., Find a TED talk about overcoming fear..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #d0d7e2",
              resize: "vertical",
              fontSize: "15px",
              boxSizing: "border-box",
              marginBottom: "12px",
              backgroundColor: "#fafcff",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              fontSize: "15px",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "default" : "pointer",
              backgroundColor: "#3b82f6",
              color: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              backgroundColor: "#ffe5e5",
              border: "1px solid #ffb3b3",
              color: "#b40000",
              borderRadius: "8px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {response && (
          <>
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#f8faff",
                border: "1px solid #e0e7f1",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
                lineHeight: 1.55,
                fontSize: "15px",
              }}
            >
              {response}
            </div>

            {/* Debug view – not required for grading */}
            {result && (
              <details style={{ marginTop: "20px" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  Show full API response (debug)
                </summary>
                <pre
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    backgroundColor: "#f1f5f9",
                    padding: "12px",
                    borderRadius: "6px",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  );
}
