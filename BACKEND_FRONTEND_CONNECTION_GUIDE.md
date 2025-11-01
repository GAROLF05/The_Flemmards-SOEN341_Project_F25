# Backend to Frontend Connection Guide

## Overview
This document outlines the complete structure of how the backend (Node.js/Express) connects to the frontend (React/Vite).

---

## 📁 File Structure & Flow

### BACKEND SIDE

#### 1. **Entry Point: `backend/server.js`**
**Purpose**: Main Express server setup

**Key Components**:
```javascript
// Express app setup
const app = express();

// Middlewares
app.use(express.json());           // Parse JSON bodies
app.use(cookieParser());           // Parse cookies
app.use(CORS);                     // Handle cross-origin requests

// Mount routes
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
// ... other routes

// Serve static files (images)
app.use('/uploads/events', express.static('uploads/events'));

// Start server
app.listen(3000);
```

---

#### 2. **Routes: `backend/routes/events.js`**
**Purpose**: Define URL endpoints and link to controllers

**Structure**:
```javascript
const router = express.Router();
const eventController = require("../controllers/eventController");

// Public route (no auth required)
router.get('/browse', eventController.browseEvents);

// Protected routes (require admin/auth)
router.get('/get/all', requireAdmin, eventController.getAllEvents);
router.post('/create', requireAdmin, upload.single('image'), eventController.createEvent);

module.exports = router;
```

**Key Patterns**:
- Routes map URLs to controller functions
- Middleware can be added: `requireAuth`, `requireAdmin`, `upload`
- Routes are mounted in `server.js` with prefix: `/api/events`

---

#### 3. **Controllers: `backend/controllers/eventController.js`**
**Purpose**: Business logic - handles requests and database operations

**Structure**:
```javascript
// Import Mongoose models
const { Event } = require('../models/Event');

// Example controller function
exports.browseEvents = async (req, res) => {
    try {
        // 1. Get query parameters
        const { q, category, startDate } = req.query;
        
        // 2. Build MongoDB query
        const query = { status: 'upcoming' };
        
        // 3. Fetch from database
        const events = await Event.find(query)
            .populate('organization')
            .lean();
        
        // 4. Transform/normalize data
        const normalizedEvents = normalizeEventsImages(events);
        
        // 5. Send response
        return res.status(200).json({
            message: 'Success',
            events: normalizedEvents
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
```

**Key Patterns**:
- `req`: Request object (contains `params`, `query`, `body`, `file`)
- `res`: Response object (use `res.json()`, `res.status()`)
- Database queries using Mongoose
- Error handling with try/catch
- Return JSON responses

---

#### 4. **Models: `backend/models/Event.js`**
**Purpose**: Define database schema and Mongoose models

**Structure**:
```javascript
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start_at: { type: Date, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    // ... other fields
});

const Event = mongoose.model('Event', eventSchema);
module.exports = { Event };
```

**Key Patterns**:
- Define schema with field types and validation
- Use `ref` for relationships (populate later)
- Export model for use in controllers

---

#### 5. **Middlewares: `backend/middlewares/`**
**Purpose**: Intercept requests before controllers

**Files**:
- `auth.js`: Check authentication, verify admin
- `upload.js`: Handle file uploads (Multer)
- `validate.js`: Validate request data

**Example**:
```javascript
// auth.js
exports.requireAdmin = async (req, res, next) => {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next(); // Continue to controller
};
```

---

### FRONTEND SIDE

#### 1. **API Client: `frontend/src/api/axiosClient.js`**
**Purpose**: Configure Axios HTTP client with base settings

**Structure**:
```javascript
import axios from "axios";

const axiosClient = axios.create({
    baseURL: '/api',  // All requests prefixed with /api
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: Add auth token to all requests
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: Extract data from response
axiosClient.interceptors.response.use(
    response => response.data,  // Return just the data
    error => Promise.reject(error)
);

export default axiosClient;
```

**Key Features**:
- Base URL configuration
- Automatic token attachment
- Error handling
- Response transformation

---

#### 2. **Endpoints: `frontend/src/api/endpoints.js`**
**Purpose**: Centralized URL definitions

**Structure**:
```javascript
const ENDPOINTS = {
    EVENTS_BROWSE: "/events/browse",
    EVENTS_ALL: "/events/get/all",
    EVENT_BY_ID: (id) => `/events/get/${id}`,
    EVENTS_BY_CATEGORY: (category) => `/events/get/category/${category}`,
    // ... more endpoints
};

export default ENDPOINTS;
```

**Benefits**:
- Single source of truth for URLs
- Easy to update if backend routes change
- Type-safe with functions for dynamic URLs

---

#### 3. **API Functions: `frontend/src/api/eventApi.js`**
**Purpose**: Specific API call functions for events

**Structure**:
```javascript
import api from "./axiosClient";
import ENDPOINTS from "./endpoints";

// Public function (no auth)
export const browseEvents = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    const queryString = params.toString();
    return api.get(`${ENDPOINTS.EVENTS_BROWSE}${queryString ? '?' + queryString : ''}`);
};

// Admin function (requires auth)
export const getAllEvents = () => api.get(ENDPOINTS.EVENTS_ALL);

// With file upload
export const createEvent = (eventData, imageFile) => {
    if (imageFile) {
        const formData = new FormData();
        Object.keys(eventData).forEach(key => {
            formData.append(key, eventData[key]);
        });
        formData.append('image', imageFile);
        return api.post(ENDPOINTS.EVENT_CREATE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.post(ENDPOINTS.EVENT_CREATE, eventData);
};
```

**Key Patterns**:
- Use `axiosClient` (imported as `api`) for all requests
- Handle query parameters with URLSearchParams
- Use FormData for file uploads
- Return promises (can be used with async/await)

---

#### 4. **Data Transformation: `frontend/src/utils/eventTransform.js`**
**Purpose**: Convert backend data format to frontend format

**Structure**:
```javascript
// Backend format: { _id, start_at, location: {name}, organization: {name} }
// Frontend format: { id, date, location, organization }

export const transformEventForFrontend = (backendEvent) => {
    return {
        id: backendEvent._id,
        date: backendEvent.start_at,
        location: backendEvent.location?.name || '',
        organization: backendEvent.organization?.name || '',
        imageUrl: backendEvent.image 
            ? (backendEvent.image.startsWith('/') 
                ? backendEvent.image 
                : `/${backendEvent.image}`)
            : '/uploads/events/default-event-image.svg',
    };
};

export const transformEventsForFrontend = (backendEvents) => {
    return backendEvents.map(transformEventForFrontend);
};
```

**Why Needed**:
- Backend uses `_id`, frontend expects `id`
- Backend has nested objects, frontend wants flat strings
- Different naming conventions
- Handle null/undefined values

---

#### 5. **React Components: `frontend/src/pages/student/HomePage.jsx`**
**Purpose**: UI components that use the API

**Structure**:
```javascript
import { browseEvents } from '../../api/eventApi';
import { transformEventsForFrontend } from '../../utils/eventTransform';

const HomePage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                // 1. Call API
                const response = await browseEvents({ limit: 100 });
                
                // 2. Extract data (axios interceptor already did response.data)
                const eventsArray = response.events || response;
                
                // 3. Transform data
                const transformed = transformEventsForFrontend(eventsArray);
                
                // 4. Update state
                setEvents(transformed);
            } catch (error) {
                console.error('Error:', error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEvents();
    }, []); // Run once on mount
    
    return (
        <div>
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
};
```

**Key Patterns**:
- Use `useEffect` to fetch data on component mount
- Call API function from `eventApi.js`
- Transform data before using in UI
- Handle loading and error states
- Update React state with fetched data

---

#### 6. **Vite Proxy: `frontend/vite.config.js`**
**Purpose**: Forward requests from frontend dev server to backend

**Structure**:
```javascript
export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',  // Backend server
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:3000',  // Backend static files
                changeOrigin: true,
            },
        },
    },
});
```

**How It Works**:
- Frontend dev server runs on `localhost:5173`
- Backend runs on `localhost:3000`
- When frontend requests `/api/events/browse`, Vite proxy forwards it to `localhost:3000/api/events/browse`
- Browser only sees requests to `localhost:5173` (no CORS issues)

---

## 🔄 Complete Request Flow

### Example: Fetching Events (GET Request)

1. **Frontend Component** (`HomePage.jsx`)
   ```javascript
   const response = await browseEvents();
   ```

2. **API Function** (`eventApi.js`)
   ```javascript
   export const browseEvents = () => api.get("/events/browse");
   ```

3. **Axios Client** (`axiosClient.js`)
   - Adds base URL: `/api` → `/api/events/browse`
   - Adds auth token if available
   - Makes HTTP GET request

4. **Vite Proxy** (`vite.config.js`)
   - Intercepts `/api/events/browse`
   - Forwards to `http://localhost:3000/api/events/browse`

5. **Express Server** (`server.js`)
   - Receives request at `/api/events/browse`
   - Routes to `/api/events` router (mounted route)

6. **Express Router** (`routes/events.js`)
   - Matches `/browse` route
   - Calls `eventController.browseEvents()`

7. **Controller** (`eventController.js`)
   - Queries MongoDB using Mongoose
   - Transforms data
   - Returns JSON: `res.json({ events: [...] })`

8. **Response Travels Back**:
   - Controller → Router → Server → Proxy → Axios → Component
   - Axios interceptor extracts `response.data`
   - Component receives data and updates state

---

### Example: Creating Event with Image (POST Request)

1. **Frontend Component**
   ```javascript
   const formData = new FormData();
   formData.append('title', 'New Event');
   formData.append('image', imageFile);
   await createEvent(formData);
   ```

2. **API Function**
   ```javascript
   export const createEvent = (data) => {
       return api.post("/events/create", data, {
           headers: { 'Content-Type': 'multipart/form-data' }
       });
   };
   ```

3. **Axios Client**
   - Sets `Content-Type: multipart/form-data`
   - Adds auth token
   - Sends POST request

4. **Express Server**
   - Receives multipart/form-data
   - Middleware processes it

5. **Multer Middleware** (`upload.js`)
   - Saves uploaded file to `uploads/events/`
   - Adds file info to `req.file`

6. **Route** (`routes/events.js`)
   ```javascript
   router.post('/create', requireAdmin, upload.single('image'), eventController.createEvent);
   ```

7. **Controller**
   ```javascript
   exports.createEvent = async (req, res) => {
       const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : null;
       const event = await Event.create({
           title: req.body.title,
           image: imageUrl,
       });
       return res.json({ event });
   };
   ```

---

## 📋 File Checklist

### Backend Files Needed:
```
backend/
├── server.js                          # Main server entry point
├── routes/
│   ├── events.js                      # Event route definitions
│   └── [other routes].js              
├── controllers/
│   ├── eventController.js             # Event business logic
│   └── [other controllers].js        
├── models/
│   ├── Event.js                       # Event database schema
│   └── [other models].js              
├── middlewares/
│   ├── auth.js                        # Authentication middleware
│   ├── upload.js                      # File upload middleware
│   └── [other middlewares].js        
└── config/
    └── database.js                    # MongoDB connection
```

### Frontend Files Needed:
```
frontend/src/
├── api/
│   ├── axiosClient.js                 # Axios configuration
│   ├── endpoints.js                   # URL endpoints
│   ├── eventApi.js                    # Event API functions
│   └── [other api].js                 
├── utils/
│   └── eventTransform.js              # Data transformation
├── pages/
│   └── student/
│       └── HomePage.jsx               # Component using API
└── vite.config.js                     # Vite proxy configuration (root)
```

---

## 🔑 Key Concepts

### 1. **Request Flow**
```
React Component → API Function → Axios Client → Vite Proxy → Express Router → Controller → Database → Response (reverse)
```

### 2. **Data Flow**
```
Database (MongoDB) → Mongoose Model → Controller → JSON Response → Axios → Transform → React State → UI
```

### 3. **Authentication**
- Token stored in `localStorage` (frontend)
- Axios interceptor adds `Authorization: Bearer <token>` header
- Express middleware (`auth.js`) validates token
- Controllers check user permissions

### 4. **File Uploads**
- Frontend: Use `FormData` with `multipart/form-data`
- Backend: Use Multer middleware to handle file uploads
- Files saved to `backend/uploads/events/`
- Serve statically via `app.use('/uploads/events', express.static(...))`

### 5. **Error Handling**
- Backend: Try/catch in controllers, return error status codes
- Frontend: Catch errors in API calls, show error messages
- Axios: Interceptor can transform errors before reaching components

---

## 🎯 Quick Reference

### Backend Route Pattern:
```
server.js: app.use('/api/events', eventRoutes)
routes/events.js: router.get('/browse', controller.browseEvents)
Result: GET /api/events/browse → controller.browseEvents()
```

### Frontend API Call Pattern:
```
endpoints.js: EVENTS_BROWSE = "/events/browse"
eventApi.js: browseEvents() → api.get(ENDPOINTS.EVENTS_BROWSE)
axiosClient.js: baseURL = '/api' → Final URL: /api/events/browse
vite.config.js: Proxy /api → http://localhost:3000
```

### Typical Component Pattern:
```javascript
1. Import API function
2. useState for data
3. useEffect to fetch on mount
4. Call API function
5. Transform response data
6. Update state
7. Render UI with data
```

---

## ⚠️ Important Notes

1. **CORS**: Handled in `server.js` and Vite proxy (dev)
2. **Authentication**: Token in localStorage, added via Axios interceptor
3. **Static Files**: Backend serves `/uploads/events/`, frontend proxies `/uploads`
4. **Data Transformation**: Always needed due to different naming conventions
5. **Error Handling**: Both sides need proper error handling
6. **Environment**: Frontend uses Vite env vars (`VITE_*`), Backend uses `dotenv`

---

This structure allows:
- ✅ Separation of concerns
- ✅ Reusable API functions
- ✅ Type safety with centralized endpoints
- ✅ Easy to test individual components
- ✅ Clear data flow

