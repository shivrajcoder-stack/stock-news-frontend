import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import { Search, TrendingUp, ExternalLink } from 'lucide-react';

const API = "https://stock-news-backend-e3h7.onrender.com/api";

function App() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyNews, setCompanyNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [fmcgNews, setFmcgNews] = useState([]);
  const [healthNews, setHealthNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchCompanies(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchCompanies = async (query) => {
    try {
      const response = await axios.get(`${API}/companies/search`, {
        params: { q: query }
      });
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching companies:', error);
    }
  };

  const handleCompanySelect = async (companyName) => {
    setSelectedCompany(companyName);
    setSearchQuery(companyName);
    setShowSuggestions(false);
    setLoading(true);

    try {
      const response = await axios.get(`${API}/news/company/${encodeURIComponent(companyName)}`);
      setCompanyNews(response.data.news || []);
    } catch (error) {
      console.error('Error fetching company news:', error);
      setCompanyNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabNews = useCallback(async (tab) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch(tab) {
        case 'ALL':
          endpoint = `${API}/news/all`;
          break;
        case 'FMCG':
          endpoint = `${API}/news/sector/fmcg`;
          break;
        case 'HEALTH':
          endpoint = `${API}/news/sector/health`;
          break;
        default:
          endpoint = `${API}/news/all`;
      }

      const response = await axios.get(endpoint);
      
      if (tab === 'ALL') {
        setAllNews(response.data.news || []);
      } else if (tab === 'FMCG') {
        setFmcgNews(response.data.news || []);
      } else if (tab === 'HEALTH') {
        setHealthNews(response.data.news || []);
      }
    } catch (error) {
      console.error(`Error fetching ${tab} news:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      fetchTabNews(activeTab);
    }
  }, [activeTab, selectedCompany, fetchTabNews]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCompany(null);
    setCompanyNews([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getCurrentNews = () => {
    if (selectedCompany) {
      return companyNews;
    }
    
    switch(activeTab) {
      case 'ALL':
        return allNews;
      case 'FMCG':
        return fmcgNews;
      case 'HEALTH':
        return healthNews;
      default:
        return [];
    }
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
            <p className="subtitle">Real-time market news from 4000+ Indian companies</p>
          </div>
        </header>

        {/* SEARCH SECTION */}
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search for a company... (e.g., Reliance, TCS, HDFC)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={handleClearSearch}>×</button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((company, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleCompanySelect(company)}
                >
                  {company}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABS */}
        {!selectedCompany && (
          <div className="tabs-container">
            {['ALL', 'FMCG', 'HEALTH'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* NEWS LIST */}
        <div className="content-section">

          {selectedCompany && (
            <div className="company-header">
              <h2>{selectedCompany}</h2>
              <p>Latest news and updates</p>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading news...</div>
          ) : newsItems.length === 0 ? (
            <div className="no-news">
              {selectedCompany 
                ? "No news available for this company."
                : "Background updater is fetching news. Please check later."}
            </div>
          ) : (
            <div className="news-list">
              
              {newsItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`news-card ${item.sentiment || "neutral"}`}
                >
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
                    <span className="news-date">{formatDate(item.pubDate)}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="read-more-link"
                    >
                      Read more <ExternalLink size={14} />
                    </a>
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
