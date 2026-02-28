# CRRT — Club Robotique & Recherche Technologique

> **ENSA Agadir** | Since 2008 | "Our robots never sleep."

A full-stack platform for CRRT (Club Robotique & Recherche Technologique) at ENSA Agadir, built with the **"Mature Glass Lab"** design language.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initialize the database
npx prisma db push

# 3. Seed with realistic data
npx tsx prisma/seed.ts

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Custom CSS variables |
| Database | Prisma 6 + SQLite |
| Auth | NextAuth.js |
| UI | shadcn/ui + custom CRRT components |
| Animation | Framer Motion + IntersectionObserver |
| Icons | Lucide React |
| Deploy | Docker Compose |

---

## Project Structure

```
crrt/
├── prisma/
│   ├── schema.prisma         # 18 models (auth, content, forms, config)
│   └── seed.ts               # Full seed with realistic CRRT data
├── src/
│   ├── app/
│   │   ├── (public)/         # Public site pages
│   │   │   ├── page.tsx      # Home (hero, tracks, projects, posts, partners)
│   │   │   ├── events/       # Events index + [slug] detail
│   │   │   ├── projects/     # Projects index + [slug] detail
│   │   │   ├── blog/         # Blog index + [slug] detail
│   │   │   ├── about/        # Mission, team, timeline
│   │   │   └── forms/        # Public form rendering + submission
│   │   ├── (admin)/admin/    # Admin panel
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── theme/        # Theme Studio
│   │   │   ├── home/         # Home Studio
│   │   │   ├── navigation/   # Navigation Studio
│   │   │   ├── events/       # Events CRUD
│   │   │   ├── projects/     # Projects CRUD
│   │   │   ├── posts/        # Posts CRUD
│   │   │   ├── media/        # Media Studio
│   │   │   ├── forms/        # Form Builder + templates
│   │   │   ├── inbox/        # Unified submissions
│   │   │   ├── email-templates/ # Email templates
│   │   │   └── settings/     # Platform settings
│   │   ├── api/              # API routes
│   │   ├── globals.css       # Design system + tokens
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── crrt/             # Signature components
│   │   │   ├── blueprint-timeline.tsx
│   │   │   ├── circuit-trace.tsx
│   │   │   ├── lab-gallery.tsx
│   │   │   ├── lens-card.tsx
│   │   │   ├── next-event-panel.tsx
│   │   │   ├── signal-cta.tsx
│   │   │   └── track-chips.tsx
│   │   ├── admin/            # Admin components
│   │   │   ├── studio-shell.tsx
│   │   │   ├── content-editor.tsx
│   │   │   ├── content-list.tsx
│   │   │   ├── form-builder.tsx
│   │   │   └── live-preview-split.tsx
│   │   └── layout/           # Shell components
│   │       ├── glass-nav.tsx
│   │       └── site-footer.tsx
│   └── lib/
│       └── prisma.ts         # Prisma singleton
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # Deployment config
└── .env                      # Environment variables
```

---

## Design System — "Mature Glass Lab"

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--midnight` | `#0B1120` | Page background |
| `--midnight-light` | `#111827` | Card surfaces |
| `--ice-white` | `#F8FAFC` | Headings |
| `--steel-gray` | `#94A3B8` | Body text |
| `--signal-orange` | `#F97316` | Accent, CTA |
| `--ghost-white` | `rgba(248,250,252,0.05)` | Glass fill |
| `--ghost-border` | `rgba(248,250,252,0.08)` | Borders |

### Typography

- **Headings**: Space Grotesk (400–700)
- **Body**: Inter (400–600)
- **Arabic/RTL**: Noto Sans Arabic (400–700)

### Glass Utilities

```css
.glass-surface  /* header/nav glass — blurred, clipped */
.glass-card     /* content card — frosted glass border */
```

### Motion

All animations respect `prefers-reduced-motion`:

- **Blueprint Reveal**: section title underline traces
- **Signal Pulse**: one-time viewport-triggered CTA pulse
- **Robotics Parallax**: subtle 6px hero parallax (desktop only)

---

## Signature Components

### Public

| Component | Description |
|-----------|-------------|
| `GlassNav` | Sticky header → compact pill on scroll |
| `NextEventPanel` | Glass countdown to next event |
| `BlueprintTimeline` | Alternating timeline with signal trace |
| `SignalCTA` | Button with one-time pulse animation |
| `LensCard` | Circular media frame + hover bloom |
| `LabGallery` | Contact-sheet grid + lightbox |
| `TrackChips` | CRRT tags mapped to labeled chips |
| `CircuitTrace` | Decorative SVG background traces |

### Admin

| Component | Description |
|-----------|-------------|
| `StudioShell` | Sidebar + ⌘K command palette |
| `LivePreviewSplit` | Editor + preview (desktop/tablet/mobile/RTL) |
| `ContentListClient` | Search + filter + action table |
| `ContentEditor` | Dynamic field renderer + publish toggle |
| `FormBuilderClient` | 3-pane: library → canvas → inspector |

---

## Admin Panel

### Studios Overview

| Studio | Route | Controls |
|--------|-------|----------|
| Dashboard | `/admin` | 6-stat grid, recent events |
| Theme Studio | `/admin/theme` | Colors, radius, glass, noise, motion, variants |
| Home Studio | `/admin/home` | Hero text, event source, tracks, featured projects |
| Navigation | `/admin/navigation` | Header/footer items, visibility toggles |
| Events | `/admin/events` | CRUD with search, type, status |
| Projects | `/admin/projects` | CRUD with stack tags |
| Posts | `/admin/posts` | CRUD with markdown |
| Media | `/admin/media` | Grid/list, used-in refs, copy URL |
| Form Builder | `/admin/forms` | 3-pane, 4 CRRT templates |
| Inbox | `/admin/inbox` | Status workflow, CSV export |
| Email Templates | `/admin/email-templates` | 4 defaults with `{{variables}}` |
| Settings | `/admin/settings` | General, SMTP, Security |

### Form Builder Templates

| Template | Fields | Use Case |
|----------|--------|----------|
| Training Registration | 8 | Arduino, Raspberry Pi workshops |
| Competition Registration | 10 | Team-based robotics competitions |
| Membership Application | 7 | New member intake |
| Partner / Sponsor Intake | 5 | Sponsorship proposals |

---

## Seed Data

The seed (`prisma/seed.ts`) populates the database with realistic CRRT content:

| Entity | Count | Details |
|--------|-------|---------|
| Tags | 10 | EN/FR/AR labels, colors, icons |
| Events | 6 | Training, conference, competition, workshop, hackathon |
| Speakers | 7 | With bios and roles |
| Projects | 6 | Detailed markdown with code, tables, specs |
| Posts | 6 | Technical tutorials (Arduino, PID, CV, ESP32, 3D printing, ROS2) |
| Content Tags | 20 | Cross-references between content and tags |
| Milestones | 10 | 2008–2025 timeline |
| Team Members | 12 | 8 current bureau + 4 alumni with LinkedIn |
| Partners | 6 | ENSA, OCP, Arduino, UM6P, IAM, JLCPCB |
| Navigation | 9 | 5 header + 4 footer items |
| Forms | 2 | Published with 8-10 fields each |
| Submissions | 5 | Realistic registration data |
| Media | 6 | Entries with used-in references |

### Re-seeding

```bash
# Reset and re-seed
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET/PUT` | `/api/admin/theme` | Theme settings |
| `GET/PUT` | `/api/admin/home` | Home configuration |
| `PUT` | `/api/admin/navigation` | Replace nav items |
| `POST` | `/api/admin/events` | Create event |
| `PUT/DELETE` | `/api/admin/events/[id]` | Update/delete event |
| `POST` | `/api/admin/projects` | Create project |
| `PUT/DELETE` | `/api/admin/projects/[id]` | Update/delete project |
| `POST` | `/api/admin/posts` | Create post |
| `PUT/DELETE` | `/api/admin/posts/[id]` | Update/delete post |
| `POST` | `/api/admin/forms` | Create form |
| `PUT/DELETE` | `/api/admin/forms/[id]` | Update/delete form |
| `PUT` | `/api/admin/submissions/[id]` | Update submission status |
| `POST` | `/api/forms/submit` | Public form submission |

---

## Deployment

### Docker Compose

```bash
docker compose up -d
```

This starts the app on port 3000 with:
- SQLite persistent volume
- Health check every 30s
- Environment variable passthrough

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite path |
| `NEXTAUTH_SECRET` | — | Auth secret (required for production) |
| `NEXTAUTH_URL` | `http://localhost:3000` | Base URL |
| `SMTP_HOST` | `smtp.gmail.com` | Email server |
| `SMTP_PORT` | `587` | Email port |
| `SMTP_USER` | — | Email username |
| `SMTP_PASS` | — | Email password |

---

## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run db:push   # Push schema to database
npm run db:seed   # Run seed script
npm run db:reset  # Reset + migrate + seed
npm run db:studio # Open Prisma Studio
```

---

## License

Built for CRRT — Club Robotique & Recherche Technologique, ENSA Agadir.
