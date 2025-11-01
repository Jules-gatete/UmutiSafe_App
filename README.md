#  **UmutiSafe – Medicine Disposal & CHW Integration Platform**

**UmutiSafe** is an AI-powered web platform that helps households in Rwanda safely dispose of unused or expired medicines while connecting them with **Community Health Workers (CHWs)**.
It combines **machine learning classification**, **OCR analysis**, and **interactive dashboards** to ensure safe, ethical, and traceable medicine disposal.

 **Live Demo (Frontend):** [https://umutisafe.vercel.app](https://umutisafe.vercel.app)
 
 **Backend API (GitHub):** [https://github.com/umutisafe/api-backend](https://github.com/umutisafe/api-backend)
 
 **AI Model Repository:** [https://github.com/umutisafe/ai-models](https://github.com/umutisafe/ai-models)

##  **Video demo**

🔗 **Video:** [Umutisafe Demo Video](https://github.com/umutisafe/ai-models)


---

##  **Core Features**

###  Household Users

* Upload or enter medicine details for **AI-based disposal classification**
* Automatic **risk level assignment (LOW / MEDIUM / HIGH)**
* Request pickups from nearby **CHWs**
* Track disposal history and access **educational resources**

###  Community Health Workers (CHWs)

* Manage and schedule **pickup requests**
* View request statistics and completion history
* Toggle **availability status** for accepting new requests

###  Admin / FDA

* Centralized **dashboard** with real-time analytics
* Manage **users, CHWs, and medicine registry**
* Upload new datasets and **export reports** (CSV, PDF, Excel)

---

##  **Technology Stack**

| Layer                | Tools / Libraries                              |
| -------------------- | ---------------------------------------------- |
| **Frontend**         | React 18 + Vite                                |
| **Styling**          | TailwindCSS                                    |
| **Routing**          | React Router v6                                |
| **Charts**           | Recharts                                       |
| **Icons**            | Lucide React                                   |
| **State Management** | Context API                                    |
| **Theme**            | Light/Dark mode (persistent with localStorage) |

---

##  **Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

App runs at → **[http://localhost:5173](http://localhost:5173)**

Build for production:

```bash
npm run build
npm run preview
```

---

##  **Simplified Folder Structure**

```
src/
 ├── components/   # Navbar, Sidebar, Forms, Tables, Modals, etc.
 ├── pages/        # User, CHW, Admin interfaces
 ├── routes/       # Protected + role-based routes
 ├── utils/        # Theme, mock APIs, helpers
 ├── App.jsx       # Root component
 └── main.jsx      # Entry point
```

---

## 🔗 **API Integration**

| Function            | Endpoint                                             |
| ------------------- | ---------------------------------------------------- |
| Medicine prediction | `POST /api/predict/text` / `POST /api/predict/image` |
| Disposal records    | `GET /api/disposals` / `POST /api/disposals`         |
| CHW pickups         | `GET /api/pickups` / `POST /api/pickups`             |
| Admin stats         | `GET /api/admin/stats`                               |
| Reports export      | `POST /api/admin/reports/export`                     |

 **AI Models:** Integrated with the [UmutiSafe AI Models API](https://github.com/umutisafe/ai-models) for OCR extraction and disposal category prediction.
Mock APIs in `src/utils/apiMocks.js` can be switched to real endpoints for deployment.

---

##  **AI & OCR Integration Overview**

* **OCR Pipeline:** Extracts text from medicine labels using Vision-OCR on Colab.
* **AI Classifier:** Categorizes medicines into **five disposal classes** (Recyclable, Hazardous, Expired, Non-returnable, Controlled).
* **Data Flow:** OCR → JSON output → Classification Model → Risk & Disposal Recommendation.

This ensures **end-to-end automation** with minimal manual intervention and high confidence scoring.

---

##  **Security & Ethics**

*  Bias monitoring and explainable AI for fairness
*  Role-based access control (Admin, CHW, Household)
*  HTTPS + input validation for data safety
*  Ethical retention of expired medicine data for traceability

---

##  **Future Enhancements**

* Push notifications for CHW pickup updates
* Real-time CHW location tracking (map integration)
* Multi-language support (Kinyarwanda, English, French)
* Offline mode with caching and service workers
* Barcode scanning and appointment scheduling

---

##  **Contributing**

To contribute or deploy a production instance:

1. Replace mock APIs with real backend endpoints
2. Implement authentication (JWT)
3. Add form validation and unit tests
4. Set up CI/CD pipeline and monitoring

---

##  **License**

This project is for **educational and demonstration purposes** under an open license.

---

##  **Support & Contact**

**Email:** [support@umutisafe.rw](mailto:support@umutisafe.rw)
**GitHub Issues:** [UmutiSafe Frontend Repo](https://github.com/umutisafe/frontend)

---

**Built with a courage in Rwanda for safe, ethical, and sustainable medicine disposal.**

