# UmutiSafe - Medicine Disposal & CHW Integration Platform

UmutiSafe is a comprehensive React + Vite web application designed to help households in Rwanda safely dispose of medicines while connecting them with Community Health Workers (CHWs). The platform uses AI-powered medicine classification to provide disposal guidance and facilitate proper medicine disposal through CHW pickups.

## Features

### For Household Users
- **Medicine Classification**: Upload images or enter medicine details to receive AI-powered disposal guidance
- **Risk Assessment**: Automatic risk level classification (LOW, MEDIUM, HIGH)
- **Disposal History**: Track all past medicine disposals
- **CHW Pickup Requests**: Request pickups from nearby Community Health Workers
- **Education Center**: Learn about safe medicine disposal practices
- **Profile Management**: Manage account settings and privacy preferences

### For Community Health Workers (CHWs)
- **Pickup Management**: View and manage medicine pickup requests
- **Request Review**: Accept, schedule, or reject pickup requests
- **Performance Tracking**: Monitor completed pickups and statistics
- **Availability Toggle**: Set availability status for accepting new requests

### For Admins / FDA
- **System Dashboard**: View platform-wide statistics and trends
- **User Management**: Manage household users and CHWs
- **Medicine Registry**: Upload and maintain FDA-approved medicine database
- **System Reports**: Generate and export comprehensive reports (CSV, PDF, Excel)

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS with custom design tokens
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context + Local State
- **Theme**: Dark/Light mode with localStorage persistence

## Design System

### Color Palette
- **Primary Blue**: `#0B6FA7` (Trust, reliability)
- **Primary Green**: `#2E8B57` (Health, safety)
- **Accent/CTA**: `#19A3FF` (Bright, actionable)
- **Warning**: `#E03E2D` (Alerts, high-risk)
- **Background Light**: `#F6F7F9`
- **Surface Dark**: `#1A2332`

### Accessibility
- WCAG AA compliant contrast ratios
- Minimum touch target size: 44x44px
- Semantic HTML elements
- Keyboard navigation support
- Screen reader friendly with ARIA labels

## Installation

### Prerequisites
- Node.js 16+ and npm

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── assets/              # Logo and static assets
├── components/          # Reusable UI components
│   ├── FormFields/      # Input, Textarea, Select
│   ├── Navbar.jsx       # Top navigation bar
│   ├── Sidebar.jsx      # Collapsible sidebar navigation
│   ├── BottomNav.jsx    # Mobile bottom navigation
│   ├── StatCard.jsx     # Dashboard statistics cards
│   ├── Table.jsx        # Reusable data table
│   ├── Modal.jsx        # Accessible modal component
│   ├── SearchBar.jsx    # Search input component
│   └── DarkModeToggle.jsx
├── pages/
│   ├── user/            # Household user pages
│   ├── chw/             # CHW pages
│   ├── admin/           # Admin pages
│   ├── Login.jsx
│   └── NotFound.jsx
├── routes/
│   ├── AppRoutes.jsx    # Main routing configuration
│   └── ProtectedRoute.jsx # Role-based route protection
├── utils/
│   ├── mockData.js      # Mock data for demo
│   ├── apiMocks.js      # Mock API functions
│   └── theme.js         # Theme utilities
├── App.jsx              # Root component
├── main.jsx             # Entry point
└── index.css            # Global styles & Tailwind
```

## Mock Data & Testing

The application uses comprehensive mock data to simulate a fully functional system:

### Demo Accounts
Access the platform using these quick login options on the login page:

1. **Household User**
   - View dashboard, add disposals, request pickups
   - Access: Click "Login as Household User"

2. **Community Health Worker**
   - Manage pickup requests, update statuses
   - Access: Click "Login as CHW"

3. **Admin / FDA**
   - View system statistics, manage users, generate reports
   - Access: Click "Login as Admin"

### Theme Toggle
- Click the moon/sun icon in the navbar to toggle dark/light mode
- Theme preference is saved to localStorage

### Role Switcher
- Use the role dropdown in the navbar (desktop) to switch between user types
- This demonstrates how the platform adapts to different user roles

## API Integration Points

This is a **standalone frontend application** with mock data. To connect to a real backend:

### Replace Mock API Calls

All API interaction points are clearly marked in `src/utils/apiMocks.js`:

```javascript
// TODO: Replace with real API endpoint
// Example: axios.post('https://api.umutisafe.rw/api/predict/text', data)
```

### Backend Endpoints Needed

1. **Medicine Classification**
   - `POST /api/predict/text` - Text-based prediction
   - `POST /api/predict/image` - Image-based OCR + prediction
   - Request format: `{ generic_name, brand_name, dosage_form, packaging_type }`
   - Response: `{ predicted_category, risk_level, confidence, disposal_guidance }`

2. **Disposal Management**
   - `POST /api/disposals` - Create disposal record
   - `GET /api/disposals` - List user disposals
   - `GET /api/disposals/:id` - Get disposal details

3. **CHW & Pickups**
   - `GET /api/chws/nearby` - Find nearby CHWs
   - `POST /api/pickups` - Request pickup
   - `GET /api/pickups` - List pickup requests
   - `PATCH /api/pickups/:id` - Update pickup status

4. **Education**
   - `GET /api/guidelines` - Get disposal guidelines

5. **Admin**
   - `GET /api/admin/stats` - System statistics
   - `GET /api/admin/users` - List all users
   - `POST /api/admin/medicines/upload` - Upload CSV
   - `POST /api/admin/reports/export` - Generate reports

### Using Real APIs

1. Install axios or use fetch:
   ```bash
   npm install axios
   ```

2. Create an API client (`src/utils/api.js`):
   ```javascript
   import axios from 'axios';

   const API_BASE_URL = import.meta.env.VITE_API_URL;

   export const api = axios.create({
     baseURL: API_BASE_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

3. Replace mock functions in `apiMocks.js` with real API calls:
   ```javascript
   import { api } from './api';

   export const predictFromText = async (data) => {
     const response = await api.post('/predict/text', data);
     return response.data;
   };
   ```

4. Add environment variables (`.env`):
   ```
   VITE_API_URL=https://api.umutisafe.rw
   ```

## Maps Integration

The CHW Pickup Requests page includes a map placeholder. To add interactive maps:

### Using Leaflet (Recommended)

1. Install dependencies:
   ```bash
   npm install leaflet react-leaflet
   ```

2. Create a Map component:
   ```jsx
   import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
   import 'leaflet/dist/leaflet.css';

   export default function PickupMap({ requests }) {
     return (
       <MapContainer center={[-1.9441, 30.0619]} zoom={13}>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
         {requests.map(req => (
           <Marker key={req.id} position={[req.lat, req.lng]}>
             <Popup>{req.userName} - {req.medicineName}</Popup>
           </Marker>
         ))}
       </MapContainer>
     );
   }
   ```

3. Add to PickupRequests page in place of the map placeholder

### Using Google Maps
- Similar approach using `@react-google-maps/api`
- Requires Google Maps API key

## Accessibility Features

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **High Contrast**: Color combinations meet WCAG AA standards
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Responsive Text**: Readable font sizes with proper line height
- **Touch Targets**: Minimum 44x44px for mobile interactions

## Responsive Design

- **Mobile-First**: Optimized for small screens
- **Breakpoints**:
  - Mobile: < 768px (bottom navigation visible)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px (sidebar always visible)
- **Adaptive Layouts**: Grid and flex layouts adjust to screen size
- **Touch-Friendly**: Larger touch targets and spacing on mobile

## Security Considerations

When connecting to real APIs:

1. **Authentication**: Implement JWT or session-based auth
2. **Authorization**: Validate user roles on backend
3. **Input Validation**: Sanitize all user inputs
4. **HTTPS**: Always use encrypted connections
5. **CORS**: Configure proper CORS policies
6. **Rate Limiting**: Implement API rate limits
7. **File Upload**: Validate file types and sizes
8. **SQL Injection**: Use parameterized queries
9. **XSS Prevention**: Sanitize rendered content

## Future Enhancements

- Push notifications for pickup updates
- Real-time CHW location tracking
- Multi-language support (Kinyarwanda, English, French)
- SMS integration for users without smartphones
- Offline mode with service workers
- Medicine barcode scanning
- Appointment scheduling calendar
- Gamification and community leaderboards

## Contributing

This is a demonstration project. For production use:

1. Replace mock data with real backend APIs
2. Implement proper authentication and authorization
3. Add comprehensive error handling
4. Implement data validation on frontend and backend
5. Add unit and integration tests
6. Set up CI/CD pipeline
7. Configure monitoring and logging
8. Optimize bundle size and performance
9. Add i18n for multiple languages
10. Implement proper data encryption

## License

This is a demonstration project for educational purposes.

## Support

For technical questions or issues:
- Email: support@umutisafe.rw (placeholder)
- Phone: +250 788 000 000 (placeholder)

---

**Built with ❤️ for safer medicine disposal in Rwanda**
