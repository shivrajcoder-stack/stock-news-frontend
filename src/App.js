// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Search, TrendingUp, ExternalLink } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "https://stock-news-backend-e3h7.onrender.com/api";

// locked tab order (final)
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

  // Debounced search suggestions
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
      const res = await axios.get(`${API}/companies/search`, { params: { q } });
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
      const res = await axios.get(`${API}/news/company/${encodeURIComponent(companyName)}`);
      setCompanyNews(res.data.news || []);
    } catch (e) {
      console.error("company fetch error", e);
      setCompanyNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tab news only once (cache-first)
  const fetchTabNews = useCallback(async (tabKey) => {
    // if we already have data and it's not empty, keep it (instant)
    if (newsCache[tabKey] && newsCache[tabKey].length > 0) return;

    setLoading(true);
    try {
      let endpoint = `${API}/news/all`;
      if (tabKey === "RESULTS") endpoint = `${API}/news/results`;
      else if (tabKey === "PENNY") endpoint = `${API}/news/sector/penny`;
      else if (tabKey === "LARGE CAP") endpoint = `${API}/news/sector/largecap`;
      else endpoint = `${API}/news/sector/${tabKey.toLowerCase()}`;

      if (tabKey === "ALL") endpoint = `${API}/news/all`;

      const res = await axios.get(endpoint);
      const items = res.data.news || [];
      setNewsCache(prev => ({ ...prev, [tabKey]: items }));
    } catch (e) {
      console.error("fetch tab error", e);
      setNewsCache(prev => ({ ...prev, [tabKey]: [] }));
    } finally {
      setLoading(false);
    }
  }, [newsCache]);

  useEffect(() => {
    if (!selectedCompany) {
      fetchTabNews(activeTab);
    }
  }, [activeTab, selectedCompany, fetchTabNews]);

  // keep results updated when user refreshes tab (option: churn on refresh)
  const refreshActiveTab = async () => {
    setLoading(true);
    try {
      const tabKey = activeTab;
      let endpoint = `${API}/news/all`;
      if (tabKey === "RESULTS") endpoint = `${API}/news/results`;
      else if (tabKey === "PENNY") endpoint = `${API}/news/sector/penny`;
      else if (tabKey === "LARGE CAP") endpoint = `${API}/news/sector/largecap`;
      else endpoint = `${API}/news/sector/${tabKey.toLowerCase()}`;
      if (tabKey === "ALL") endpoint = `${API}/news/all`;

      const res = await axios.get(endpoint);
      const items = res.data.news || [];
      setNewsCache(prev => ({ ...prev, [tabKey]: items }));
    } catch (e) {
      console.error("refresh error", e);
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

  const formatDate = (d) => {
    try {
      return timeAgo(d);
    } catch {
      return d;
    }
  };

  const getCurrentNews = () => {
    if (selectedCompany) return companyNews;
    return newsCache[activeTab] || [];
  };

  const newsItems = getCurrentNews();

  return (
    <div className="app-container" data-testid="app-container">
      <div className="app-wrapper">
        <header className="header" data-testid="header">
          <div className="header-content">
            <div className="logo-section">
              <TrendingUp className="logo-icon" size={32} />
              <h1 className="logo-text">Indian Stock Market News</h1>
            </div>
            <p className="subtitle">Real-time market news · Cache-first · Results-focused</p>
          </div>
        </header>

        <div className="search-section" data-testid="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search for a company... (e.g., Reliance, TCS, HDFC)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              data-testid="search-input"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={clearSearch} data-testid="clear-search-btn">×</button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown" data-testid="suggestions-dropdown">
              {suggestions.map((company, index) => (
                <div key={index} className="suggestion-item" onClick={() => handleCompanySelect(company)} data-testid={`suggestion-item-${index}`}>
                  {company}
                </div>
              ))}
            </div>
          )}
        </div>

        {!selectedCompany && (
          <div className="tabs-container" data-testid="tabs-container">
            <div className="tabs-scroll">
              {SECTORS.map((tab) => (
                <button
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => { setActiveTab(tab.key); setSelectedCompany(null); }}
                >
                  {tab.label}
                </button>
              ))}
              <button className="tab refresh-tab" onClick={refreshActiveTab}>Refresh</button>
            </div>
          </div>
        )}

        <div className="content-section" data-testid="content-section">
          {selectedCompany && (
            <div className="company-header" data-testid="company-header">
              <h2>{selectedCompany}</h2>
              <p>Latest news and updates</p>
            </div>
          )}

          {loading ? (
            <div className="loading" data-testid="loading-indicator">Loading news...</div>
          ) : newsItems.length === 0 ? (
            <div className="no-news" data-testid="no-news-message">
              {selectedCompany 
                ? 'No news available for this company at the moment.'
                : 'No news available in this category yet. Background updater is fetching.'}
            </div>
          ) : (
            <div className="news-list" data-testid="news-list">
              {newsItems.map((item, index) => {
                const sentiment = (item.sentiment || "neutral").toLowerCase();
                // structured facts if present
                const facts = item.facts || {};
                return (
                  <div key={index} className={`news-card ${sentiment}`} data-testid={`news-card-${index}`}>
                    <div className="news-header">
                      <h3 className="news-title">{item.title}</h3>
                      {item.company && <span className="company-badge">{item.company}</span>}
                    </div>

                    {/* Micro tags (results / dividend / buyback / guidance) */}
                    <div className="micro-tags">
                      { (item.summary && item.summary.length>0) && <span className="micro-tag">Quick</span> }
                      { isFinite(facts && Object.keys(facts).length) && Object.keys(facts).length > 0 && <span className="micro-tag">Data</span> }
                      { item.title && /dividend|payout|interim|final/i.test(item.title) && <span className="micro-tag">Dividend</span> }
                      { item.title && /buyback|repurchase/i.test(item.title) && <span className="micro-tag">Buyback</span> }
                      { isFinite(item.mentioned_companies && item.mentioned_companies.length) && (item.mentioned_companies || []).length > 0 && <span className="micro-tag">Mentions</span> }
                    </div>

                    {/* Summary / extracted facts */}
                    {item.summary ? (
                      <p className="news-summary">{item.summary}</p>
                    ) : item.description ? (
                      <p className="news-description">{item.description}</p>
                    ) : null}

                    {/* Show extracted key facts inline (if present) */}
                    {facts && Object.keys(facts).length > 0 && (
                      <div className="fact-row">
                        {facts.revenue && <div className="fact"><strong>Revenue:</strong> {facts.revenue}</div>}
                        {facts.net_profit && <div className="fact"><strong>Profit:</strong> {facts.net_profit}</div>}
                        {facts.eps && <div className="fact"><strong>EPS:</strong> {facts.eps}</div>}
                        {facts.dividend && <div className="fact"><strong>Dividend:</strong> {facts.dividend}</div>}
                        {facts.buyback_amount && <div className="fact"><strong>Buyback:</strong> {facts.buyback_amount}</div>}
                      </div>
                    )}

                    <div className="news-footer">
                      <span className="news-date">{formatDate(item.pubDate) || timeAgo(item.pubDate)}</span>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more">
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
