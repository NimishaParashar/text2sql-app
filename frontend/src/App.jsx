import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const sampleQueries = [
    "Show all products in the electronics category",
    "Find total orders made by Alice Smith",
    "List products with stock less than 20",
    "Show top 3 most expensive products"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedSql('');
    setResults([]);

    try {
      const response = await fetch('http://localhost:5000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate query.');
      }

      setGeneratedSql(data.sql);
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (sampleText) => {
    setQuery(sampleText);
  };

  // Dynamically extract database table columns from output
  const tableHeaders = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Text2SQL AI Interface</h1>
        <p>Ask natural language questions to query your SQLite e-commerce database.</p>
      </header>

      {/* Quick Suggestion Chips */}
      <div className="chips-container">
        {sampleQueries.map((sample, idx) => (
          <button 
            key={idx} 
            type="button" 
            className="chip-button"
            onClick={() => handleChipClick(sample)}
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="query-form">
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question (e.g., 'Show total sales for electronics')..."
          className="query-input"
        />
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <span className="spinner-text">Generating SQL & Fetching Data...</span>
          ) : (
            'Run SQL Query'
          )}
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <strong>Execution Error:</strong> {error}
        </div>
      )}

      {/* SQL Code Block Display */}
      {generatedSql && (
        <div className="sql-card">
          <div className="card-header">
            <h3>Generated SQL</h3>
            <button 
              className="copy-btn" 
              onClick={() => navigator.clipboard.writeText(generatedSql)}
            >
              Copy SQL
            </button>
          </div>
          <pre className="code-block"><code>{generatedSql}</code></pre>
        </div>
      )}

      {/* Tabular Query Results */}
      {results.length > 0 && (
        <div className="results-card">
          <h3>Query Results ({results.length} {results.length === 1 ? 'row' : 'rows'})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {tableHeaders.map((header) => (
                      <td key={header}>{String(row[header] ?? 'NULL')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && generatedSql && results.length === 0 && !error && (
        <div className="empty-state">
          Query executed successfully, but returned 0 rows.
        </div>
      )}
    </div>
  );
}