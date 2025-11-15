// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Search, TrendingUp, ExternalLink } from "lucide-react";

// ALWAYS use the backend with /api prefix
const API =
  process.env.REACT_APP_BACKEND_URL ||
  "https://stock-news-backend-e3h7.onrender.com/api";

// final tab order
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

function App() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyNews, setCompanyNews] = useState([]);
  const [newsCache, setNewsCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // === DEBOUNCED SEARCH ===
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchCompanies(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchCompanies = async (q) => {
    try {
      const res = await axios.get(`${API}/companies/search`, {
        params: { q }
      });
      setSuggestions(res.data || []);
      setShowSuggestions(true);
    } catch (e) {
      console.error("search error", e);
    }
  };

  const handleCompanySelect = async (companyName) => {
    setSelectedCompany(companyName);
    setSearchQuery(companyName);
    setShowSuggestions(false);
    setLoading(true);

    try {
      const res = await axios.get(
        `${API}/news/company/${encodeURIComponent(companyName)}`
      );
      setCompanyNews(res.data.news || []);
    } catch (e) {
      console.error("company fetch error", e);
      setCompanyNews([]);
    } finally {
      setLoading(false);
    }
  };

  // === FETCH TABS CACHE-FIRST ===
  const fetchTabNews = useCallback(
    async (tabKey) => {
      if (newsCache[tabKey] && newsCache[tabKey].length > 0) return;

      setLoading(true);

      try {
        let endpoint;

        if (tabKey === "ALL") endpoint = `${API}/news/all`;
        else if (tabKey === "RESULTS") endpoint = `${API}/news/results`;
        else if (tabKey === "PENNY") endpoint = `${API}/news/sector/penny`;
        else if (tabKey === "LARGE CAP")
          endpoint = `${API}/news/sector/largecap`;
        else endpoint = `${API}/news/sector/${tabKey.toLowerCase()}`;

        const res = await axios.get(endpoint);
        setNewsCache((prev) => ({ ...prev, [tabKey]: res.data.news }));
      } catch (e) {
        console.error("fetch tab error", e);
        setNewsCache((prev) => ({ ...prev, [tabKey]: [] }));
      } finally {
        setLoading(false);
      }
    },
    [newsCache]
  );

  useEffect(() => {
    if (!selectedCompany) fetchTabNews(activeTab);
  }, [activeTab, selectedCompany, fetchTabNews]);

  // === MANUAL REFRESH ===
  const refreshActiveTab = async () => {
    setLoading(true);
    try {
      let endpoint;

      if (activeTab === "ALL") endpoint = `${API}/news/all`;
      else if (activeTab === "RESULTS") endpoint = `${API}/news/results`;
      else if (activeTab === "PENNY") endpoint = `${API}/news/sector/penny`;
      else if (activeTab === "LARGE CAP")
        endpoint = `${API}/news/sector/largecap`;
      else endpoint = `${API}/news/sector/${activeTab.toLowerCase()}`;

      const res = await axios.get(endpoint);
      setNewsCache((prev) => ({ ...prev, [activeTab]: res.data.news }));
    } catch (e) {
      console.error("refresh error", e);
    } finally {
      setLoading(false);
    }
  };

  // === UI UTIL HANDLERS ===
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCompany(null);
    setCompanyNews([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getCurrentNews = () => {
    if (selectedCompany) return companyNews;
    return newsCache[activeTab] || [];
  };

  const newsItems = getCurrentNews();

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* HEADER */}
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <TrendingUp className="logo-icon" size={32} />
              <h1 className="logo-text">Indian Stock Market News</h1>
            </div>
            <p className="subtitle">
              Real-time market news · Cache-first · Results-focused
            </p>
          </div>
        </header>

        {/* SEARCH */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              className="search-input"
              placeholder="Search company (Reliance, TCS...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
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

        {/* TABS */}
        {!selectedCompany && (
          <div className="tabs-container">
            <div className="tabs-scroll">
              {SECTORS.map((t) => (
                <button
                  key={t.key}
                  className={`tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    setSelectedCompany(null);
                  }}
                >
                  {t.label}
                </button>
              ))}

              <button className="tab refresh-tab" onClick={refreshActiveTab}>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="content-section">
          {selectedCompany && (
            <div className="company-header">
              <h2>{selectedCompany}</h2>
              <p>Latest news and updates</p>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : newsItems.length === 0 ? (
            <div className="no-news">
              {selectedCompany
                ? "No news available for this company at the moment."
                : "No news available in this category yet."}
            </div>
          ) : (
            <div className="news-list">
              {newsItems.map((item, i) => {
                const sentiment = (item.sentiment || "neutral").toLowerCase();
                const facts = item.facts || {};

                return (
                  <div key={i} className={`news-card ${sentiment}`}>
                    <div className="news-header">
                      <h3 className="news-title">{item.title}</h3>
                      {item.company && (
                        <span className="company-badge">{item.company}</span>
                      )}
                    </div>

                    {item.summary ? (
                      <p className="news-summary">{item.summary}</p>
                    ) : item.description ? (
                      <p className="news-description">{item.description}</p>
                    ) : null}

                    {facts && Object.keys(facts).length > 0 && (
                      <div className="fact-row">
                        {facts.revenue && (
                          <div className="fact">
                            <strong>Revenue:</strong> {facts.revenue}
                          </div>
                        )}
                        {facts.net_profit && (
                          <div className="fact">
                            <strong>Profit:</strong> {facts.net_profit}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="news-footer">
                      <span className="news-date">
                        {timeAgo(item.pubDate)}
                      </span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="read-more"
                        >
                          Read more <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
