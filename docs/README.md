# Documentation Archive

This folder contains archived documentation from the previous architecture (FastAPI + PostgreSQL).

**Note**: These documents are kept for reference only. The current project uses a new architecture (Supabase + JSON).

---

## 📚 Archived Documents

### Old Architecture Documentation
- **ARCHITECTURE.md** - Old system architecture (FastAPI + PostgreSQL)
- **API_SPECIFICATION.md** - Old REST API documentation
- **DEPLOYMENT_GUIDE.md** - Old deployment instructions
- **PRODUCTION_DEPLOYMENT_GUIDE.md** - Old production deployment guide

### Old Development Plans
- **DEVELOPMENT_PLAN.md** - Old 10-12 day development plan
- **PROJECT_STATUS.md** - Old project status (85% complete)
- **QUICK_REFERENCE.md** - Old quick reference guide

### Old Feature Documentation
- **FEATURES.md** - Old feature specifications
- **feteaur.md** - Duplicate/typo file
- **DOCUMENTATION_SUMMARY.md** - Old documentation summary

### Database & Offline
- **DATABASE_MIGRATION_README.md** - Old Alembic migration guide
- **OFFLINE_STRATEGY.md** - Old offline strategy

---

## ✅ Current Documentation

For current project documentation, see:

### Root Level (Active)
- **CLIENT_ROADMAP.md** - Client presentation (20-day plan) ⭐
- **ROADMAP.md** - Technical roadmap (detailed) ⭐
- **README.md** - Project overview ⭐

### Steering Files (Active)
- **.kiro/steering/structure.md** - Project structure guidelines
- **.kiro/steering/tech.md** - Technology stack guidelines
- **.kiro/steering/product.md** - Product requirements

---

## 🏗️ Architecture Change

### Old Architecture (Archived)
```
Mobile App → FastAPI Backend → PostgreSQL Database
- Cost: $6-12/month
- Development: 10-12 days
- Offline: Poor
- Updates: Requires app store approval
```

### New Architecture (Current)
```
Mobile App → Supabase (Auth + User Data) + JSON Files (Questions)
- Cost: $0/month (up to 50K users)
- Development: 20 days (more realistic timeline)
- Offline: Excellent (questions cached locally)
- Updates: Instant (no app store approval)
```

---

## 📝 Why Keep These Files?

These archived documents are kept for:
1. **Reference**: Understanding previous design decisions
2. **Learning**: Comparing old vs new architecture
3. **History**: Project evolution documentation
4. **Backup**: In case any information is needed

---

**For current development, always refer to CLIENT_ROADMAP.md and ROADMAP.md in the root folder.**
