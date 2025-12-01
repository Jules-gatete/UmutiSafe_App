#  **UmutiSafe – Medicine Disposal & CHW Integration Platform**

**UmutiSafe** is an AI-powered web platform that helps households in Rwanda safely dispose of unused or expired medicines while connecting them with **Community Health Workers (CHWs)**.
It combines **machine learning classification**, **OCR analysis**, and **interactive dashboards** to ensure safe, ethical, and traceable medicine disposal.


*A complete, end-to-end documentation for running, testing, and deploying the entire UmutiSafe system.*

---

## **Overview**

**The platform integrates:

* Machine Learning-based medicine classification
* OCR-assisted label text extraction
* Community Health Worker (CHW) pickup coordination
* User, CHW, and Admin dashboards
* Secure backend API and database
* Ethical guidelines aligned with Rwanda FDA and national data laws

The solution addresses unsafe household disposal practices and supports Rwanda’s One Health and FDA-approved disposal framework.

---

## **Live System Links**

| Component                       | Link                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Frontend Application**        | [https://umuti-safe-app.vercel.app/login](https://umuti-safe-app.vercel.app/login)                       |
| **Backend API (Render)**        | [https://umutisafe-backend.onrender.com](https://umutisafe-backend.onrender.com)                         |
| **Backend Repository**          | [https://github.com/Jules-gatete/UmutiSafe_Backend](https://github.com/Jules-gatete/UmutiSafe_Backend)   |
| **AI Model Repository**         | [https://github.com/Jules-gatete/FastAPI.git](https://github.com/Jules-gatete/FastAPI.git)               |
| **AI Model API (DigitalOcean)** | [https://plankton-app-2c2ae.ondigitalocean.app/docs](https://plankton-app-2c2ae.ondigitalocean.app/docs) |
| **System landing page**           | [UmutiSafe](https://landing-page-steel-ten-82.vercel.app/#home)                                             |

---

# **System Architecture**

The UmutiSafe platform consists of three coordinated services:

### **1. Frontend (React + Vite)**

User interface for:

* Households (medicine classification and guidance, pickups & education tips)
* CHWs (pickup management)
* Admins (system management)

### **2. Backend API (Node.js + Express.js + Supabase/PostgreSQL)**

Responsible for:

* Authentication (JWT)
* CRUD operations for users, medicines, disposals, CHWs
* Analytics and reporting
* Secure database access via Sequelize ORM

### **3. AI Model Server (FastAPI + ML Models)**

Handles:

* OCR text extraction
* Text embeddings (MiniLM-L6-v2)
* Classification (Random Forest / XGBoost)
* Multi-label disposal and handling recommendations

All services communicate through REST APIs.

---

# **Technology Stack**

| Layer      | Tools                                                                |
| ---------- | -------------------------------------------------------------------- |
| Frontend   | React 18, Vite, TailwindCSS, Recharts, Lucide Icons, Context API     |
| Backend    | Node.js, Express.js, Supabase PostgreSQL, Sequelize ORM, JWT, Multer |
| AI Model   | FastAPI, Sentence-BERT, Random Forest, XGBoost, EasyOCR              |
| Deployment | Vercel, Render, DigitalOcean                                         |
| Security   | Helmet, CORS, bcrypt, HTTPS, Input Validation                        |

---

# **How to Run the Entire System Locally**

Below are the complete setup instructions for moderators and developers.

---

# **1. Clone All Repositories**

```bash
git clone https://github.com/Jules-gatete/UmutiSafe_Backend
git clone https://github.com/Jules-gatete/UmutiSafe_Frontend
git clone https://github.com/Jules-gatete/FastAPI.git
```

---

# **2. Start the Backend (Node.js + PostgreSQL/Supabase)**

### Install dependencies:

```bash
cd UmutiSafe_Backend
npm install
```

### Configure environment:

```bash
cp .env.example .env
```

Update `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=umutisafe_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

### Start backend:

```bash
npm run dev
```

Backend runs at:

```
http://localhost:5000/api
```

---

# **3. Start the AI Model Server (FastAPI)**

### Setup:

```bash
cd FastAPI
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Start server:

```bash
uvicorn api:app --host 0.0.0.0 --port 9000
```

AI Model runs at:

```
http://localhost:9000/docs
```

---

# **4. Start the Frontend (React + Vite)**

```bash
cd UmutiSafe_Frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# **5. Connect All Services**

Set in frontend `.env`:

```env
VITE_BACKEND_URL=http://localhost1000/api
VITE_AI_MODEL_URL=http://localhost:0000
```

Restart the frontend after editing.

---

# **Testing the Full Workflow**

A complete end-to-end test covers:

1. Uploading a medicine image
2. OCR text extraction
3. ML-based disposal classification
4. Display of guidance + risk level
5. Requesting CHW pickup
6. CHW accepting/declining pickup
7. Admin viewing analytics dashboard

---

# **AI Model Capabilities**

### Inputs:

* Text (generic name)
* Image (EasyOCR → text → embeddings)

### Outputs:

* Dosage form (top-3)
* Manufacturer (top-3)
* Disposal category (single)
* Method(s) of disposal (multi-label)
* Handling instructions (retrieved text)
* Remarks and safety notes

### Components:

* Sentence-BERT MiniLM-L6-v2 embeddings
* Random Forest classifier
* XGBoost alternative
* MultiOutputClassifier
* Nearest-neighbor similarity search
* EasyOCR

---

# **Backend API Summary**

| Endpoint Group     | Purpose                     |
| ------------------ | --------------------------- |
| `/api/auth/*`      | Authentication & user login |
| `/api/disposals/*` | Disposal records management |
| `/api/pickups/*`   | CHW pickup workflows        |
| `/api/medicines/*` | Medicine registry CRUD      |
| `/api/chws/*`      | CHW management              |
| `/api/admin/*`     | Admin analytics & reporting |

---

# **Security Features**

* JWT authentication
* Secure password hashing with bcrypt
* Input validation
* Protected routes by role
* Helmet middleware
* CORS control
* SQL-injection protection
* OCR images never stored (processed in-memory)

---

# **CHW Workflow**

1. Household requests pickup
2. CHW receives request in dashboard
3. CHW accepts or declines
4. User receives updated status
5. Pickup completed → record stored

---

# **Deployment Overview**

| Component | Platform     |
| --------- | ------------ |
| Frontend  | Vercel       |
| Backend   | Render       |
| AI Model  | DigitalOcean |

Each platform must be configured with the required environment variables.

---

# **Future Enhancements**

* Push notifications for CHW updates
* Multi-language support (Kinyarwanda, English, French)
* Offline mode via service workers
* GPS-based CHW location
* Barcode scanning

---

# **Contributing**

1. Create a feature branch
2. Commit changes
3. Open a pull request
4. Ensure unit tests pass
5. Follow project code standards

---

# **License**

This project is developed for educational and research purposes under ALU guidelines.

---

# **Support & Contact**

**Email:** [support@umutisafe.rw](mailto:support@umutisafe.rw)
**Platform:** [https://umuti-safe-app.vercel.app/login](https://umuti-safe-app.vercel.app/login)

---

# **Built with purpose in Rwanda — for safe, ethical, and sustainable medicine disposal.**

