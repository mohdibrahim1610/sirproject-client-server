import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5237/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0d0f14; min-height: 100vh; }

  .vr-root { min-height: 100vh; background: #0d0f14; color: #e8eaf0; position: relative; overflow-x: hidden; }
  .vr-root::before {
    content: ''; position: fixed; top: -200px; left: -200px; width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .vr-root::after {
    content: ''; position: fixed; bottom: -150px; right: -150px; width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .vr-topbar {
    position: relative; z-index: 10; background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between;
  }
  .vr-topbar-left { display: flex; align-items: center; gap: 12px; }
  .vr-logo-mark {
    width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #fff;
    box-shadow: 0 0 20px rgba(59,130,246,0.35);
  }
  .vr-topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; letter-spacing: -0.02em; }
  .vr-topbar-badge { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 500; color: #93c5fd; }
  .vr-topbar-meta { font-size: 12px; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 6px; }
  .vr-dot-live { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .vr-tabs {
    position: relative; z-index: 10; background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 40px; display: flex; gap: 4px;
  }
  .vr-tab {
    padding: 14px 20px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    color: rgba(255,255,255,0.35); cursor: pointer; border: none; background: none;
    border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s;
    display: flex; align-items: center; gap: 7px; margin-bottom: -1px;
  }
  .vr-tab:hover { color: rgba(255,255,255,0.65); }
  .vr-tab.active { color: #60a5fa; border-bottom-color: #3b82f6; }

  .vr-main { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }

  .vr-hero { text-align: center; margin-bottom: 40px; }
  .vr-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
    border-radius: 20px; padding: 4px 14px; font-size: 11.5px; font-weight: 500;
    color: #60a5fa; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 18px;
  }
  .vr-hero-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 38px; color: #fff; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 10px; }
  .vr-hero-title span { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .vr-hero-sub { font-size: 14px; color: rgba(255,255,255,0.4); }

  .vr-stats-bar { display: flex; gap: 1px; margin-bottom: 36px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .vr-stat { flex: 1; background: rgba(255,255,255,0.03); padding: 16px 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.06); }
  .vr-stat:last-child { border-right: none; }
  .vr-stat:hover { background: rgba(255,255,255,0.05); }
  .vr-stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
  .vr-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

  .vr-search-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 20px; padding: 28px 28px 24px; margin-bottom: 28px;
    backdrop-filter: blur(10px); box-shadow: 0 4px 60px rgba(0,0,0,0.4); position: relative; overflow: hidden;
  }
  .vr-search-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.5), transparent); }
  .vr-search-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; display: block; }
  .vr-search-row { display: flex; gap: 10px; }
  .vr-input-wrap { flex: 1; position: relative; }
  .vr-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.25); font-size: 16px; }
  .vr-input { width: 100%; padding: 13px 16px 13px 42px; font-size: 15px; font-family: 'DM Sans', sans-serif; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; outline: none; color: #fff; background: rgba(255,255,255,0.05); transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; }
  .vr-input::placeholder { color: rgba(255,255,255,0.25); }
  .vr-input:focus { border-color: rgba(59,130,246,0.6); background: rgba(59,130,246,0.07); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
  .vr-btn { padding: 13px 28px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; background: linear-gradient(135deg, #3b82f6, #6d28d9); color: #fff; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(59,130,246,0.35); white-space: nowrap; transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s; }
  .vr-btn:hover { opacity: 0.92; box-shadow: 0 6px 28px rgba(59,130,246,0.5); transform: translateY(-1px); }
  .vr-btn:active { transform: translateY(0); }
  .vr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .vr-hints { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
  .vr-hint-chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 4px 12px; font-size: 11.5px; color: rgba(255,255,255,0.35); }

  .vr-results-meta { display: flex; align-items: center; margin-bottom: 16px; padding: 0 4px; }
  .vr-results-text { font-size: 13px; color: rgba(255,255,255,0.4); }
  .vr-results-count { color: #60a5fa; font-weight: 600; }

  .vr-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 24px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; transition: border-color 0.2s, background 0.2s, transform 0.15s; position: relative; overflow: hidden; }
  .vr-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #3b82f6, #8b5cf6); opacity: 0; transition: opacity 0.2s; border-radius: 3px 0 0 3px; }
  .vr-card:hover { border-color: rgba(59,130,246,0.25); background: rgba(59,130,246,0.04); transform: translateX(2px); }
  .vr-card:hover::before { opacity: 1; }
  .vr-card-left { flex: 1; min-width: 0; }
  .vr-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .vr-father { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 14px; }
  .vr-father strong { color: rgba(255,255,255,0.65); font-weight: 500; }
  .vr-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
  .vr-meta-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 12px; }
  .vr-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .vr-meta-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.25); font-weight: 600; }
  .vr-meta-value { font-size: 13.5px; color: rgba(255,255,255,0.8); font-weight: 500; }
  .vr-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .vr-chip { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
  .vr-chip-page   { background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }
  .vr-chip-serial { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); color: #c4b5fd; }
  .vr-chip-mandal { background: rgba(34,197,94,0.1);   border: 1px solid rgba(34,197,94,0.2);   color: #86efac; }
  .vr-chip-booth  { background: rgba(251,191,36,0.1);  border: 1px solid rgba(251,191,36,0.2);  color: #fde68a; }

  .vr-score { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
  .vr-score-ring { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; }
  .vr-score-ring.high { background: rgba(34,197,94,0.1);  border: 2px solid rgba(34,197,94,0.35);  color: #4ade80; box-shadow: 0 0 16px rgba(34,197,94,0.15); }
  .vr-score-ring.mid  { background: rgba(251,191,36,0.1); border: 2px solid rgba(251,191,36,0.35); color: #fbbf24; box-shadow: 0 0 16px rgba(251,191,36,0.15); }
  .vr-score-ring.low  { background: rgba(239,68,68,0.1);  border: 2px solid rgba(239,68,68,0.35);  color: #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.15); }
  .vr-score-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.25); font-weight: 600; }

  .vr-empty { text-align: center; padding: 80px 0; }
  .vr-empty-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .vr-empty-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
  .vr-empty-sub { font-size: 13px; color: rgba(255,255,255,0.25); }
  .vr-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 48px 0; color: rgba(255,255,255,0.3); font-size: 14px; }
  .vr-spinner { width: 18px; height: 18px; border: 2px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── IMPORT ── */
  .imp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  @media (max-width: 640px) { .imp-grid { grid-template-columns: 1fr; } }
  .imp-full { grid-column: 1 / -1; }

  .imp-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; backdrop-filter: blur(10px); box-shadow: 0 4px 40px rgba(0,0,0,0.3); }
  .imp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent); }
  .imp-card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
  .imp-card-sub { font-size: 12.5px; color: rgba(255,255,255,0.35); margin-bottom: 20px; line-height: 1.5; }

  .imp-dropzone { border: 2px dashed rgba(255,255,255,0.12); border-radius: 14px; padding: 32px 20px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; background: rgba(255,255,255,0.02); }
  .imp-dropzone:hover, .imp-dropzone.drag-over { border-color: rgba(59,130,246,0.5); background: rgba(59,130,246,0.05); }
  .imp-drop-icon { font-size: 32px; margin-bottom: 10px; }
  .imp-drop-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
  .imp-drop-sub { font-size: 12px; color: rgba(255,255,255,0.3); }

  .imp-file-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .imp-file-item { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; }
  .imp-file-icon { font-size: 18px; flex-shrink: 0; }
  .imp-file-name { font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .imp-file-size { font-size: 11px; color: rgba(255,255,255,0.3); flex-shrink: 0; }
  .imp-file-remove { background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer; font-size: 16px; padding: 0 4px; transition: color 0.15s; }
  .imp-file-remove:hover { color: #f87171; }

  .imp-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
  .imp-field-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; display: block; }
  .imp-input { width: 100%; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; color: #fff; background: rgba(255,255,255,0.05); transition: border-color 0.2s, box-shadow 0.2s; }
  .imp-input::placeholder { color: rgba(255,255,255,0.2); }
  .imp-input:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .imp-hint { font-size: 11px; color: rgba(255,255,255,0.22); margin-top: 5px; line-height: 1.5; }

  .imp-progress-wrap { margin-top: 16px; }
  .imp-progress-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; display: flex; justify-content: space-between; }
  .imp-progress-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; }
  .imp-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 10px; transition: width 0.4s ease; }

  .imp-result { margin-top: 16px; border-radius: 12px; padding: 16px 18px; border: 1px solid; font-size: 13px; line-height: 1.6; }
  .imp-result.success { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); color: #86efac; }
  .imp-result.error   { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.2);  color: #fca5a5; }
  .imp-result-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .imp-result-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .imp-result-row:last-child { border-bottom: none; }
  .imp-result-key { color: rgba(255,255,255,0.4); font-size: 12px; }
  .imp-result-val { font-weight: 600; font-size: 13px; }

  .imp-stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px; }
  .imp-stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .imp-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
`;

function getScoreClass(s) { return s >= 80 ? "high" : s >= 60 ? "mid" : "low"; }
function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

// ─────────────────────────────────────────
//  SEARCH PAGE
// ─────────────────────────────────────────
function SearchPage() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal]       = useState(0);

  const search = useCallback(async (name) => {
    if (!name.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res = await axios.get(`${API}/voters/search`, { params: { name } });
      setResults(res.data.results);
      setTotal(res.data.totalFound);
    } catch { setResults([]); setTotal(0); }
    finally { setLoading(false); }
  }, []);

  return (
    <>
      <div className="vr-hero">
        <div className="vr-hero-eyebrow"><span>⚡</span> Smart Voter Lookup</div>
        <h1 className="vr-hero-title">Find Any <span>Registered</span> Voter</h1>
        <p className="vr-hero-sub">Fuzzy search with phonetic matching — supports typos, partial names & transliterations</p>
      </div>

      <div className="vr-stats-bar">
        {[{val:"1,24,832",lbl:"Total Voters"},{val:"312",lbl:"Booths"},{val:"Yakutpura",lbl:"Constituency"},{val:"2025",lbl:"Roll Year"}].map((s,i)=>(
          <div key={i} className="vr-stat"><div className="vr-stat-val">{s.val}</div><div className="vr-stat-lbl">{s.lbl}</div></div>
        ))}
      </div>

      <div className="vr-search-card">
        <span className="vr-search-label">Search voter by name</span>
        <div className="vr-search-row">
          <div className="vr-input-wrap">
            <span className="vr-input-icon">🔍</span>
            <input className="vr-input" value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&search(query)}
              placeholder="e.g. Ibrahim, Begum, Reddy, Mohammed..." autoFocus />
          </div>
          <button className="vr-btn" onClick={()=>search(query)} disabled={loading}>
            {loading ? "Searching…" : "Search →"}
          </button>
        </div>
        <div className="vr-hints">
          {["✦ Supports typos","✦ Phonetic match (Mohd = Mohammed)","✦ Partial names","✦ Urdu / Telugu names"].map((h,i)=>(
            <span key={i} className="vr-hint-chip">{h}</span>
          ))}
        </div>
      </div>

      {loading && <div className="vr-loading"><div className="vr-spinner"/>Searching electoral roll…</div>}

      {searched && !loading && total > 0 && (
        <div className="vr-results-meta">
          <span className="vr-results-text">
            Showing <span className="vr-results-count">{results.length}</span> of{" "}
            <span className="vr-results-count">{total}</span> results for "{query}"
          </span>
        </div>
      )}

      {!loading && results.map((r,i)=>(
        <div key={i} className="vr-card">
          <div className="vr-card-left">
            <div className="vr-name">{r.nameOriginal}</div>
            {r.fatherName && <div className="vr-father">Father / Husband: <strong>{r.fatherName}</strong></div>}
            <div className="vr-divider"/>
            <div className="vr-meta-row">
              {r.age         && <div className="vr-meta-item"><span className="vr-meta-label">Age</span><span className="vr-meta-value">{r.age}</span></div>}
              {r.gender      && <div className="vr-meta-item"><span className="vr-meta-label">Gender</span><span className="vr-meta-value">{r.gender}</span></div>}
              {r.district    && <div className="vr-meta-item"><span className="vr-meta-label">District</span><span className="vr-meta-value">{r.district}</span></div>}
              {r.boothNumber && <div className="vr-meta-item"><span className="vr-meta-label">EPIC No.</span><span className="vr-meta-value">{r.boothNumber}</span></div>}
              {r.mandal      && <div className="vr-meta-item"><span className="vr-meta-label">Mandal</span><span className="vr-meta-value">{r.mandal}</span></div>}
              {r.postOffice  && <div className="vr-meta-item"><span className="vr-meta-label">Post Office</span><span className="vr-meta-value">{r.postOffice}</span></div>}
              {r.pinCode     && <div className="vr-meta-item"><span className="vr-meta-label">PIN</span><span className="vr-meta-value">{r.pinCode}</span></div>}
            </div>
            <div className="vr-chips">
              {r.pageNumber     && <span className="vr-chip vr-chip-page">📄 Page {r.pageNumber}</span>}
              {r.serialNumber   && <span className="vr-chip vr-chip-serial"># Serial {r.serialNumber}</span>}
              {r.mandal         && <span className="vr-chip vr-chip-mandal">🏘 {r.mandal}</span>}
              {r.pollingStation && <span className="vr-chip vr-chip-booth">🗳 {r.pollingStation}</span>}
            </div>
          </div>
          <div className="vr-score">
            <div className={`vr-score-ring ${getScoreClass(r.score)}`}>{r.score}%</div>
            <span className="vr-score-label">Match</span>
          </div>
        </div>
      ))}

      {searched && !loading && total === 0 && (
        <div className="vr-empty">
          <div className="vr-empty-icon">🔎</div>
          <div className="vr-empty-title">No voters found</div>
          <div className="vr-empty-sub">Try a different spelling or partial name</div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────
//  IMPORT PAGE
// ─────────────────────────────────────────
function ImportPage() {
  const [files, setFiles]             = useState([]);
  const [district, setDistrict]       = useState("Hyderabad");
  const [state, setState]             = useState("Telangana");
  const [startPage, setStartPage]     = useState(2);        // ✅ lives here, wired to API
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult]           = useState(null);
  const [dbStats, setDbStats]         = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef();

  const loadStats = useCallback(async () => {
    try { const res = await axios.get(`${API}/import/stats`); setDbStats(res.data); } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
    setResult(null);
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleImport = async () => {
    if (!files.length) return;
    setLoading(true); setProgress(0); setResult(null);

    const summary = [];
    let totalInserted = 0, totalParsed = 0, totalSkipped = 0, errors = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressMsg(`Uploading ${file.name} (${i + 1}/${files.length})…`);
      setProgress(Math.round((i / files.length) * 90));

      const form = new FormData();
      form.append("file", file);

      try {
        // ✅ startPage wired — no manual Content-Type header
        const res = await axios.post(
          `${API}/import/pdf?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&startPage=${startPage}`,
          form
        );
        const d = res.data;
        summary.push({ file: file.name, ...d, ok: true });
        totalInserted += d.inserted    || 0;
        totalParsed   += d.totalParsed || 0;
        totalSkipped  += d.skipped     || 0;
      } catch (err) {
        errors++;
        const errMsg = err?.response?.data
          ? (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data))
          : err.message;
        summary.push({ file: file.name, ok: false, error: errMsg });
      }
    }

    setProgress(100);
    setProgressMsg("Done!");
    setResult({ type: errors === files.length ? "error" : "success", totalInserted, totalParsed, totalSkipped, errors, summary });
    setLoading(false);
    loadStats();
  };

  return (
    <>
      <div className="vr-hero">
        <div className="vr-hero-eyebrow"><span>📥</span> PDF Import</div>
        <h1 className="vr-hero-title">Import <span>Electoral Roll</span> PDFs</h1>
        <p className="vr-hero-sub">Upload scanned PDFs — voters are OCR-extracted, deduplicated, and saved to the database</p>
      </div>

      <div className="imp-grid">

        {/* Upload card — full width */}
        <div className="imp-card imp-full">
          <div className="imp-card-title">📂 Select PDF Files</div>
          <div className="imp-card-sub">Drag & drop one or multiple PDFs, or click to browse. Only .pdf files are accepted.</div>
          <div
            className={`imp-dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
            onClick={()=>fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
            <div className="imp-drop-icon">📄</div>
            <div className="imp-drop-title">{dragOver ? "Drop PDFs here" : "Click or drag PDF files here"}</div>
            <div className="imp-drop-sub">Supports multiple files at once</div>
          </div>
          {files.length > 0 && (
            <div className="imp-file-list">
              {files.map(f=>(
                <div key={f.name} className="imp-file-item">
                  <span className="imp-file-icon">📄</span>
                  <span className="imp-file-name">{f.name}</span>
                  <span className="imp-file-size">{formatBytes(f.size)}</span>
                  <button className="imp-file-remove" onClick={()=>removeFile(f.name)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings card */}
        <div className="imp-card">
          <div className="imp-card-title">⚙️ Import Settings</div>
          <div className="imp-card-sub">Stamped on every voter record extracted from the uploaded PDFs.</div>

          <div className="imp-fields">
            <div>
              <span className="imp-field-label">District</span>
              <input className="imp-input" value={district} onChange={e=>setDistrict(e.target.value)} placeholder="e.g. Hyderabad"/>
            </div>
            <div>
              <span className="imp-field-label">State</span>
              <input className="imp-input" value={state} onChange={e=>setState(e.target.value)} placeholder="e.g. Telangana"/>
            </div>
            <div>
              <span className="imp-field-label">Start Page (skip cover pages)</span>
              <input className="imp-input" type="number" min={0} max={10} value={startPage} onChange={e=>setStartPage(Number(e.target.value))}/>
              <div className="imp-hint">Set to 2 for standard electoral rolls — pages 1–2 are cover/index, voter data starts page 3.</div>
            </div>
          </div>

          <button className="vr-btn" style={{width:"100%",padding:"14px"}} onClick={handleImport} disabled={loading||files.length===0}>
            {loading ? "Importing…" : `Import ${files.length||""} PDF${files.length!==1?"s":""} →`}
          </button>

          {loading && (
            <div className="imp-progress-wrap">
              <div className="imp-progress-label"><span>{progressMsg}</span><span>{progress}%</span></div>
              <div className="imp-progress-bar"><div className="imp-progress-fill" style={{width:progress+"%"}}/></div>
            </div>
          )}

          {result && (
            <div className={`imp-result ${result.type}`}>
              <div className="imp-result-title">{result.type==="success"?"✅ Import Complete":"❌ Import Failed"}</div>
              <div className="imp-result-row"><span className="imp-result-key">Total Parsed</span><span className="imp-result-val">{result.totalParsed.toLocaleString()}</span></div>
              <div className="imp-result-row"><span className="imp-result-key">Inserted</span><span className="imp-result-val" style={{color:"#4ade80"}}>{result.totalInserted.toLocaleString()}</span></div>
              <div className="imp-result-row"><span className="imp-result-key">Skipped (duplicates)</span><span className="imp-result-val" style={{color:"#fbbf24"}}>{result.totalSkipped.toLocaleString()}</span></div>
              {result.errors>0 && <div className="imp-result-row"><span className="imp-result-key">Files with errors</span><span className="imp-result-val" style={{color:"#f87171"}}>{result.errors}</span></div>}
              {result.summary?.length>0 && (
                <div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:10}}>
                  {result.summary.map((s,i)=>(
                    <div key={i} style={{fontSize:11.5,color:s.ok?"rgba(255,255,255,0.4)":"#f87171",padding:"3px 0",display:"flex",justifyContent:"space-between",gap:8}}>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.file}</span>
                      <span style={{flexShrink:0}}>{s.ok ? `✓ ${s.inserted} added` : `✗ ${s.error}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DB Stats card */}
        <div className="imp-card">
          <div className="imp-card-title">🗄️ Database Stats</div>
          <div className="imp-card-sub">Current state of the voter database. Refreshes automatically after each import.</div>
          {dbStats ? (
            <>
              <div className="imp-stat-box">
                <div className="imp-stat-num">{dbStats.totalVoters?.toLocaleString()??"—"}</div>
                <div className="imp-stat-lbl">Total Voters in DB</div>
              </div>
              {dbStats.byState?.map((s,i)=>(
                <div key={i} className="imp-result-row">
                  <span className="imp-result-key">{s.state||"Unknown"}</span>
                  <span className="imp-result-val">{s.count?.toLocaleString()}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:13}}>Loading stats…</div>
          )}
          <button className="vr-btn" style={{width:"100%",marginTop:20,padding:"12px",background:"rgba(255,255,255,0.07)",boxShadow:"none",border:"1px solid rgba(255,255,255,0.1)"}} onClick={loadStats}>
            🔄 Refresh Stats
          </button>
        </div>

      </div>
    </>
  );
}

// ─────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("search");
  return (
    <>
      <style>{css}</style>
      <div className="vr-root">
        <div className="vr-topbar">
          <div className="vr-topbar-left">
            <div className="vr-logo-mark">SIR</div>
            <span className="vr-topbar-title">Voter Registry</span>
            <span className="vr-topbar-badge">Yakutpura · Hyderabad</span>
          </div>
          <div className="vr-topbar-meta"><div className="vr-dot-live"/>2025 Electoral Roll</div>
        </div>
        <div className="vr-tabs">
          <button className={`vr-tab${tab==="search"?" active":""}`} onClick={()=>setTab("search")}><span className="vr-tab-icon">🔍</span> Search Voters</button>
          <button className={`vr-tab${tab==="import"?" active":""}`} onClick={()=>setTab("import")}><span className="vr-tab-icon">📥</span> Import PDFs</button>
        </div>
        <div className="vr-main">
          {tab==="search" ? <SearchPage/> : <ImportPage/>}
        </div>
      </div>
    </>
  );
}