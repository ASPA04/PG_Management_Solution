# PG Management System

Full-stack MVP for managing PG tenants, rent tracking, and notices. Data is persisted in MongoDB. Includes soft-delete archive and payment proof links.

## Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas URI)

## Quick Start
```bash
git clone <repo>
cd pg-management-system
npm install

# create .env in project root
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pg-management   # or your Atlas URI

npm start
# open http://localhost:3000
```

## Features
- Tenants: add/edit/soft-delete (archive keeps history)
- Rent tracking: month-wise records, payment status, proof link (image URL)
- Notices: add/delete with categories
- Archive: view all tenants, including deleted

## API (server.js)
- `GET /api/tenants` – active tenants
- `GET /api/tenants/all` – all tenants incl. deleted
- `POST /api/tenants` – create
- `PUT /api/tenants/:id` – update
- `DELETE /api/tenants/:id` – soft delete
- `POST /api/tenants/:id/payment` – add/update payment `{ month, amount, date, paid, proofUrl }`
- `GET/POST/PUT/DELETE /api/notices`

## Project Structure
```
index.html      # frontend
styles.css      # styling
app.js          # frontend logic (calls API)
server.js       # Express server
models/         # Mongoose models (Tenant, Notice)
routes/         # tenants, notices
.env            # PORT, MONGODB_URI
```

## Notes
- Proof of payment is stored as a URL (e.g., image link). To use file uploads, add storage (S3, Cloudinary) and accept multipart/form-data.
- Tenants are soft-deleted; use “View Archive” to see all records.

## Troubleshooting
- MongoDB connection error: ensure MongoDB running / Atlas URI correct & IP whitelisted.
- Port in use: change `PORT` in `.env`.

