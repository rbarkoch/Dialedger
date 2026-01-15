import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons/Icon';
import api from '../api';
import { format } from 'date-fns';
import './SearchBar.css';

const ENTRY_TYPE_LABELS = {
  note: 'Note',
  email: 'Email',
  meeting: 'Meeting',
  conversation: 'Conversation',
  file: 'File',
};

function SearchBar({ onSelectThread, onSelectEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ threads: [], entries: [] });
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ threads: [], entries: [] });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await api.search({
          query: query.trim(),
          options: selectedTypes.length > 0 ? { entryTypes: selectedTypes } : {},
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ threads: [], entries: [] });
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypes]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ threads: [], entries: [] });
    inputRef.current?.focus();
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleThreadClick = (thread) => {
    onSelectThread(thread);
    setIsOpen(false);
    setQuery('');
  };

  const handleEntryClick = (entry) => {
    // Create a minimal thread object to select the thread
    const thread = {
      id: entry.thread_id,
      title: entry.thread_title,
    };
    onSelectEntry(thread, entry.id);
    setIsOpen(false);
    setQuery('');
  };

  const highlightMatch = (text, searchQuery) => {
    if (!text || !searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getEntryPreview = (entry) => {
    // Try to extract meaningful preview from metadata or content
    if (entry.metadata) {
      try {
        const metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata;
        if (metadata.subject) return metadata.subject;
        if (metadata.body) return metadata.body.substring(0, 100);
        if (metadata.notes) return metadata.notes.substring(0, 100);
        if (metadata.summary) return metadata.summary.substring(0, 100);
        if (metadata.content) return metadata.content.substring(0, 100);
      } catch (e) {
        // Ignore parse errors
      }
    }
    if (entry.content) return entry.content.substring(0, 100);
    return entry.title || '';
  };

  const totalResults = results.threads.length + results.entries.length;
  const hasResults = totalResults > 0;
  const showResults = isOpen && query.trim();

  return (
    <div className="search-bar" ref={searchRef}>
      <button className="search-toggle" onClick={handleToggle} title="Search (Ctrl+K)">
        <Icon name="search" size={18} />
      </button>

      {isOpen && (
        <div className="search-dropdown">
          <div className="search-input-container">
            <Icon name="search" size={16} className="search-input-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search threads and entries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            {query && (
              <button className="search-clear" onClick={handleClear}>
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <div className="search-filters">
            {Object.entries(ENTRY_TYPE_LABELS).map(([type, label]) => (
              <button
                key={type}
                className={`search-filter-btn ${selectedTypes.includes(type) ? 'active' : ''}`}
                onClick={() => handleTypeToggle(type)}
              >
                <Icon name={type} size={14} />
                {label}
              </button>
            ))}
          </div>

          {showResults && (
            <div className="search-results">
              {loading ? (
                <div className="search-loading">Searching...</div>
              ) : !hasResults ? (
                <div className="search-empty">No results found for "{query}"</div>
              ) : (
                <>
                  {results.threads.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-header">
                        Threads ({results.threads.length})
                      </div>
                      {results.threads.map((thread) => (
                        <div
                          key={`thread-${thread.id}`}
                          className="search-result-item"
                          onClick={() => handleThreadClick(thread)}
                        >
                          <div className="search-result-title">
                            {highlightMatch(thread.title, query)}
                          </div>
                          {thread.description && (
                            <div className="search-result-preview">
                              {highlightMatch(thread.description, query)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {results.entries.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-header">
                        Entries ({results.entries.length})
                      </div>
                      {results.entries.map((entry) => (
                        <div
                          key={`entry-${entry.id}`}
                          className="search-result-item"
                          onClick={() => handleEntryClick(entry)}
                        >
                          <div className="search-result-meta">
                            <span className="search-result-type">
                              <Icon name={entry.entry_type} size={12} />
                              {ENTRY_TYPE_LABELS[entry.entry_type]}
                            </span>
                            <span className="search-result-thread">
                              in {entry.thread_title}
                            </span>
                            <span className="search-result-date">
                              {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="search-result-title">
                            {highlightMatch(entry.title || getEntryPreview(entry), query)}
                          </div>
                          {entry.title && (
                            <div className="search-result-preview">
                              {highlightMatch(getEntryPreview(entry), query)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="search-hint">
              <span className="search-kbd">Ctrl</span>
              <span className="search-kbd">K</span>
              <span>to open search</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
