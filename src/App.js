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

// ----------------------------------------------------------------------
// FIX APPLIED HERE: Guarantee the API URL includes '/api'
// ----------------------------------------------------------------------
const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://stock-news-backend-e3h7.onrender.com";

const API = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;
// ----------------------------------------------------------------------

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
  { key: "TELECOM", label: "TELECOM" },
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

/**
 * Map a raw sentiment string to 'good' | 'bad' | 'neutral'
 */
function mapSentiment(s) {
  if (!s) return "neutral";
  const x = s.toString().toLowerCase();
  const good = ["good", "positive", "bull", "up", "buy", "green"];
  const bad = ["bad", "negative", "bear", "down", "sell", "red"];
  if (good.some((g) => x.includes(g))) return "good";
  if (bad.some((g) => x.includes(g))) return "bad";
  return "neutral";
}

/**
 * NewsCard component (kept here to match your single-file structure)
 */
function NewsCard({ item }) {
  const sentiment = mapSentiment(item.sentiment || item.tag || "");
  const sector =
    item.sector ||
    item.category ||
    (item.tags && item.tags.length ? item.tags[0] : "") ||
    "GENERAL";

  // truncate description to ~3-4 lines (client-side)
  const description =
    item.description ||
    item.summary ||
    (item.content ? item.content.slice(0, 280) : "") ||
    "";

  const leftIcon = sentiment === "good" ? (
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
      setShowSuggestions(true
