# 🏗️ Navkar Dynamic QR Manager
### Complete Setup Guide for Beginners

---

## 📂 COMPLETE FOLDER STRUCTURE

```
navkar-qr-manager/
│
├── .gitignore                    ← Tells Git what NOT to upload
│
├── frontend/                     ← React website (what users see)
│   ├── index.html                ← 🔴 MAIN HTML FILE (Vite entry point)
│   ├── vite.config.js            ← Vite build settings
│   ├── tailwind.config.js        ← Tailwind CSS settings
│   ├── postcss.config.js         ← CSS processor settings
│   ├── package.json              ← Frontend packages list
│   ├── .env.example              ← Copy this to .env and fill values
│   │
│   └── src/
│       ├── main.jsx              ← 🔴 React entry point (mounts to index.html)
│       ├── App.jsx               ← All routes defined here
│       ├── index.css             ← Global styles + Tailwind
│       │
│       ├── context/
│       │   ├── AuthContext.jsx   ← Login/logout state management
│       │   └── ThemeContext.jsx  ← Dark/light mode state
│       │
│       ├── lib/
│       │   ├── supabase.js       ← Supabase database connection
│       │   ├── api.js            ← Calls to backend server
│       │   └── utils.js          ← Helper functions
│       │
│       ├── components/
│       │   └── layout/
│       │       ├── AppLayout.jsx ← Main wrapper with sidebar + header
│       │       └── Sidebar.jsx   ← Left navigation menu
│       │
│       └── pages/
│           ├── auth/
│           │   └── Login.jsx     ← Login page
│           ├── Dashboard.jsx     ← Home dashboard
│           ├── QRCodes.jsx       ← QR code table/list
│           ├── CreateQR.jsx      ← Create new QR form
│           ├── EditQR.jsx        ← Edit QR + change URL
│           ├── Analytics.jsx     ← Charts and scan data
│           ├── DesignStudio.jsx  ← QR design customizer
│           ├── BulkUpload.jsx    ← Excel import
│           └── Settings.jsx      ← App settings
│
├── backend/                      ← Node.js server (runs on your computer/server)
│   ├── server.js                 ← 🔴 Main server file
│   ├── package.json              ← Backend packages list
│   ├── .env.example              ← Copy to .env and fill values
│   │
│   └── src/
│       ├── routes/
│       │   ├── redirect.js       ← /p/:qrId → redirects QR scans
│       │   ├── auth.js           ← Login/logout API
│       │   ├── qrcodes.js        ← Create/edit/delete QR codes
│       │   ├── analytics.js      ← Scan statistics
│       │   ├── bulk.js           ← Excel bulk upload
│       │   ├── templates.js      ← QR design templates
│       │   ├── categories.js     ← Product categories
│       │   └── settings.js       ← App settings
│       │
│       ├── middleware/
│       │   ├── auth.js           ← Checks if user is logged in
│       │   └── rateLimit.js      ← Prevents spam
│       │
│       └── utils/
│           └── logger.js         ← Logging
│
└── database/
    └── schema.sql                ← 🔴 Run this in Supabase SQL Editor
```

---

## 🚀 STEP-BY-STEP SETUP (Beginner Friendly)

### STEP 1: Install Required Software

Download and install these (in order):

1. **Node.js** → https://nodejs.org (download LTS version)
   - After install, open Terminal and type: `node --version`
   - Should show: `v18.x.x` or higher ✅

2. **Git** → https://git-scm.com
   - After install, type: `git --version`
   - Should show: `git version 2.x.x` ✅

3. **VS Code** (code editor) → https://code.visualstudio.com

---

### STEP 2: Create Supabase Project (Free Database)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New Project"**
3. Name it: `navkar-qr-manager`
4. Set a database password (save this!)
5. Choose region closest to India: **South Asia (Mumbai)**
6. Wait 2 minutes for project to be ready

**Now set up the database:**

7. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
8. Click **"New Query"**
9. Open the file: `database/schema.sql` from your project
10. Copy ALL the content and paste it in the SQL Editor
11. Click **"Run"** (green button)
12. Should say: "Success. No rows returned" ✅

**Get your API keys:**

13. Click **"Settings"** → **"API"** in Supabase sidebar
14. Copy these two values (you'll need them soon):
    - `Project URL` (looks like: https://xxxx.supabase.co)
    - `anon public` key (long text starting with "eyJ...")

**Create your admin user:**

15. In Supabase, click **"Authentication"** → **"Users"**
16. Click **"Invite user"** or **"Add user"**
17. Enter your email and set a password
18. This is your login for the dashboard!

---

### STEP 3: Set Up the Frontend (React Website)

Open Terminal (or VS Code terminal):

```bash
# Go into the frontend folder
cd navkar-qr-manager/frontend

# Install all packages (takes 1-2 minutes)
npm install

# Create your .env file from the example
cp .env.example .env
```

Now open `.env` file and fill in your values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001/api
VITE_QR_BASE_URL=http://localhost:3001
```

**Start the frontend:**

```bash
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173** 🎉

---

### STEP 4: Set Up the Backend (Node.js Server)

Open a **NEW** terminal window:

```bash
# Go into the backend folder
cd navkar-qr-manager/backend

# Install all packages
npm install

# Create your .env file
cp .env.example .env
```

Open backend `.env` and fill in:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
QR_BASE_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173
```

**Where to find SUPABASE_SERVICE_KEY:**
- Supabase Dashboard → Settings → API → **"service_role"** key (secret - never expose publicly!)

**Start the backend:**

```bash
npm run dev
```

Should show:
```
✅ Navkar QR Manager Backend running on port 3001
```

---

### STEP 5: Test Everything

1. Go to **http://localhost:5173** in browser
2. Login with the email/password you created in Supabase
3. You should see the dashboard! 🎉

**Test a QR code:**
1. Click "Create QR Code"
2. Fill in product name, code, and URL
3. Click Save
4. Copy the QR URL (e.g., `http://localhost:3001/p/NP001`)
5. Paste in browser — it should redirect! ✅

---

## 📤 STEP 6: Upload to GitHub

```bash
# In the main navkar-qr-manager folder:
git init
git add .
git commit -m "Initial commit: Navkar QR Manager"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/navkar-qr-manager.git
git push -u origin main
```

**⚠️ IMPORTANT:** The `.gitignore` file ensures your `.env` files with passwords are NOT uploaded to GitHub!

---

## 🌐 STEP 7: Deploy to Vercel (Make it Live Online)

### Deploy Frontend:

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"New Project"** → Select your GitHub repo
3. Set **Root Directory** to: `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_SUPABASE_URL = your value
   VITE_SUPABASE_ANON_KEY = your value
   VITE_API_URL = https://your-backend.vercel.app/api
   VITE_QR_BASE_URL = https://your-backend.vercel.app
   ```
5. Click Deploy! ✅

### Deploy Backend:

1. In Vercel, create another new project
2. Set **Root Directory** to: `backend`
3. Add all the backend environment variables
4. After deploy, copy the URL (e.g., `https://navkar-backend.vercel.app`)
5. Update your frontend env: `VITE_API_URL=https://navkar-backend.vercel.app/api`

---

## ❓ COMMON PROBLEMS & FIXES

| Problem | Fix |
|---------|-----|
| `npm install` fails | Make sure Node.js is installed: `node --version` |
| Login doesn't work | Check your Supabase URL and anon key in `.env` |
| "Cannot connect to server" | Make sure backend is running on port 3001 |
| QR redirect not working | Make sure backend is running and `QR_BASE_URL` matches |
| Database error | Check if you ran `schema.sql` in Supabase SQL Editor |
| CORS error | Add your frontend URL to `CORS_ORIGINS` in backend `.env` |

---

## 📱 HOW THE DYNAMIC QR WORKS

```
1. You create QR code for product:
   QR ID: NP001
   Destination: https://navkarplywood.com/product-a

2. QR is printed and stickered on 1000 products.
   The QR contains: https://qr.navkarplywood.com/p/NP001

3. Customer scans → Your server receives the scan
   → Looks up NP001 in database
   → Redirects to https://navkarplywood.com/product-a

4. Later, you launch a new product page.
   You edit NP001 in the dashboard:
   New URL: https://navkarplywood.com/new-product-page

5. Same printed QR now redirects to the NEW URL!
   The physical sticker on 1000 products still works. ✅
```

---

## 💡 WHAT TO DO IF YOU'RE STUCK

1. **Read the error message** — it usually tells you exactly what's wrong
2. **Check the terminal** — errors appear there, not in the browser
3. **Make sure both servers are running** (frontend on 5173, backend on 3001)
4. **Check .env files** — most problems are missing environment variables
5. **Ask ChatGPT** — paste the exact error message and ask for help!

---

## 📞 TECH SUPPORT QUICK REFERENCE

- **Supabase Dashboard:** https://app.supabase.com
- **Your Frontend:** http://localhost:5173 (local) or your Vercel URL
- **Your Backend:** http://localhost:3001 (local) or your Vercel URL
- **Health Check:** http://localhost:3001/health

---

*Built for Navkar Plywood · Powered by React + Supabase + Express*
