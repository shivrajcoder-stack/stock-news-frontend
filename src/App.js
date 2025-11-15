import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import { Search, TrendingUp, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
    <div className="app-container" data-testid="app-container">
      <div className="app-wrapper">
        {/* Header */}
        <header className="header" data-testid="header">
          <div className="header-content">
            <div className="logo-section">
              <TrendingUp className="logo-icon" size={32} />
              <h1 className="logo-text">Indian Stock Market News</h1>
            </div>
            <p className="subtitle">Real-time market news from 4000+ Indian companies</p>
          </div>
        </header>

        {/* Search Section */}
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
              <button
                className="clear-btn"
                onClick={handleClearSearch}
                data-testid="clear-search-btn"
              >
                ×
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown" data-testid="suggestions-dropdown">
              {suggestions.map((company, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleCompanySelect(company)}
                  data-testid={`suggestion-item-${index}`}
                >
                  {company}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        {!selectedCompany && (
          <div className="tabs-container" data-testid="tabs-container">
            {['ALL', 'FMCG', 'HEALTH'].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab.toLowerCase()}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* News Content */}
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
                : 'No news available in this category. The background updater is fetching news from 4000+ companies. Please check back in a few minutes.'}
            </div>
          ) : (
            <div className="news-list" data-testid="news-list">
              {newsItems.map((item, index) => (
                <div key={index} className="news-card" data-testid={`news-card-${index}`}>
                  <div className="news-header">
                    <h3 className="news-title">{item.title}</h3>
                    {item.company && (
                      <span className="company-badge" data-testid={`company-badge-${index}`}>
                        {item.company}
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="news-description">{item.description}</p>
                  )}
                  
                  <div className="news-footer">
                    <span className="news-date">{formatDate(item.pubDate)}</span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="read-more-link"
                        data-testid={`read-more-link-${index}`}
                      >
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
