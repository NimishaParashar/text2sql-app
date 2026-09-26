# 🤖 Natural Language Text2SQL Query Engine

An enterprise-ready, full-stack web application that translates plain English natural language questions into executable SQLite queries using the **Google Gemini API**. Built with a React frontend, Node.js/Express backend, and an embedded SQLite database.

---

## 🌟 Key Features

- **Natural Language to SQL:** Translates questions like *"Show top 5 customers by spending"* into structured SQL statements.
- **Schema-Aware Context:** Uses system instructions to inject database table definitions and relationships into the LLM prompt.
- **Strict Execution Security:** Backend middleware restricts execution exclusively to read-only (`SELECT`) statements, blocking destructive commands (`DELETE`, `DROP`, `UPDATE`).
- **Resilient API Architecture:** Built-in exponential backoff retry logic handles temporary Gemini API availability spikes (503 status codes).
- **Interactive UI:** Dynamic table rendering, dynamic schema viewer, query suggestion chips, and code syntax highlighting.

---

## 🏗️ System Architecture

```text
[ React Frontend ] ────(HTTP POST)────> [ Express Backend Gateway ]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                           [ Gemini API ]          [ SQLite Database ]
                         (SQL Translation)          (Query Execution)