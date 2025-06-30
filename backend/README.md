# Property Listing Backend API

A modern, secure, real-time property listing backend API built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 🏠 **Property Management** - CRUD operations for property listings with image uploads
- 📍 **Location-Based Search** - Geospatial queries for nearby properties
- 💬 **Real-Time Messaging** - Socket.IO powered chat between buyers and sellers
- 📋 **Order Management** - Complete order workflow from creation to completion
- 📄 **E-Signature Agreements** - PDF generation and digital signature support
- 💳 **Payment Processing** - Stripe integration for secure payments
- 🔒 **Privacy-First Design** - Encrypted document storage and secure access controls
- 📊 **Role-Based Access** - Buyer, Seller, and Admin role management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Bcrypt
- **Real-Time**: Socket.IO
- **File Storage**: Cloudinary
- **Payment**: Stripe
- **PDF Generation**: pdf-lib
- **Security**: Helmet, Rate Limiting, CORS

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp env.example .env
   ```
4. Configure your environment variables in `.env`
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/property-listing

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upload-document` - Upload user documents
- `POST /api/auth/upload-profile-image` - Upload profile image

### Properties
- `GET /api/properties` - Get all properties with filters
- `GET /api/properties/nearby` - Get properties near location
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property (Sellers only)
- `PUT /api/properties/:id` - Update property (Owner only)
- `DELETE /api/properties/:id` - Delete property (Owner only)
- `POST /api/properties/:id/upload-images` - Upload property images
- `POST /api/properties/:id/upload-documents` - Upload verification documents

### Messages
- `POST /api/messages/start-conversation` - Start new conversation
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/conversation/:id` - Get conversation messages
- `POST /api/messages/conversation/:id/send` - Send message
- `POST /api/messages/conversation/:id/upload-attachment` - Upload attachment

### Orders
- `POST /api/orders/create-from-chat` - Create order from conversation
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/approve` - Approve order (Seller only)
- `PUT /api/orders/:id/reject` - Reject order (Seller only)
- `PUT /api/orders/:id/add-conditions` - Add seller conditions

### Agreements
- `POST /api/agreements/generate` - Generate agreement document
- `GET /api/agreements/my-agreements` - Get user agreements
- `POST /api/agreements/:id/sign` - Sign agreement
- `GET /api/agreements/:id/download` - Download signed agreement

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/order/:id/payment-status` - Get payment status
- `POST /api/payments/refund` - Process refund

## Database Models

### User
- Authentication details (name, email, password)
- Role-based access (buyer, seller, admin)
- Location data for geospatial queries
- Document storage for verification
- Profile information

### Property
- Property details (title, description, type, price)
- Location with geospatial indexing
- Image gallery with Cloudinary integration
- Verification status and documents
- Seller relationship

### Message
- Real-time conversation management
- Message history with attachments
- Read/unread status tracking
- Conversation archiving

### Order
- Complete transaction workflow
- Buyer and seller details
- Document uploads and verification
- Payment integration
- Status tracking

### Agreement
- PDF document generation
- E-signature support
- Digital signature verification
- Document storage and retrieval

## Socket.IO Events

### Client to Server
- `join` - Join user to socket room
- `send_message` - Send real-time message
- `disconnect` - Handle user disconnection

### Server to Client
- `new_message` - Receive new message
- `order_update` - Order status updates
- `payment_update` - Payment status updates

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password security
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Cross-origin request security
- **Helmet** - Security headers
- **Input Validation** - Request data sanitization
- **Role-Based Access** - Permission-based endpoints
- **File Upload Security** - Secure file handling

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication and authorization errors
- Database operation errors
- File upload errors
- Payment processing errors

## Development

### Running in Development
```bash
npm run dev
```

### Running in Production
```bash
npm start
```

### Database Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in your `.env` file
3. The application will automatically create collections and indexes

### Testing
```bash
npm test
```

## Deployment

### Prerequisites
- Node.js 16+ 
- MongoDB database
- Cloudinary account
- Stripe account

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure production Cloudinary credentials
5. Set up Stripe production keys

### Deployment Options
- **Heroku**: Easy deployment with add-ons
- **AWS**: EC2 with MongoDB Atlas
- **DigitalOcean**: Droplet with managed database
- **Vercel**: Serverless deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 