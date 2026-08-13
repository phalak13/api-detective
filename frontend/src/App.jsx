import { useState } from "react"
import "./App.css"

function App() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const analyzeStatus = (status) => {
  if (status >= 200 && status < 300) {
    return {
      category: "Success",
      severity: "LOW",
      message: "API request was successful."
    }
  }

  if (status === 400) {
    return {
      category: "Client Error",
      severity: "MEDIUM",
      message: "The API could not understand the request."
    }
  }

  if (status === 401) {
    return {
      category: "Authentication Required",
      severity: "HIGH",
      message: "Authentication is required to access this API."
    }
  }

  if (status === 403) {
    return {
      category: "Forbidden",
      severity: "HIGH",
      message: "The API understood the request but refused access."
    }
  }

  if (status === 404) {
    return {
      category: "Not Found",
      severity: "MEDIUM",
      message: "The requested API endpoint could not be found."
    }
  }

  if (status >= 500) {
    return {
      category: "Server Error",
      severity: "CRITICAL",
      message: "The API server encountered an internal problem."
    }
  }

  return {
    category: "Unknown",
    severity: "MEDIUM",
    message: "The API returned an unexpected status code."
  }}
  const calculateHealth = (status, responseTime) => {
  let score = 100

  if (status >= 400 && status < 500) {
    score -= 30
  }

  if (status >= 500) {
    score -= 60
  }

  if (responseTime > 1000) {
    score -= 20
  } else if (responseTime > 500) {
    score -= 10
  }

  return Math.max(score, 0)
  }
  const investigateAPI = async () => {
    if (!url) return

    setLoading(true)
    setResult(null)

    const startTime = performance.now()

    try {
      const response = await fetch(url)
      const responseTime = Math.round(performance.now() - startTime)

      const contentType = response.headers.get("content-type") || ""
      const isJson = contentType.includes("application/json")

      let data

      if (isJson) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      setResult({
        status: response.status,
        responseTime,
        isJson,
        data,
        analysis: analyzeStatus(response.status),
        health: calculateHealth(response.status, responseTime)
      })
    } catch {
      setResult({
        error: "Could not connect to this API."
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
                    <strong>{result.analysis.category} 
                    </strong>
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
                <div className="diagnosis">
                  <span>DETECTIVE ANALYSIS</span>
                  <h3>
                    {result.analysis.severity === "CRITICAL"
                    ? "🔴"
                    : result.analysis.severity === "HIGH"
                    ? "🟠"
                    : result.analysis.severity === "MEDIUM"
                    ? "🟡"
                    : "🟢"}{" "}
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
                    {typeof result.data === "string"
                      ? result.data
                      : JSON.stringify(result.data, null, 2)}
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
