# Deployment Guide — Free Cloud Hosting

## Step 1: MongoDB Atlas (Free Database)

1. Go to https://cloud.mongodb.com and sign up (free)
2. Create a **free M0 cluster** (choose any region)
3. Create a database user:
   - Username: `eduadmin`
   - Password: (create a strong password, save it)
4. Under **Network Access** → Add IP Address → **Allow from anywhere** (0.0.0.0/0)
5. Click **Connect** → **Drivers** → copy the connection string
   - It looks like: `mongodb+srv://eduadmin:<password>@cluster0.xxxxx.mongodb.net/`
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://eduadmin:password@cluster0.xxxxx.mongodb.net/edu_portal`

---

## Step 2: Push Code to GitHub

1. Go to https://github.com and create a new repository (e.g. `edu-portal`)
2. In your project folder, open Git Bash and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edu-portal.git
git push -u origin main
```

---

## Step 3: Deploy on Render.com (Free Hosting)

1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub repo `edu-portal`
4. Fill in:
   - **Name**: `edu-portal`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = any random long string (e.g. `mySecretKey2024XYZ`)
   - `PORT` = `5000`
6. Click **Create Web Service**
7. Render gives you a URL like: `https://edu-portal.onrender.com`

---

## Step 4: Create Admin Account

After deployment, run this once to create your admin account.
Open browser console on your site and run:

```javascript
fetch('https://edu-portal.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sampathirao Yoganandh',
    rollNo: 'ADMIN001',
    email: 'sampathiraoyoganandh@gmail.com',
    password: 'your_admin_password',
    role: 'admin'
  })
}).then(r=>r.json()).then(console.log)
```

Then manually set role to admin in MongoDB Atlas:
- Go to Atlas → Browse Collections → users
- Find your record → Edit → change `role` to `"admin"`

---

## Step 5: Test Locally

```bash
cd backend
npm install
# Create .env file from .env.example and fill in values
node server.js
```

Open: http://localhost:5000

---

## File Structure

```
java GIT/
├── backend/
│   ├── server.js          ← Express app entry point
│   ├── package.json
│   ├── .env.example       ← Copy to .env and fill values
│   ├── routes/
│   │   ├── auth.js        ← Login, Register, JWT
│   │   ├── quiz.js        ← Save scores, fetch history
│   │   └── admin.js       ← Admin-only routes
│   ├── models/
│   │   ├── User.js        ← Student/Admin schema
│   │   └── QuizResult.js  ← Quiz scores schema
│   └── middleware/
│       └── auth.js        ← JWT verification
├── login.html             ← Student login page
├── register.html          ← Student register page
├── dashboard.html         ← Student progress dashboard
├── admin.html             ← Admin panel
├── index.html             ← Home page
├── courses.html           ← JPP course
└── devops_courses.html    ← DevOps course
```
