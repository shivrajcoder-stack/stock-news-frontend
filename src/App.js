import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Search, TrendingUp, ExternalLink } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "https://stock-news-backend-e3h7.onrender.com/api";

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

  // ------------------------------
  // SEARCH
  // ------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchCompanies(searchQuery);
      } else {
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
    } catch (err) {
      console.error("search error", err);
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
    } catch (err) {
      console.error("company fetch error", err);
      setCompanyNews([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // TAB NEWS FETCH
  // ------------------------------
  const fetchTabNews = useCallback(async (tabKey) => {
    if (newsCache[tabKey]?.length > 0) return;

    setLoading(true);
    try {
  let endpoint = `${API}/news/all`;


     if (tabKey === "RESULTS") endpoint = `${API}/news/results`;

      else if (tabKey === "PENNY") endpoint = `${API}/news/sector/penny`;
      else if (tabKey === "LARGE CAP") endpoint = `${API}/news/sector/largecap`;
      else if (tabKey !== "ALL") endpoint = `${API}/news/sector/${tabKey.toLowerCase()}`;

      const res = await axios.get(endpoint);
      setNewsCache((prev) => ({ ...prev, [tabKey]: res.data.news || [] }));
    } catch (err) {
      console.error("fetch tab error", err);
      setNewsCache((prev) => ({ ...prev, [tabKey]: [] }));
    } finally {
      setLoading(false);
    }
  }, [newsCache]);

  useEffect(() => {
    if (!selectedCompany) fetchTabNews(activeTab);
  }, [activeTab, selectedCompany, fetchTabNews]);

  const refreshActiveTab = async () => {
    setLoading(true);

    try {
     let endpoint = `${API}/news/all`;


     if (activeTab === "RESULTS") endpoint = `${API}/news/results`;

      else if (activeTab === "PENNY") endpoint = `${API}/news/sector/penny`;
      else if (activeTab === "LARGE CAP") endpoint = `${API}/news/sector/largecap`;
      else if (activeTab !== "ALL") endpoint = `${API}/news/sector/${activeTab.toLowerCase()}`;

      const res = await axios.get(endpoint);
      setNewsCache((prev) => ({ ...prev, [activeTab]: res.data.news || [] }));
    } catch (err) {
      console.error("refresh error", err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCompany(null);
    setCompanyNews([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getCurrentNews = () =>
    selectedCompany ? companyNews : newsCache[activeTab] || [];

  const newsItems = getCurrentNews();

  // ------------------------------
  // UI
  // ------------------------------
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

        {/* Search */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />

            <input
              className="search-input"
              placeholder="Search for a company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
            />

            {searchQuery && (
              <button className="clear-btn" onClick={clearSearch}>×</button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((c, i) => (
                <div key={i} className="suggestion-item" onClick={() => handleCompanySelect(c)}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
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
              <button className="tab refresh-tab" onClick={refreshActiveTab}>Refresh</button>
            </div>
          </div>
        )}

        {/* News */}
        <div className="content-section">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : newsItems.length === 0 ? (
            <div className="no-news">No news available.</div>
          ) : (
            <div className="news-list">
              {newsItems.map((item, idx) => (
                <div key={idx} className={`news-card ${item.sentiment || "neutral"}`}>
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
                    <span className="news-date">{timeAgo(item.pubDate)}</span>
                    {item.link && (
                      <a className="read-more" href={item.link} target="_blank" rel="noreferrer">
                        Read more <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div> 
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
