// App.js
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Search, TrendingUp, ExternalLink } from "lucide-react";

const API = "https://stock-news-backend-e3h7.onrender.com/api";

const SECTORS = [
  { key: "ALL", label: "ALL" },
  { key: "INDEX", label: "Index" },
  { key: "FMCG", label: "FMCG" },
  { key: "HEALTH", label: "Health" },
  { key: "IT", label: "IT" },
  { key: "BANKING", label: "Banking" },
  { key: "AUTO", label: "Auto" },
  { key: "METALS", label: "Metals" },
  { key: "ENERGY", label: "Energy" },
  { key: "PSU", label: "PSU" },
  { key: "TELECOM", label: "Telecom" },
  { key: "MIDCAP", label: "Midcap" },
  { key: "SMALLCAP", label: "Smallcap" },
  { key: "FINANCE", label: "Finance" },
  { key: "PENNY", label: "Penny Stocks" }
];

function App() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyNews, setCompanyNews] = useState([]);

  const [newsCache, setNewsCache] = useState({
    ALL: [],
    INDEX: [],
    FMCG: [],
    HEALTH: [],
    IT: [],
    BANKING: [],
    AUTO: [],
    METALS: [],
    ENERGY: [],
    PSU: [],
    TELECOM: [],
    MIDCAP: [],
    SMALLCAP: [],
    FINANCE: [],
    PENNY: []
  });

  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ---------------------------------------
  // Debounce search suggestions
  // ---------------------------------------
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

  // ---------------------------------------
  // Fetch a sector only if not cached
  // ---------------------------------------
  const fetchTabNews = useCallback(
    async (tabKey) => {
      if (newsCache[tabKey] && newsCache[tabKey].length > 0) return;

      setLoading(true);

      try {
        let endpoint = `${API}/news/all`;

        if (tabKey === "PENNY") {
          endpoint = `${API}/news/sector/penny`;
        } else {
          endpoint = `${API}/news/sector/${tabKey.toLowerCase()}`;
        }

        if (tabKey === "ALL") endpoint = `${API}/news/all`;

        const res = await axios.get(endpoint);
        const items = res.data.news || [];

        setNewsCache((prev) => ({
          ...prev,
          [tabKey]: items
        }));
      } catch (e) {
        console.error("fetch tab error", e);
      } finally {
        setLoading(false);
      }
    },
    [newsCache]
  );

  useEffect(() => {
    if (!selectedCompany) {
      fetchTabNews(activeTab);
    }
  }, [activeTab, selectedCompany, fetchTabNews]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCompany(null);
    setCompanyNews([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return d;
    }
  };

  const getCurrentNews = () => {
    if (selectedCompany) return companyNews;
    return newsCache[activeTab] || [];
  };

  const newsItems = getCurrentNews();

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <TrendingUp className="logo-icon" size={32} />
              <h1 className="logo-text">Indian Stock Market News</h1>
            </div>
            <p className="subtitle">Real-time market news (cache-first)</p>
          </div>
        </header>

        {/* Search */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              placeholder="Search company (Reliance, TCS, HDFC...)"
              className="search-input"
            />

            {searchQuery && (
              <button className="clear-btn" onClick={clearSearch}>
                ×
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((s, i) => (
                <div
                  className="suggestion-item"
                  key={i}
                  onClick={() => handleCompanySelect(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        {!selectedCompany && (
          <div className="tabs-container">
            <div className="tabs-scroll">
              {SECTORS.map((s) => (
                <button
                  key={s.key}
                  className={`tab ${activeTab === s.key ? "active" : ""}`}
                  onClick={() => setActiveTab(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* News Content */}
        <div className="content-section">
          {selectedCompany && (
            <div className="company-header">
              <h2>{selectedCompany}</h2>
              <p>Latest news & updates</p>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : newsItems.length === 0 ? (
            <div className="no-news">
              {selectedCompany
                ? "No news available for this company at the moment."
                : "No news in this section yet. Background updater is fetching."}
            </div>
          ) : (
            <div className="news-list">
              {newsItems.map((item, idx) => {
                const sentiment = (item.sentiment || "neutral").toLowerCase();

                return (
                  <div key={idx} className={`news-card ${sentiment}`}>
                    <div className="news-header">
                      <h3 className="news-title">{item.title}</h3>

                      {item.company && (
                        <span className="company-badge">{item.company}</span>
                      )}
                    </div>

                    {item.description && (
                      <p className="news-description">{item.description}</p>
                    )}

                    <div className="news-footer">
                      <span className="news-date">
                        {formatDate(item.pubDate)}
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
