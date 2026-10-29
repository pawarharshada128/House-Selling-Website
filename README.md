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
- View approved customer reviews, ratings, and rating distribution
- Submit reviews for completed property bookings or construction requests
- Responsive Design

 Admin Features

- Admin Login
- Admin Dashboard
 - Manage User Enquiries separately from Build Requests
 - Contact customers, schedule property visits or land inspections, and manage property offers or construction quotations
 - Track construction milestones for Build Requests without showing construction progress on property enquiries
 - Moderate customer reviews and manage pending, approved, and rejected submissions
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

### Reviews: Local Testing and Deployment

1. Start MongoDB, then run `npm install` and `npm run dev` from `backend/` with `MONGO_URI` and `JWT_SECRET` configured.
2. From `frontend/`, run `npm install` and `npm run dev`. The frontend defaults to the current Render API URL; set `VITE_API_URL=http://localhost:5000/api` in a frontend `.env` file to test against a local backend.
3. Sign in as a buyer with a customer-linked property booking or construction request that an admin has marked `Completed`. Submit a review from the home page; it should be pending and should not affect public ratings yet.
4. Sign in as an admin, open **Reviews**, approve the pending review, and verify that it appears publicly and updates the average/count/distribution. Test reject, filters, search, and delete confirmation as well.
5. For deployment, redeploy the backend on Render with its existing MongoDB and JWT environment variables. Deploy the frontend as usual; set `VITE_API_URL` to the Render API base (ending in `/api`) only if it differs from the current default. Ensure the backend CORS allowlist includes the deployed frontend origin.

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

### Customer Enquiries and Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/enquiries` | Submit a property enquiry or Build Your Dream Home request |
| GET | `/api/enquiries` | List enquiries with property details (admin only) |
| PUT | `/api/enquiries/:id` | Update status, save a type-appropriate site visit/offer/quotation/progress update (admin only) |
| DELETE | `/api/enquiries/:id` | Delete an enquiry or request (admin only) |

Build request submissions include structured land, house type/size, floor, bedroom, budget, design, and additional requirement fields. Existing message-only build requests continue to display using their saved message text.

### Reviews and Ratings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reviews?sort=newest&page=1&limit=6` | Public | Paginated approved reviews and rating summary; sort supports `newest`, `oldest`, `highest`, and `lowest` |
| GET | `/api/reviews/summary` | Public | Approved-review average, count, and 1–5 star distribution |
| GET | `/api/reviews/eligible` | Buyer | Completed customer-linked booking/construction records not yet reviewed |
| GET | `/api/reviews/mine` | Buyer | Current buyer's reviews and moderation states |
| POST | `/api/reviews` | Buyer | Submit a pending review using `enquiryId`, `rating`, `title`, and `description` |
| GET | `/api/reviews/admin?status=Pending&rating=5&search=name&page=1&limit=15` | Admin | Filter/search all review submissions |
| PATCH | `/api/reviews/:id/status` | Admin | Approve or reject a pending review (`{ "status": "Approved" }` or `"Rejected"`) |
| DELETE | `/api/reviews/:id` | Admin | Permanently delete a review |

Eligibility is derived on the server from the signed-in buyer's own `Enquiry` record with status `Completed` and type `PropertyBooking` or `BuildRequest`. The submission endpoint derives the verified flag itself and enforces one review per completed enquiry. Reviews remain pending until admin approval; only approved reviews affect public ratings or display.

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
Enquiries (including booking and construction-request management)
Reviews (customer-linked completed enquiry, rating, and moderation status)
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
