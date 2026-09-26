require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error connecting to SQLite:', err.message);
  else console.log('Connected to SQLite database.');
});

const SYSTEM_INSTRUCTION = `
You are an expert SQL assistant for an SQLite e-commerce database.
Your job is to translate natural language questions into valid SQL queries.

Database Schema:
1. products(product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER)
2. customers(customer_id INTEGER PRIMARY KEY, name TEXT, email TEXT)
3. orders(order_id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, quantity INTEGER, order_date TEXT)

Constraints:
- Output ONLY valid SQLite SQL statements.
- Do NOT include markdown code blocks, explanation, or HTML tags.
- Output strictly raw SQL text.
- Only construct SELECT queries (read-only operations).
`;

// Helper: Call Gemini with automatic retry for 503 / high demand errors
async function generateContentWithRetry(params, retries = 3, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const is503 = error.status === 503 || (error.message && error.message.includes('503'));
      if (is503 && attempt < retries) {
        console.warn(`Gemini API busy (503). Retrying attempt ${attempt}/${retries} in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff (1.5s -> 3s)
      } else {
        throw error; // Re-throw if out of retries or not a 503 error
      }
    }
  }
}

app.post('/api/query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Natural language query is required.' });
  }

  try {
    // Use the retrying wrapper
    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    let generatedSql = response.text.trim();
    generatedSql = generatedSql
      .replace(/^```sql\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    if (!generatedSql.toLowerCase().startsWith('select')) {
      return res.status(400).json({
        error: 'Security Error',
        details: 'Only SELECT queries are allowed.',
        sql: generatedSql,
      });
    }

    db.all(generatedSql, [], (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: 'Database Query Execution Error',
          details: err.message,
          sql: generatedSql,
        });
      }

      res.json({
        sql: generatedSql,
        results: rows,
      });
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(503).json({
      error: 'Gemini service is currently busy.',
      details: 'Google Gemini is experiencing high demand. Please wait a moment and try clicking "Run Query" again.',
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});