🏠 Rentify Real Estate Rental Platform
A full-stack real estate rental platform with contract management, digital signatures, real-time chat, and PDF generation.

Built with Node.js/Express/MongoDB (backend) and React/Vite (frontend), featuring Socket.IO for live updates.

🚀 Features
🏠 Property & Contract Management
Add, edit, and view rental properties.

Create, approve, and digitally sign rental contracts.

Legally formatted contract PDFs with digital signatures (3-page compact format).

💬 Real-Time Chat
Secure, property-specific chat between landlord and tenant.

Instant communication using Socket.IO.

📄 PDF Generation
Generate professional rental contract PDFs.

Includes signatures, witness info, QR verification, and government-style seal.

🔒 Authentication & Authorization
Secure JWT-based login and protected API routes.

Role-based access: Landlord, Tenant, Admin.

📈 Dashboard & UI
Clean, modern interface built with React, Tailwind CSS, and Material UI.

Real-time contract status updates and notification system.

🛠 Tech Stack
Backend:

Node.js

Express.js

MongoDB + Mongoose

Socket.IO

PDFKit

Multer (for file uploads)

JWT

QRCode

Frontend:

React

Vite

Tailwind CSS

Material UI

Axios

React Signature Pad

Socket.IO-client

⚙️ Getting Started
📦 Prerequisites
Node.js (v18+)

MongoDB (local or MongoDB Atlas)

npm

🔁 Clone the Repository
bash
Copy code
git clone https://github.com/yourusername/rentify-platform.git
cd rentify-platform
🔧 Backend Setup
bash
Copy code
cd backend
npm install
Create a .env file in /backend:

ini
Copy code
MONGO_URI=mongodb://localhost:27017/rentify
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
Start MongoDB:

Windows: mongod

Docker:

bash
Copy code
docker run -d -p 27017:27017 --name mongodb mongo
Start the backend server:

bash
Copy code
npm start
🎨 Frontend Setup
bash
Copy code
cd ../frontend
npm install
npm run dev
Frontend runs at: http://localhost:5173

<video src="RentifyContractDemo.mp4" controls width="600"></video>

rentify-platform/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── assets/
│   ├── utils/
│   ├── server.js
│   ├── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── data/
│   │   ├── assets/
│   │   └── socket.js
│   ├── public/
│   ├── package.json
│   └── vite.config.js
