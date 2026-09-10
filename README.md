# Shelf Sense

A full-stack inventory management application for tracking products, stock movement, categories, and inventory status through a web-based dashboard.

## Features

- Product management
- Category management
- Barcode scanning
- Stock-in and stock-out transactions
- Quick item management
- Inventory dashboard
- Low-stock and out-of-stock tracking
- Inventory value tracking
- Stock movement analytics
- Category distribution charts
- Top-moving products
- Recent inventory activity
- Automated low-stock email alerts

## Tech Stack

### Frontend
- React
- React Router
- Axios
- Recharts
- HTML5 QR Code
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Nodemailer
- Node-Cron

## Project Structure

```text
Shelf-Sense/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.js
│       └── index.js
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
│
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
