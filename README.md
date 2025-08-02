# 🏙️ CivicTrack — TechWizards Hackathon Project

**CivicTrack** is a full-stack web application for reporting, tracking, and managing civic issues in urban communities. Citizens can easily raise complaints like potholes, garbage overflow, water leakage, and more, while authorities can monitor and resolve them via a dedicated admin panel.

Built using **Next.js**, **Django REST Framework**, **MongoDB**, and a custom **PyTorch ML model** for issue classification.

---

## 🚀 Features

- 🔐 User authentication with JWT
- 📍 Submit civic reports with geolocation and photo evidence
- 🗺️ Interactive map to browse and search reports
- 🧠 ML-powered classification into 6 categories (e.g., Pothole, Garbage, Water Leakage)
- 🛠️ Admin dashboard for report/user management
- 📱 Fully responsive UI with Tailwind CSS & shadcn/ui
- 🔗 RESTful APIs built with Django & MongoDB

---

## 🧠 Machine Learning

CivicTrack includes an NLP-based text classification model trained with PyTorch. When a user submits a report description, the model automatically classifies it into one of six categories:
- Water Leakage
- Garbage
- Pothole
- Noise
- Streetlight Issue
- Open Drain

The model is seamlessly integrated into the backend to assist real-time issue tagging.

---

## 📁 Project Structure

```

urban-waste-app/
├── app/           # Next.js frontend
├── backend/       # Django backend (MongoDB-compatible)
├── components/    # Reusable React components
├── contexts/      # Global React contexts
├── hooks/         # Custom React hooks
├── lib/           # Shared utilities & API logic
├── public/        # Static assets
├── scripts/       # Utility scripts
├── styles/        # Tailwind global styles
├── package.json   # Frontend package config
├── tailwind.config.ts
└── README.md

````

---

## ⚙️ Getting Started

### 🧩 Backend (Django)

1. **Install dependencies**
   
   cd backend
   python -m venv venv
   # Activate:
   # Windows: venv\Scripts\activate
   # macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt


3. **Environment setup**

   * Copy `.env.example` → `.env`
   * Add your **MongoDB URI**, **SECRET\_KEY**, etc.

4. **Run server**

   ```bash
   python manage.py migrate
   python manage.py runserver
   # API at http://localhost:8000/api/
   ```

---

### 🌐 Frontend (Next.js)

1. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Start development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   # Available at http://localhost:3000/
   ```

---

## 🧪 Testing

### Backend

```bash
cd backend
python manage.py test
```

### Frontend

Set up tests using Jest, React Testing Library, or your preferred framework.

---

## 🔗 API Reference

See [`backend/README.md`](backend/README.md) for detailed API routes and schema.

---

## 👨‍💻 Contributors

Team **TechWizards** – Built during \[Hackathon Name]

* Backend: Django API, MongoDB, ML integration
* Frontend: Next.js UI with Tailwind
* ML: PyTorch model for issue classification

