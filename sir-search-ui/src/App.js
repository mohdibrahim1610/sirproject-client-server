import { useState, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5237/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0d0f14;
    min-height: 100vh;
  }

  .vr-root {
    min-height: 100vh;
    background: #0d0f14;
    color: #e8eaf0;
    position: relative;
    overflow-x: hidden;
  }

  /* Ambient background orbs */
  .vr-root::before {
    content: '';
    position: fixed;
    top: -200px;
    left: -200px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .vr-root::after {
    content: '';
    position: fixed;
    bottom: -150px;
    right: -150px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── TOPBAR ── */
  .vr-topbar {
    position: relative;
    z-index: 10;
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 40px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .vr-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .vr-logo-mark {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: #fff;
    letter-spacing: -0.5px;
    box-shadow: 0 0 20px rgba(59,130,246,0.35);
  }
  .vr-topbar-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #fff;
    letter-spacing: -0.02em;
  }
  .vr-topbar-badge {
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 500;
    color: #93c5fd;
    letter-spacing: 0.03em;
  }
  .vr-topbar-meta {
    font-size: 12px;
    color: rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vr-dot-live {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── MAIN ── */
  .vr-main {
    position: relative;
    z-index: 2;
    max-width: 860px;
    margin: 0 auto;
    padding: 60px 24px 80px;
  }

  /* ── HERO ── */
  .vr-hero {
    text-align: center;
    margin-bottom: 48px;
  }
  .vr-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.25);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 11.5px;
    font-weight: 500;
    color: #60a5fa;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .vr-hero-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 40px;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .vr-hero-title span {
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .vr-hero-sub {
    font-size: 14.5px;
    color: rgba(255,255,255,0.4);
    font-weight: 400;
  }

  /* ── SEARCH CARD ── */
  .vr-search-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 32px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 60px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
  }
  .vr-search-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.5), transparent);
  }
  .vr-search-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 14px;
    display: block;
  }
  .vr-search-row {
    display: flex;
    gap: 10px;
  }
  .vr-input-wrap {
    flex: 1;
    position: relative;
  }
  .vr-input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.25);
    font-size: 16px;
  }
  .vr-input {
    width: 100%;
    padding: 13px 16px 13px 42px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    outline: none;
    color: #fff;
    background: rgba(255,255,255,0.05);
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .vr-input::placeholder { color: rgba(255,255,255,0.25); }
  .vr-input:focus {
    border-color: rgba(59,130,246,0.6);
    background: rgba(59,130,246,0.07);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 0 20px rgba(59,130,246,0.1);
  }
  .vr-btn {
    padding: 13px 28px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    background: linear-gradient(135deg, #3b82f6, #6d28d9);
    color: #fff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 4px 20px rgba(59,130,246,0.35);
    white-space: nowrap;
  }
  .vr-btn:hover { opacity: 0.92; box-shadow: 0 6px 28px rgba(59,130,246,0.5); transform: translateY(-1px); }
  .vr-btn:active { transform: translateY(0); }
  .vr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .vr-hints {
    margin-top: 14px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .vr-hint-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 11.5px;
    color: rgba(255,255,255,0.35);
  }
  .vr-hint-chip span { color: rgba(139,92,246,0.7); font-size: 10px; }

  /* ── RESULTS META ── */
  .vr-results-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 0 4px;
  }
  .vr-results-text {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
  }
  .vr-results-count {
    color: #60a5fa;
    font-weight: 600;
  }

  /* ── VOTER CARD ── */
  .vr-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    position: relative;
    overflow: hidden;
  }
  .vr-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 3px 0 0 3px;
  }
  .vr-card:hover {
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.04);
    transform: translateX(2px);
  }
  .vr-card:hover::before { opacity: 1; }

  .vr-card-left { flex: 1; min-width: 0; }

  .vr-name {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }
  .vr-father {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 14px;
  }
  .vr-father strong { color: rgba(255,255,255,0.65); font-weight: 500; }

  .vr-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 14px;
  }

  .vr-meta-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .vr-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .vr-meta-label {
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    font-weight: 600;
  }
  .vr-meta-value {
    font-size: 13.5px;
    color: rgba(255,255,255,0.8);
    font-weight: 500;
  }

  .vr-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .vr-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
  }
  .vr-chip-page {
    background: rgba(59,130,246,0.12);
    border: 1px solid rgba(59,130,246,0.25);
    color: #93c5fd;
  }
  .vr-chip-serial {
    background: rgba(139,92,246,0.12);
    border: 1px solid rgba(139,92,246,0.25);
    color: #c4b5fd;
  }

  /* ── SCORE BADGE ── */
  .vr-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .vr-score-ring {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 14px;
    position: relative;
  }
  .vr-score-ring.high {
    background: rgba(34,197,94,0.1);
    border: 2px solid rgba(34,197,94,0.35);
    color: #4ade80;
    box-shadow: 0 0 16px rgba(34,197,94,0.15);
  }
  .vr-score-ring.mid {
    background: rgba(251,191,36,0.1);
    border: 2px solid rgba(251,191,36,0.35);
    color: #fbbf24;
    box-shadow: 0 0 16px rgba(251,191,36,0.15);
  }
  .vr-score-ring.low {
    background: rgba(239,68,68,0.1);
    border: 2px solid rgba(239,68,68,0.35);
    color: #f87171;
    box-shadow: 0 0 16px rgba(239,68,68,0.15);
  }
  .vr-score-label {
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.25);
    font-weight: 600;
  }

  /* ── EMPTY STATE ── */
  .vr-empty {
    text-align: center;
    padding: 80px 0;
  }
  .vr-empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .vr-empty-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    margin-bottom: 8px;
  }
  .vr-empty-sub { font-size: 13px; color: rgba(255,255,255,0.25); }

  /* ── LOADING ── */
  .vr-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 0;
    color: rgba(255,255,255,0.3);
    font-size: 14px;
  }
  .vr-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(59,130,246,0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── STATS BAR ── */
  .vr-stats-bar {
    display: flex;
    gap: 1px;
    margin-bottom: 40px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .vr-stat {
    flex: 1;
    background: rgba(255,255,255,0.03);
    padding: 16px 20px;
    text-align: center;
    border-right: 1px solid rgba(255,255,255,0.06);
    transition: background 0.2s;
  }
  .vr-stat:last-child { border-right: none; }
  .vr-stat:hover { background: rgba(255,255,255,0.05); }
  .vr-stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: 4px;
  }
  .vr-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
`;

function getScoreClass(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (name) => {
    if (!name.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`${API}/voters/search`, { params: { name } });
      setResults(res.data.results);
      setTotal(res.data.totalFound);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="vr-root">

        {/* Top Bar */}
        <div className="vr-topbar">
          <div className="vr-topbar-left">
            <div className="vr-logo-mark">SIR</div>
            <span className="vr-topbar-title">Voter Registry</span>
            <span className="vr-topbar-badge">Yakutpura · Hyderabad</span>
          </div>
          <div className="vr-topbar-meta">
            <div className="vr-dot-live" />
            2025 Electoral Roll
          </div>
        </div>

        <div className="vr-main">

          {/* Hero */}
          <div className="vr-hero">
            <div className="vr-hero-eyebrow">
              <span>⚡</span> Smart Voter Lookup
            </div>
            <h1 className="vr-hero-title">
              Find Any <span>Registered</span> Voter
            </h1>
            <p className="vr-hero-sub">
              Fuzzy search with phonetic matching — supports typos, partial names & transliterations
            </p>
          </div>

          {/* Stats bar */}
          <div className="vr-stats-bar">
            {[
              { val: "1,24,832", lbl: "Total Voters" },
              { val: "312", lbl: "Booths" },
              { val: "Yakutpura", lbl: "Constituency" },
              { val: "2025", lbl: "Roll Year" },
            ].map((s, i) => (
              <div key={i} className="vr-stat">
                <div className="vr-stat-val">{s.val}</div>
                <div className="vr-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Search Card */}
          <div className="vr-search-card">
            <span className="vr-search-label">Search voter by name</span>
            <div className="vr-search-row">
              <div className="vr-input-wrap">
                <span className="vr-input-icon">🔍</span>
                <input
                  className="vr-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search(query)}
                  placeholder="e.g. Ibrahim, Begum, Reddy, Mohammed..."
                  autoFocus
                />
              </div>
              <button
                className="vr-btn"
                onClick={() => search(query)}
                disabled={loading}
              >
                {loading ? "Searching…" : "Search →"}
              </button>
            </div>
            <div className="vr-hints">
              {["✦ Supports typos", "✦ Phonetic match (Mohd = Mohammed)", "✦ Partial names", "✦ Urdu / Telugu names"].map((h, i) => (
                <span key={i} className="vr-hint-chip">{h}</span>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="vr-loading">
              <div className="vr-spinner" />
              Searching electoral roll…
            </div>
          )}

          {/* Results Meta */}
          {searched && !loading && total > 0 && (
            <div className="vr-results-meta">
              <span className="vr-results-text">
                Showing <span className="vr-results-count">{results.length}</span> of{" "}
                <span className="vr-results-count">{total}</span> results for "{query}"
              </span>
            </div>
          )}

          {/* Voter Cards */}
          {!loading && results.map((r, i) => (
            <div key={i} className="vr-card">
              <div className="vr-card-left">
                <div className="vr-name">{r.nameOriginal}</div>
                {r.fatherName && (
                  <div className="vr-father">
                    Father / Husband: <strong>{r.fatherName}</strong>
                  </div>
                )}
                <div className="vr-divider" />
                <div className="vr-meta-row">
                  {r.age && (
                    <div className="vr-meta-item">
                      <span className="vr-meta-label">Age</span>
                      <span className="vr-meta-value">{r.age}</span>
                    </div>
                  )}
                  {r.gender && (
                    <div className="vr-meta-item">
                      <span className="vr-meta-label">Gender</span>
                      <span className="vr-meta-value">{r.gender}</span>
                    </div>
                  )}
                  {r.district && (
                    <div className="vr-meta-item">
                      <span className="vr-meta-label">District</span>
                      <span className="vr-meta-value">{r.district}</span>
                    </div>
                  )}
                  {r.boothNumber && (
                    <div className="vr-meta-item">
                      <span className="vr-meta-label">EPIC No.</span>
                      <span className="vr-meta-value">{r.boothNumber}</span>
                    </div>
                  )}
                </div>
                <div className="vr-chips">
                  {r.pageNumber && (
                    <span className="vr-chip vr-chip-page">📄 Page {r.pageNumber}</span>
                  )}
                  {r.serialNumber && (
                    <span className="vr-chip vr-chip-serial"># Serial {r.serialNumber}</span>
                  )}
                </div>
              </div>

              {/* Score ring */}
              <div className="vr-score">
                <div className={`vr-score-ring ${getScoreClass(r.score)}`}>
                  {r.score}%
                </div>
                <span className="vr-score-label">Match</span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {searched && !loading && total === 0 && (
            <div className="vr-empty">
              <div className="vr-empty-icon">🔎</div>
              <div className="vr-empty-title">No voters found</div>
              <div className="vr-empty-sub">Try a different spelling or partial name</div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}