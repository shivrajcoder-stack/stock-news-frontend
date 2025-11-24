import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import {
  Search,
  TrendingUp,
  ExternalLink,
  TrendingDown,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Backend URL (auto add /api)
const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://stock-news-backend-e3h7.onrender.com";

const API = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

const SECTORS = [
  { key: "ALL", label: "ALL" },
  { key: "RESULTS", label: "RESULTS" },
  { key: "PENNY", label: "PENNY" },
  { key: "LARGE CAP", label: "LARGE CAP" },
  { key: "MIDCAP", label: "MIDCAP" },
  { key: "SMALLCAP", label: "SMALLCAP" },
  { key: "FMCG", label: "FMCG" },
  { key: "IT", label: "IT" },
  { key: "BANKING", label: "BANKING" },
  { key: "AUTO", label: "AUTO" },
  { key: "ENERGY", label: "ENERGY" },
  { key: "PSU", label: "PSU" },
  { key: "TELECOM", label: "TELECOM" }
];

// Format time
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

// Sentiment mapping
function mapSentiment(s) {
  if (!s) return "neutral";
  const x = s.toString().toLowerCase();
  const good = ["good", "positive", "bull", "up", "buy", "green"];
  const bad = ["bad", "negative", "bear", "down", "sell", "red"];
  if (good.some((g) => x.includes(g))) return "good";
  if (bad.some((g) => x.includes(g))) return "bad";
  return "neutral";
}

// Auto-summary
function autoSummary(text, maxWords = 28) {
  if (!text) return "";
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

// News Card Component
function NewsCard({ item }) {
  const sentiment = mapSentiment(item.sentiment || item.tag || "");
  const sector =
    item.sector ||
    item.category ||
    (item.tags && item.tags.length ? item.tags[0] : "") ||
    "GENERAL";

  const description =
    item.summary?.trim() ||
    item.description?.trim() ||
    autoSummary(item.title, 28);

  const leftIcon =
    sentiment === "good" ? (
      <TrendingUp size={18} />
    ) : sentiment === "bad" ? (
      <TrendingDown size={18} />
    ) : (
      <TrendingUp size={18} />
    );

  return (
    <div className={`news-card ${sentiment}`}>
      <div className="news-card-inner">
        <div className="news-left">
          <div className={`left-icon ${sentiment}`}>{leftIcon}</div>

          <div className="micro-tags">
            <div className="sector-pill">{sector}</div>
            <div className={`sentiment-badge ${sentiment}`}>
              {sentiment === "good" ? (
                <>
                  <CheckCircle size={14} /> <span>Good News</span>
                </>
              ) : sentiment === "bad" ? (
                <>
                  <XCircle size={14} /> <span>Bad News</span>
                </>
              ) : (
                <span>Neutral</span>
              )}
            </div>
          </div>
        </div>

        <div className="news-body">
          <div className="news-header">
            <h3 className="news-title">{item.title}</h3>
            <div className="meta-right">
              <span className="news-date">{timeAgo(item.pubDate)}</span>
            </div>
          </div>

          {description && (
            <p className="news-description">{description}</p>
          )}

          <div className="news-footer">
            <div className="footer-left">
              {item.company && (
                <span className="company-badge-small">{item.company}</span>
              )}
            </div>

            <div className="footer-right">
              {item.link && (
                <a
                  className="read-more"
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read more <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyNews, setCompanyNews] = useState([]);
  const [newsCache, setNewsCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) searchCompanies(searchQuery);
      else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchCompanies = async (q) => {
    try {
      const res = await axios.get(`${API}/companies/search`, { params: { q } });
      setSuggestions(res.data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    setSearchQuery(company);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/news/company/${encodeURIComponent(company)}`);
      setCompanyNews(res.data.news || []);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tab news
  const fetchTabNews = useCallback(
    async (tabKey) => {
      if (newsCache[tabKey]) return;

      setLoading(true);
      try {
        let endpoint =
          tabKey === "ALL"
            ? `${API}/news/all?include_indexes=true`
            : tabKey === "RESULTS"
            ? `${API}/news/results`
            : tabKey === "PENNY"
            ? `${API}/news/sector/penny`
            : tabKey === "LARGE CAP"
            ? `${API}/news/sector/largecap`
            : `${API}/news/sector/${tabKey.toLowerCase()}`;

        const res = await axios.get(endpoint);

        if (res.data.sections) {
          const flat = [
            ...(res.data.sections.indexes || []),
            ...(res.data.sections.largecap || []),
            ...(res.data.sections.general || []),
          ];
          setNewsCache((prev) => ({
            ...prev,
            [tabKey]: { news: flat, sections: res.data.sections },
          }));
        } else {
          setNewsCache((prev) => ({
            ...prev,
            [tabKey]: { news: res.data.news || [], sections: null },
          }));
        }
      } finally {
        setLoading(false);
      }
    },
    [newsCache]
  );

  useEffect(() => {
    if (!selectedCompany) fetchTabNews(activeTab);
  }, [activeTab, selectedCompany, fetchTabNews]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCompany(null);
    setCompanyNews([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const cacheForActive = newsCache[activeTab] || { news: [], sections: null };
  const newsItems = selectedCompany ? companyNews : cacheForActive.news;
  const sections = selectedCompany ? null : cacheForActive.sections;

  const SectionHeader = ({ title }) => (
    <h2 className="section-header">{title}</h2>
  );

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <header className="header">
          <div className="logo-section">
            <TrendingUp className="logo-icon" size={32} />
            <h1 className="logo-text">Indian Stock Market News</h1>
          </div>
          <p className="subtitle">Real-time · Impact-first · Fast</p>
        </header>

        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              className="search-input"
              placeholder="Search for a company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={clearSearch}>
                ×
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((c, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleCompanySelect(c)}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {!selectedCompany && (
          <div className="tabs-container">
            <div className="tabs-scroll">
              {SECTORS.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="content-section">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : selectedCompany ? (
            <div className="news-list">
              {companyNews.map((item, idx) => (
                <NewsCard key={idx} item={item} />
              ))}
            </div>
          ) : sections ? (
            <div className="news-list">
              {sections.indexes?.length > 0 && (
                <>
                  <SectionHeader title="Index & Market-wide News" />
                  {sections.indexes.map((item, i) => (
                    <NewsCard key={`i-${i}`} item={item} />
                  ))}
                </>
              )}

              {sections.largecap?.length > 0 && (
                <>
                  <SectionHeader title="Large-cap / Famous Stocks" />
                  {sections.largecap.map((item, i) => (
                    <NewsCard key={`l-${i}`} item={item} />
                  ))}
                </>
              )}

              {sections.general?.length > 0 && (
                <>
                  <SectionHeader title="General Indian Market News" />
                  {sections.general.map((item, i) => (
                    <NewsCard key={`g-${i}`} item={item} />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="news-list">
              {newsItems.map((item, idx) => (
                <NewsCard key={idx} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
