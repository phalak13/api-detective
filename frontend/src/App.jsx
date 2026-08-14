import { useState } from "react"
import "./App.css"

function App() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const investigateAPI = async () => {
    if (!url) return

    setLoading(true)
    setResult(null)

    try {
      const cleanUrl = url.trim().replace(/^['"]|['"]$/g, "")

      const response = await fetch(
  `http://127.0.0.1:8000/analyze?url=${encodeURIComponent(cleanUrl)}`
)

      console.log("Backend response:", response.status)

      const data = await response.json()

      console.log("Backend data:", data)

      if (!response.ok) {
        setResult({
          error: data.detail || "Could not analyze this API."
        })
        return
      }

      setResult({
        status: data.status_code,
        responseTime: data.response_time_ms,
        isJson: data.is_json,
        data: data,
        analysis: data.status_analysis,
        health: data.health_score
      })
    } catch (error) {
      console.error("API Detective error:", error)

      setResult({
        error: `Connection error: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="logo">🕵️ API Detective</div>
        <p>Investigate APIs. Understand responses.</p>
      </header>

      <main>
        <section className="search-box">
          <input
            type="text"
            placeholder="https://api.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button onClick={investigateAPI}>
            {loading ? "Investigating..." : "Investigate"}
          </button>
        </section>

        {result && (
          <section className="report">
            <h2>🔎 API Detective Report</h2>

            {result.error ? (
              <div className="error">
                ❌ {result.error}
              </div>
            ) : (
              <>
                <div className="stats">
                  <div>
                    <span>STATUS</span>
                    <strong>{result.analysis.category}</strong>
                  </div>

                  <div>
                    <span>STATUS CODE</span>
                    <strong>{result.status}</strong>
                  </div>

                  <div>
                    <span>RESPONSE TIME</span>
                    <strong>{result.responseTime} ms</strong>
                  </div>

                  <div>
                    <span>FORMAT</span>
                    <strong>
                      {result.isJson ? "JSON" : "TEXT"}
                    </strong>
                  </div>
                </div>

                <div className="health">
                  <span>API HEALTH</span>
                  <h3>
                    {result.health >= 80
                      ? "🟢"
                      : result.health >= 50
                      ? "🟡"
                      : "🔴"}{" "}
                    {result.health}/100
                  </h3>
                </div>

                <div className="performance">
                  <span>PERFORMANCE</span>
                  <h3>
                    {result.responseTime < 300
                      ? "🟢 Fast"
                      : result.responseTime <= 1000
                      ? "🟡 Moderate"
                      : "🔴 Slow"}
                  </h3>
                </div>

                <div className="diagnosis">
                  <span>DETECTIVE ANALYSIS</span>

                  <h3>
                    {result.analysis.severity === "HIGH"
                      ? "🟠"
                      : result.analysis.severity === "MEDIUM"
                      ? "🟡"
                      : result.analysis.severity === "LOW"
                      ? "🟢"
                      : "🔴"}{" "}
                    {result.analysis.severity}
                  </h3>

                  <p>{result.analysis.message}</p>
                </div>

                <div className="endpoint">
                  <span>ENDPOINT</span>
                  <p>{url}</p>
                </div>

                <div className="response">
                  <h3>RESPONSE DATA</h3>

                  <pre>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App