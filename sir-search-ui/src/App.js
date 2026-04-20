import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5237/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0d0f14; min-height: 100vh; }

  .vr-root { min-height: 100vh; background: #0d0f14; color: #e8eaf0; position: relative; overflow-x: hidden; }
  .vr-root::before { content: ''; position: fixed; top: -200px; left: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .vr-root::after  { content: ''; position: fixed; bottom: -150px; right: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%); pointer-events: none; z-index: 0; }

  .vr-topbar { position: relative; z-index: 10; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
  .vr-topbar-left { display: flex; align-items: center; gap: 12px; }
  .vr-logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #fff; box-shadow: 0 0 20px rgba(59,130,246,0.35); }
  .vr-topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; letter-spacing: -0.02em; }
  .vr-topbar-badge { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 500; color: #93c5fd; }
  .vr-topbar-meta { font-size: 12px; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 6px; }
  .vr-dot-live { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .vr-tabs { position: relative; z-index: 10; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 40px; display: flex; gap: 4px; }
  .vr-tab { padding: 14px 20px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; color: rgba(255,255,255,0.35); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; display: flex; align-items: center; gap: 7px; margin-bottom: -1px; }
  .vr-tab:hover { color: rgba(255,255,255,0.65); }
  .vr-tab.active { color: #60a5fa; border-bottom-color: #3b82f6; }

  .vr-main { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 48px 24px 80px; }

  .vr-hero { text-align: center; margin-bottom: 40px; }
  .vr-hero-eyebrow { display: inline-flex; align-items: center; gap: 6px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); border-radius: 20px; padding: 4px 14px; font-size: 11.5px; font-weight: 500; color: #60a5fa; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 18px; }
  .vr-hero-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 38px; color: #fff; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 10px; }
  .vr-hero-title span { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .vr-hero-sub { font-size: 14px; color: rgba(255,255,255,0.4); }

  .vr-stats-bar { display: flex; gap: 1px; margin-bottom: 36px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .vr-stat { flex: 1; background: rgba(255,255,255,0.03); padding: 16px 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.06); transition: background 0.2s; }
  .vr-stat:last-child { border-right: none; }
  .vr-stat:hover { background: rgba(255,255,255,0.05); }
  .vr-stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
  .vr-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

  .vr-search-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 28px 28px 24px; margin-bottom: 28px; backdrop-filter: blur(10px); box-shadow: 0 4px 60px rgba(0,0,0,0.4); position: relative; overflow: hidden; }
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
  .vr-search-status { font-size: 11.5px; color: rgba(255,255,255,0.3); margin-top: 8px; min-height: 16px; }

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
  .vr-chip { display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; cursor: default; }
  .vr-chip-page   { background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }
  .vr-chip-serial { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); color: #c4b5fd; }
  .vr-chip-mandal { background: rgba(34,197,94,0.1);   border: 1px solid rgba(34,197,94,0.2);   color: #86efac; }
  .vr-chip-booth  { background: rgba(251,191,36,0.1);  border: 1px solid rgba(251,191,36,0.2);  color: #fde68a; }
  .vr-chip-copy   { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); cursor: pointer; transition: background 0.15s, color 0.15s; }
  .vr-chip-copy:hover { background: rgba(59,130,246,0.15); color: #93c5fd; border-color: rgba(59,130,246,0.3); }
  .vr-chip-copy.copied { background: rgba(34,197,94,0.12); color: #4ade80; border-color: rgba(34,197,94,0.3); }

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
  .imp-file-item { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; transition: border-color 0.3s; }
  .imp-file-icon { font-size: 18px; flex-shrink: 0; }
  .imp-file-name { font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .imp-file-size { font-size: 11px; color: rgba(255,255,255,0.3); flex-shrink: 0; }
  .imp-file-remove { background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer; font-size: 16px; padding: 0 4px; transition: color 0.15s; }
  .imp-file-remove:hover { color: #f87171; }
  .imp-file-progress { height: 3px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; margin-top: 5px; }
  .imp-file-progress-fill { height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 4px; transition: width 0.5s ease; }
  .imp-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
  .imp-field-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; display: block; }
  .imp-input { width: 100%; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; color: #fff; background: rgba(255,255,255,0.05); transition: border-color 0.2s, box-shadow 0.2s; }
  .imp-input::placeholder { color: rgba(255,255,255,0.2); }
  .imp-input:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .imp-hint { font-size: 11px; color: rgba(255,255,255,0.22); margin-top: 5px; line-height: 1.5; }
  .imp-result { margin-top: 16px; border-radius: 12px; padding: 16px 18px; border: 1px solid; font-size: 13px; line-height: 1.6; }
  .imp-result.success { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); color: #86efac; }
  .imp-result.error   { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.2);  color: #fca5a5; }
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

// ── Copy EPIC chip ──
function CopyChip({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <span className={`vr-chip vr-chip-copy${copied ? " copied" : ""}`} onClick={copy} title="Copy EPIC number">
      {copied ? "Copied" : `Copy ${text}`}
    </span>
  );
}

// ── File status badge ──
function FileStatusBadge({ status, inserted, error, pages }) {
  const processingLabel = pages?.total > 0
    ? `OCR: page ${pages.done} of ${pages.total}`
    : "OCR processing in background…";
  const map = {
    idle:       { icon: "○",  color: "rgba(255,255,255,0.25)", label: "Ready" },
    uploading:  { icon: "⬆",  color: "#60a5fa",               label: "Uploading…" },
    queued:     { icon: "⏳", color: "#a78bfa",               label: "Queued — OCR will start shortly" },
    processing: { icon: "⚙",  color: "#fbbf24",               label: processingLabel },
    done:       { icon: "✓",  color: "#4ade80",               label: `Done — ${inserted ?? 0} voters added to DB` },
    error:      { icon: "✗",  color: "#f87171",               label: error || "Failed" },
  };
  const s = map[status] || map.idle;
  return (
    <span style={{ fontSize: 11.5, color: s.color, display: "flex", alignItems: "center", gap: 5, maxWidth: 300 }}>
      <span style={{ fontSize: 13 }}>{s.icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
      {status === "processing" && (
        <span style={{ width: 10, height: 10, border: "2px solid rgba(251,191,36,0.3)", borderTopColor: "#fbbf24", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
      )}
    </span>
  );
}

// ─────────────────────────────────────────
//  SEARCH PAGE
// ─────────────────────────────────────────
function SearchPage() {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [total, setTotal]           = useState(0);
  const [debouncing, setDebouncing] = useState(false);
  const [liveStats, setLiveStats]   = useState(null);

  // Load live stats from DB on mount
  useEffect(() => {
    axios.get(`${API}/import/stats`)
         .then(r => setLiveStats(r.data))
         .catch(() => {});
  }, []);

  const search = useCallback(async (name) => {
    if (!name.trim()) return;
    setLoading(true); setSearched(true); setDebouncing(false);
    try {
      const res = await axios.get(`${API}/voters/search`, { params: { name } });
      setResults(res.data.results);
      setTotal(res.data.totalFound);
    } catch { setResults([]); setTotal(0); }
    finally { setLoading(false); }
  }, []);

  // Debounced auto-search: fires 500ms after user stops typing (min 3 chars)
  useEffect(() => {
    if (query.trim().length < 3) { setDebouncing(false); return; }
    setDebouncing(true);
    const timer = setTimeout(() => search(query), 500);
    return () => clearTimeout(timer);
  }, [query, search]);

  const stats = [
    { val: liveStats?.totalVoters?.toLocaleString() ?? "—", lbl: "Total Voters" },
    { val: "312",                                            lbl: "Booths" },
    { val: liveStats?.constituency ?? "Hyderabad",          lbl: "Constituency" },
    { val: "2025",                                          lbl: "Roll Year" },
  ];

  return (
    <>
      <div className="vr-hero">
        <div className="vr-hero-eyebrow"><span>⚡</span> Smart Voter Lookup</div>
        <h1 className="vr-hero-title">Find Any <span>Registered</span> Voter</h1>
        <p className="vr-hero-sub">Fuzzy search with phonetic matching — supports typos, partial names & transliterations</p>
      </div>

      <div className="vr-stats-bar">
        {stats.map((s, i) => (
          <div key={i} className="vr-stat">
            <div className="vr-stat-val">{s.val}</div>
            <div className="vr-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

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
          <button className="vr-btn" onClick={() => search(query)} disabled={loading}>
            {loading ? "Searching…" : "Search →"}
          </button>
        </div>
        <div className="vr-search-status">
          {debouncing && !loading && query.length >= 3
            ? "⏳ Searching in 0.5s…"
            : searched && !loading && total > 0
            ? `✓ ${total} result${total !== 1 ? "s" : ""} found`
            : null}
        </div>
        <div className="vr-hints">
          {["✦ Auto-searches as you type","✦ Phonetic match (Mohd = Mohammed)","✦ Partial names","✦ Urdu / Telugu names"].map((h, i) => (
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

      {!loading && results.map((r, i) => (
        <div key={i} className="vr-card">
          <div className="vr-card-left">
            <div className="vr-name">{r.nameOriginal}</div>
            {r.fatherName && <div className="vr-father">Father / Husband: <strong>{r.fatherName}</strong></div>}
            <div className="vr-divider"/>
            <div className="vr-meta-row">
              {r.age         && <div className="vr-meta-item"><span className="vr-meta-label">Age</span><span className="vr-meta-value">{r.age}</span></div>}
              {r.gender      && <div className="vr-meta-item"><span className="vr-meta-label">Gender</span><span className="vr-meta-value">{r.gender}</span></div>}
              {r.district    && <div className="vr-meta-item"><span className="vr-meta-label">District</span><span className="vr-meta-value">{r.district}</span></div>}
              {r.state       && <div className="vr-meta-item"><span className="vr-meta-label">State</span><span className="vr-meta-value">{r.state}</span></div>}
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
              {r.boothNumber    && <CopyChip text={r.boothNumber} />}
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
function ImportPage({ onActiveJobsChange = () => {} }) {
  const [files, setFiles]               = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [district, setDistrict]         = useState("Hyderabad");
  const [state, setState]               = useState("Telangana");
  const [startPage, setStartPage]       = useState(2);
  const [importing, setImporting]       = useState(false);
  const [dbStats, setDbStats]           = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef                    = useRef();
  const pollTimers                      = useRef({});

  const loadStats = useCallback(async () => {
    try { const res = await axios.get(`${API}/import/stats`); setDbStats(res.data); } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { return () => Object.values(pollTimers.current).forEach(clearInterval); }, []);

  useEffect(() => {
    const count = files.filter(f => ["uploading","queued","processing"].includes(fileStatuses[f.name]?.status)).length;
    onActiveJobsChange(count);
  }, [fileStatuses, files, onActiveJobsChange]);

  const setFileStatus = (name, patch) =>
    setFileStatuses(prev => ({ ...prev, [name]: { ...prev[name], ...patch } }));

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const fresh = pdfs.filter(f => !existing.has(f.name));
      setFileStatuses(s => { const n = { ...s }; fresh.forEach(f => { n[f.name] = { status: "idle" }; }); return n; });
      return [...prev, ...fresh];
    });
  };

  const removeFile = (name) => {
    if (pollTimers.current[name]) { clearInterval(pollTimers.current[name]); delete pollTimers.current[name]; }
    setFiles(prev => prev.filter(f => f.name !== name));
    setFileStatuses(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const startPolling = (fileName, jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/import/job/${jobId}`);
        const job = res.data;
        if (job.status === "running") {
          setFileStatus(fileName, {
            status: "processing",
            pages: job.totalPages > 0 ? { done: job.pagesProcessed, total: job.totalPages } : undefined,
          });
        }
        if (job.status === "done") {
          clearInterval(interval); delete pollTimers.current[fileName];
          setFileStatus(fileName, { status: "done", inserted: job.totalInserted, pages: undefined });
          loadStats();
        }
        if (job.status === "error") {
          clearInterval(interval); delete pollTimers.current[fileName];
          setFileStatus(fileName, { status: "error", error: job.error || "OCR failed", pages: undefined });
        }
      } catch {}
    }, 3000);
    pollTimers.current[fileName] = interval;
  };

  const handleImport = async () => {
    if (!files.length || importing) return;
    setImporting(true);
    for (const file of files) {
      const cur = fileStatuses[file.name]?.status;
      if (cur === "queued" || cur === "processing" || cur === "done") continue;
      setFileStatus(file.name, { status: "uploading" });
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await axios.post(
          `${API}/import/pdf?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&startPage=${startPage}`,
          form
        );
        const { jobId } = res.data;
        setFileStatus(file.name, { status: "queued", jobId });
        startPolling(file.name, jobId);
      } catch (err) {
        const errMsg = err?.response?.data
          ? (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data))
          : err.message;
        setFileStatus(file.name, { status: "error", error: errMsg });
      }
    }
    setImporting(false);
  };

  const allDone   = files.length > 0 && files.every(f => ["done","error"].includes(fileStatuses[f.name]?.status));
  const anyBusy   = files.some(f => ["uploading","queued","processing"].includes(fileStatuses[f.name]?.status));
  const doneCount = files.filter(f => fileStatuses[f.name]?.status === "done").length;
  const errCount  = files.filter(f => fileStatuses[f.name]?.status === "error").length;

  return (
    <>
      <div className="vr-hero">
        <div className="vr-hero-eyebrow"><span>📥</span> PDF Import</div>
        <h1 className="vr-hero-title">Import <span>Electoral Roll</span> PDFs</h1>
        <p className="vr-hero-sub">Files are uploaded instantly — OCR runs in the background, page stays fully responsive</p>
      </div>

      <div className="imp-grid">
        <div className="imp-card imp-full">
          <div className="imp-card-title">📂 Select PDF Files</div>
          <div className="imp-card-sub">Drag & drop one or multiple PDFs. Status updates live — switch tabs freely while processing.</div>
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
              {files.map(f => {
                const st = fileStatuses[f.name] || { status: "idle" };
                const canRemove = !["uploading","queued","processing"].includes(st.status);
                const pagesPct = st.pages?.total > 0 ? Math.round((st.pages.done / st.pages.total) * 100) : 0;
                return (
                  <div key={f.name} className="imp-file-item" style={{
                    flexDirection: "column", alignItems: "stretch",
                    borderColor: st.status === "done" ? "rgba(74,222,128,0.25)" :
                                 st.status === "error" ? "rgba(248,113,113,0.25)" :
                                 ["processing","queued"].includes(st.status) ? "rgba(251,191,36,0.2)" :
                                 "rgba(255,255,255,0.08)"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span className="imp-file-icon">
                        {st.status === "done" ? "✅" : st.status === "error" ? "❌" :
                         ["processing","queued"].includes(st.status) ? "⚙️" : "📄"}
                      </span>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="imp-file-name">{f.name}</div>
                        <div style={{marginTop:3}}>
                          <FileStatusBadge status={st.status} inserted={st.inserted} error={st.error} pages={st.pages}/>
                        </div>
                      </div>
                      <span className="imp-file-size">{formatBytes(f.size)}</span>
                      {canRemove && <button className="imp-file-remove" onClick={()=>removeFile(f.name)}>✕</button>}
                    </div>
                    {st.status === "processing" && st.pages?.total > 0 && (
                      <div className="imp-file-progress" style={{marginTop:8}}>
                        <div className="imp-file-progress-fill" style={{width: pagesPct + "%"}}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {allDone && (
            <div style={{marginTop:16,borderRadius:10,padding:"12px 16px",
              background: errCount===files.length?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)",
              border:`1px solid ${errCount===files.length?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"}`,
              fontSize:13,color:errCount===files.length?"#f87171":"#4ade80",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{errCount===files.length?"❌":"✅"}</span>
              <span>
                {doneCount > 0 && `${doneCount} file${doneCount>1?"s":""} processed successfully. `}
                {errCount  > 0 && `${errCount} file${errCount>1?"s":""} failed. `}
                Voters are now available in search.
              </span>
            </div>
          )}
        </div>

        <div className="imp-card">
          <div className="imp-card-title">⚙️ Import Settings</div>
          <div className="imp-card-sub">Stamped on every voter record extracted from the uploaded PDFs.</div>
          <div className="imp-fields">
            <div>
              <span className="imp-field-label">District</span>
              <input className="imp-input" value={district} onChange={e=>setDistrict(e.target.value)} placeholder="e.g. Hyderabad" disabled={anyBusy}/>
            </div>
            <div>
              <span className="imp-field-label">State</span>
              <input className="imp-input" value={state} onChange={e=>setState(e.target.value)} placeholder="e.g. Telangana" disabled={anyBusy}/>
            </div>
            <div>
              <span className="imp-field-label">Start Page (skip cover pages)</span>
              <input className="imp-input" type="number" min={0} max={10} value={startPage} onChange={e=>setStartPage(Number(e.target.value))} disabled={anyBusy}/>
              <div className="imp-hint">Set to 2 for standard electoral rolls — pages 1–2 are cover/index, voter data starts page 3.</div>
            </div>
          </div>
          <button className="vr-btn" style={{width:"100%",padding:"14px"}} onClick={handleImport}
            disabled={importing||files.length===0||files.every(f=>["queued","processing","done"].includes(fileStatuses[f.name]?.status))}>
            {importing?"Uploading…":anyBusy?"⚙ Processing in background…":`Import ${files.filter(f=>!["done","queued","processing"].includes(fileStatuses[f.name]?.status)).length||files.length} PDF${files.length!==1?"s":""} →`}
          </button>
          {anyBusy && (
            <div style={{marginTop:14,padding:"12px 14px",background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.18)",borderRadius:10,fontSize:12.5,color:"#fbbf24",lineHeight:1.6}}>
              <strong>⚙ OCR running in background</strong><br/>
              You can freely browse, search voters, or switch tabs — processing continues on the server and updates every 3 seconds.
            </div>
          )}
        </div>

        <div className="imp-card">
          <div className="imp-card-title">🗄️ Database Stats</div>
          <div className="imp-card-sub">Refreshes automatically as each file finishes processing.</div>
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
          ) : <div style={{color:"rgba(255,255,255,0.3)",fontSize:13}}>Loading stats…</div>}
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
  const [tab, setTab]               = useState("search");
  const [activeJobs, setActiveJobs] = useState(0);

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
          <div className="vr-topbar-meta">
            {activeJobs > 0 ? (
              <span style={{display:"flex",alignItems:"center",gap:6,color:"#fbbf24"}}>
                <span style={{width:8,height:8,border:"2px solid rgba(251,191,36,0.3)",borderTopColor:"#fbbf24",borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
                {activeJobs} file{activeJobs>1?"s":""} processing
              </span>
            ) : (
              <><div className="vr-dot-live"/>2025 Electoral Roll</>
            )}
          </div>
        </div>

        {activeJobs > 0 && (
          <div style={{background:"rgba(251,191,36,0.05)",borderBottom:"1px solid rgba(251,191,36,0.14)",padding:"9px 40px",fontSize:12.5,color:"#fbbf24",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:9}}>
            <span style={{width:10,height:10,border:"2px solid rgba(251,191,36,0.25)",borderTopColor:"#fbbf24",borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
            <span><strong>{activeJobs} PDF{activeJobs>1?"s":""} processing in background</strong>{" "}— search works normally, nothing will freeze or stop.</span>
            <button onClick={()=>setTab("import")} style={{marginLeft:"auto",background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.28)",borderRadius:6,padding:"3px 10px",color:"#fbbf24",cursor:"pointer",fontSize:11.5,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
              View progress →
            </button>
          </div>
        )}

        <div className="vr-tabs">
          <button className={`vr-tab${tab==="search"?" active":""}`} onClick={()=>setTab("search")}>
            <span className="vr-tab-icon">🔍</span> Search Voters
          </button>
          <button className={`vr-tab${tab==="import"?" active":""}`} onClick={()=>setTab("import")}>
            <span className="vr-tab-icon">📥</span> Import PDFs
            {activeJobs > 0 && (
              <span style={{background:"rgba(251,191,36,0.18)",border:"1px solid rgba(251,191,36,0.32)",borderRadius:10,padding:"1px 7px",fontSize:10.5,color:"#fbbf24",marginLeft:2}}>
                {activeJobs} running
              </span>
            )}
          </button>
        </div>

        <div className="vr-main">
          {tab==="search" ? <SearchPage/> : <ImportPage onActiveJobsChange={setActiveJobs}/>}
        </div>
      </div>
    </>
  );
}