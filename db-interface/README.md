# MCQ Admin Interface

A secure web interface for managing medical exam questions.

---

## 🎯 Features

- ✅ **Secure Authentication** - Admin login required
- ✅ **Role-Based Access** - Only admins/managers can add questions
- ✅ **Question Management** - Add, edit, delete questions
- ✅ **Module Management** - Organize by year, module, exam type
- ✅ **Resource Management** - Add course resources


---



## 🔐 For Production Hosting

**Follow these guides in order:**

### 1. SECURE_SETUP.md
- Install auth dependencies
- Get service role key
- Create admin users
- Test locally

### 2. DEPLOYMENT_GUIDE.md
- Deploy to Vercel
- Configure environment variables
- Set up custom domain
- Manage admin users

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `SECURE_SETUP.md` | Setup authentication (5 min) |
| `DEPLOYMENT_GUIDE.md` | Deploy to production (10 min) |
| `QUICK_FIX.md` | Fix RLS errors (30 sec) |
| `SUPABASE_SETUP.md` | Initial Supabase setup |
| `QUICK_START.md` | Quick reference |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Admin Users (Browser)           │
└────────────────┬────────────────────────┘
                 │ HTTPS
                 ↓
┌─────────────────────────────────────────┐
│      Next.js App (Vercel/Netlify)       │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Login Page   │  │  API Routes     │ │
│  │ (Client)     │  │  (Server-side)  │ │
│  │              │  │                 │ │
│  │ anon key     │  │  service key    │ │
│  └──────────────┘  └─────────────────┘ │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│            Supabase                      │
│  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │ Database │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

---

## 🔒 Security

### ✅ What's Secure

- Authentication required (Supabase Auth)
- Role-based access control
- RLS enabled on database
- Service key server-side only
- HTTPS encryption
- Session management

### ⚠️ Important

- Never commit `.env.local` to git
- Never expose service role key to client
- Use strong passwords for admin accounts
- Keep RLS enabled in production

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15.2
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (recommended)

---

## 📋 Environment Variables

```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Secret (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🎯 Use Cases

### Local Development
- Test features
- Debug issues
- Quick prototyping

### Production Hosting
- Multiple admins
- Remote access
- Secure and scalable

---

## 📞 Support

- **Supabase Issues:** Check `SUPABASE_SETUP.md`
- **Auth Issues:** Check `SECURE_SETUP.md`
- **Deployment Issues:** Check `DEPLOYMENT_GUIDE.md`
- **RLS Errors:** Check `QUICK_FIX.md`

---

## 🎉 Ready to Deploy?

1. ✅ Read `SECURE_SETUP.md`
2. ✅ Test locally
3. ✅ Read `DEPLOYMENT_GUIDE.md`
4. ✅ Deploy to Vercel
5. ✅ Share with admin team!

---

**Made with ❤️ for medical students**
