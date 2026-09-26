const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to (or create) ecommerce.db in the backend folder
const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Creating database tables...');

  // 1. Create Products Table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    )
  `);

  // 2. Create Customers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);

  // 3. Create Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
  `);

  console.log('Seeding initial data...');

  // 4. Clear old data (optional, helps during development)
  db.run(`DELETE FROM orders`);
  db.run(`DELETE FROM products`);
  db.run(`DELETE FROM customers`);

  // 5. Seed Products
  const insertProduct = db.prepare(`INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)`);
  insertProduct.run('Laptop Pro', 'electronics', 1200.00, 15);
  insertProduct.run('Wireless Mouse', 'electronics', 25.50, 100);
  insertProduct.run('Ergonomic Chair', 'furniture', 250.00, 8);
  insertProduct.run('Desk Lamp', 'furniture', 45.00, 30);
  insertProduct.finalize();

  // 6. Seed Customers
  const insertCustomer = db.prepare(`INSERT INTO customers (name, email) VALUES (?, ?)`);
  insertCustomer.run('Alice Smith', 'alice@example.com');
  insertCustomer.run('Bob Jones', 'bob@example.com');
  insertCustomer.finalize();

  // 7. Seed Orders
  const insertOrder = db.prepare(`INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES (?, ?, ?, ?)`);
  insertOrder.run(1, 1, 1, '2026-03-01');
  insertOrder.run(1, 2, 2, '2026-03-02');
  insertOrder.run(2, 3, 1, '2026-03-05');
  insertOrder.finalize();

  console.log('Database successfully initialized and seeded!');
});

db.close();