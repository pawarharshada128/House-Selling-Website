House Selling Website

A full-stack **House Selling Website** that allows users to explore properties, search and filter houses, view detailed property information, manage wishlists, and interact with an admin dashboard for property management.

 Project Overview

The House Selling Website is a modern and responsive real-estate web application developed using **React, Node.js, Express.js, and MongoDB**.

The system provides two main types of users:

-  **Buyer/User** – Can browse properties, search and filter properties, view property details, and manage wishlist.
-  **Admin** – Can add, update, delete, and manage properties through the admin dashboard.

The application also provides property images/videos and map-based location features.

---

 Features

 User Features

- User Registration
- User Login
- JWT-based Authentication
- Browse Properties
- Search Properties
- Filter Properties by Type and Price
- View Property Details
- Add Properties to Wishlist
- Remove Properties from Wishlist
- View Property Location on Map
- View Property Images
- View Property Videos
- Responsive Design

 Admin Features

- Admin Login
- Admin Dashboard
- Add New Property
- Update Property
- Delete Property
- Manage Property Status
- Upload Property Images
- Upload Multiple Images
- Upload Property Video
- Add Property Location
- View Property Statistics

 Map Features

- Property location using latitude and longitude
- Interactive map using Leaflet
- OpenStreetMap integration
- Property marker on map
- Google Maps location support

---

 Technologies Used

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | HTML, CSS |
| Backend | Node.js |
| Server | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcrypt |
| Maps | Leaflet |
| Map Data | OpenStreetMap |
| API Testing | Postman |
| Version Control | Git & GitHub |

---

 Project Structure

```text
House-Selling-Website/
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Property.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── propertyRoutes.js
│   │   ├── wishlistRoutes.js
│   │   └── uploadRoutes.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---

 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/pawarharshada128/House-Selling-Website.git
```

Navigate into the project:

```bash
cd House-Selling-Website
```

---

## 🔧 Backend Setup

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
node server.js
```

Or, if a development script is configured:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

---

 Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

---

 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |

### Properties

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/properties` | Get all properties |
| GET | `/api/properties/:id` | Get property by ID |
| POST | `/api/properties` | Add property |
| PUT | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| GET | `/api/properties/search` | Search properties |
| PUT | `/api/properties/:id/status` | Update property status |

### Wishlist

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wishlist` | Get wishlist |
| POST | `/api/wishlist/:propertyId` | Add property to wishlist |
| DELETE | `/api/wishlist/:propertyId` | Remove property from wishlist |

### Upload

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload property media |

---

 Property Types

The application supports different property types:

- House
- Penthouse
- Villa
- Plot
- Commercial

---

 Authentication

The application uses **JWT (JSON Web Token)** for authentication.

Passwords are securely stored using **bcrypt hashing**.

Role-based authorization is used to provide different permissions to:

- Buyer/User
- Admin

---

 Database

The project uses **MongoDB** as the database.

Main collections include:

```text
Users
Properties
Wishlists
```

Property information includes:

```text
Title
Property Type
Location
Price
Bedrooms
Bathrooms
Area
Description
Images
Video
Latitude
Longitude
Status
Owner
Featured
```

---

 Map Integration

The website uses **Leaflet and OpenStreetMap** to display property locations.

Users can:

- View the property location
- See the property marker
- Interact with the map
- Open the location using Google Maps

---

 Future Improvements

The following features can be added in future versions:

- Property Inquiry / Contact System
- User Management
- Property Approval Workflow
- Notifications
- Property Offers
- Property Comparison
- Reviews and Ratings
- Advanced Sorting
- Property Analytics
- Online Payment Integration
- Cloud Image Storage
- Deployment with HTTPS

---

 Project Objectives

- To develop a user-friendly online property selling platform.
- To provide an easy property search and filtering system.
- To allow admins to efficiently manage property listings.
- To provide secure user authentication.
- To provide map-based property location.
- To create a responsive and modern real-estate website.
- To integrate frontend, backend, database, and APIs into one complete system.

---

## 👥 User Roles

### Buyer

```text
Register/Login
      ↓
Browse Properties
      ↓
Search & Filter
      ↓
View Property Details
      ↓
Add to Wishlist
      ↓
View Location
```

### Admin

```text
Admin Login
     ↓
Admin Dashboard
     ↓
Add / Update / Delete Property
     ↓
Manage Property Status
     ↓
Manage Property Media
```

---

 Project Status

**Status:**  Core Features Implemented

The major modules including authentication, property management, search/filtering, wishlist, media upload, admin dashboard, and map integration have been developed. Final UI refinement, testing, and deployment can be completed as the next stage.

---

 Development

This project was developed as a **Full-Stack Web Development project** using modern web technologies and REST APIs.

### Main Responsibilities

- Frontend development
- Backend API development
- MongoDB database integration
- Authentication and authorization
- Property CRUD operations
- Search and filtering
- Wishlist functionality
- Image/video upload
- Admin dashboard
- Map integration
- Git/GitHub project management



