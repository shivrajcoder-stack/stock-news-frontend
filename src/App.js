// App.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { TrendingUp, ExternalLink, Search } from "lucide-react";
import "./App.css";

const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = BACKEND_BASE_URL.endsWith("/api") ? BACKEND_BASE_URL : `${BACKEND_BASE_URL}/api`;

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsCard({ item }) {
  const desc = item.description || item.summary || item.raw_text || "";
  const sentiment = (item.sentiment || "").toLowerCase();
  return (
    <div className={`news-card ${sentiment}`}>
      <div className="news-left"><TrendingUp size={18} /></div>
      <div className="news-body">
        <div className="news-title">{item.title}</div>
        <div className="meta">
          <span className="company">{item.company}</span>
          <span className="pub">{timeAgo(item.pubDate)}</span>
          <span className={`sent ${sentiment}`}>{sentiment || "neutral"}</span>
        </div>
        {desc && <div className="desc">{desc}</div>}
        <div className="actions">
          {item.link && <a href={item.link} target="_blank" rel="noreferrer">Read <ExternalLink size={12} /></a>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [indexes, setIndexes] = useState([]);
  const [largecap, setLargecap] = useState([]);
  const [general, setGeneral] = useState([]);
  const [loading, setLoading] = useState(false);

  // search / company view
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [companyNews, setCompanyNews] = useState(null);

  const fetchAllSections = useCallback(async () => {
    setLoading(true);
    try {
      const [idxRes, lcRes, genRes] = await Promise.all([
        axios.get(`${API}/news/indexes`),
        axios.get(`${API}/news/largecap`),
        axios.get(`${API}/news/general`),
      ]);
      setIndexes(idxRes.data.news || []);
      setLargecap(lcRes.data.news || []);
      setGeneral(genRes.data.news || []);
    } catch (err) {
      console.error("fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSections();
    // refresh every 2 minutes while the app is open (optional)
    const id = setInterval(fetchAllSections, 120000);
    return () => clearInterval(id);
  }, [fetchAllSections]);

  // search companies (simple)
  useEffect(() => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/companies/search`, { params: { q } });
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 260);
    return () => clearTimeout(t);
  }, [q]);

  const selectCompany = async (name) => {
    setQ(name);
    setSuggestions([]);
    try {
      setLoading(true);
      const res = await axios.get(`${API}/news/company/${encodeURIComponent(name)}`);
      setCompanyNews(res.data.news || []);
    } catch (err) {
      console.error("company fetch err", err);
      setCompanyNews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand"><TrendingUp size={28} /> <h1>Indian Stock News</h1></div>
        <div className="search">
          <Search size={14} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setCompanyNews(null); }} placeholder="Search company (e.g., Reliance Industries Limited)" />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.slice(0,6).map((s, i) => <div key={i} onClick={() => selectCompany(s)}>{s}</div>)}
            </div>
          )}
        </div>
        <div className="refresh">
          <button onClick={fetchAllSections}>Refresh</button>
        </div>
      </header>

      <main className="content">
        {loading && <div className="loading">Loading...</div>}

        {companyNews ? (
          <section>
            <h2>News for: {q}</h2>
            {companyNews.length === 0 ? <div>No news</div> : companyNews.map((n,i) => <NewsCard key={i} item={n} />)}
          </section>
        ) : (
          <>
            <section>
              <h2>Index & Market-wide (Nifty / Sensex / BankNifty)</h2>
              {indexes.length === 0 ? <div>No index news yet</div> : indexes.map((n,i) => <NewsCard key={`idx-${i}`} item={n} />)}
            </section>

            <section>
              <h2>Large-cap / Famous Stocks</h2>
              {largecap.length === 0 ? <div>No largecap news yet</div> : largecap.map((n,i) => <NewsCard key={`lc-${i}`} item={n} />)}
            </section>

            <section>
              <h2>General Indian Market News</h2>
              {general.length === 0 ? <div>No general news yet</div> : general.map((n,i) => <NewsCard key={`g-${i}`} item={n} />)}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
