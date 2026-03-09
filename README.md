# CRRT â€” Club Robotique & Recherche Technologique

> **ENSA Agadir** | Since 2008 | "Our robots never sleep."

A full-stack platform for CRRT (Club Robotique & Recherche Technologique) at ENSA Agadir, built with the **"Mature Glass Lab"** design language.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Apply migrations
npx prisma migrate dev

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
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Custom CSS variables |
| Database | Prisma 6 + PostgreSQL |
| Auth | NextAuth.js |
| UI | shadcn/ui + custom CRRT components |
| Animation | Framer Motion + IntersectionObserver |
| Icons | Lucide React |
| Deploy | Docker Compose |

---

## Project Structure

```
crrt/
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma         # 18 models (auth, content, forms, config)
â”‚   â””â”€â”€ seed.ts               # Full seed with realistic CRRT data
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ (public)/         # Public site pages
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx      # Home (hero, tracks, projects, posts, partners)
â”‚   â”‚   â”‚   â”œâ”€â”€ events/       # Events index + [slug] detail
â”‚   â”‚   â”‚   â”œâ”€â”€ projects/     # Projects index + [slug] detail
â”‚   â”‚   â”‚   â”œâ”€â”€ blog/         # Blog index + [slug] detail
â”‚   â”‚   â”‚   â”œâ”€â”€ about/        # Mission, team, timeline
â”‚   â”‚   â”‚   â””â”€â”€ forms/        # Public form rendering + submission
â”‚   â”‚   â”œâ”€â”€ (admin)/admin/    # Admin panel
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx      # Dashboard
â”‚   â”‚   â”‚   â”œâ”€â”€ theme/        # Theme Studio
â”‚   â”‚   â”‚   â”œâ”€â”€ home/         # Home Studio
â”‚   â”‚   â”‚   â”œâ”€â”€ navigation/   # Navigation Studio
â”‚   â”‚   â”‚   â”œâ”€â”€ events/       # Events CRUD
â”‚   â”‚   â”‚   â”œâ”€â”€ projects/     # Projects CRUD
â”‚   â”‚   â”‚   â”œâ”€â”€ posts/        # Posts CRUD
â”‚   â”‚   â”‚   â”œâ”€â”€ media/        # Media Studio
â”‚   â”‚   â”‚   â”œâ”€â”€ forms/        # Form Builder + templates
â”‚   â”‚   â”‚   â”œâ”€â”€ inbox/        # Unified submissions
â”‚   â”‚   â”‚   â”œâ”€â”€ email-templates/ # Email templates
â”‚   â”‚   â”‚   â””â”€â”€ settings/     # Platform settings
â”‚   â”‚   â”œâ”€â”€ api/              # API routes
â”‚   â”‚   â”œâ”€â”€ globals.css       # Design system + tokens
â”‚   â”‚   â””â”€â”€ layout.tsx        # Root layout
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ crrt/             # Signature components
â”‚   â”‚   â”‚   â”œâ”€â”€ blueprint-timeline.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ circuit-trace.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ lab-gallery.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ lens-card.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ next-event-panel.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ signal-cta.tsx
â”‚   â”‚   â”‚   â””â”€â”€ track-chips.tsx
â”‚   â”‚   â”œâ”€â”€ admin/            # Admin components
â”‚   â”‚   â”‚   â”œâ”€â”€ studio-shell.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ content-editor.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ content-list.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ form-builder.tsx
â”‚   â”‚   â”‚   â””â”€â”€ live-preview-split.tsx
â”‚   â”‚   â””â”€â”€ layout/           # Shell components
â”‚   â”‚       â”œâ”€â”€ glass-nav.tsx
â”‚   â”‚       â””â”€â”€ site-footer.tsx
â”‚   â””â”€â”€ lib/
â”‚       â””â”€â”€ prisma.ts         # Prisma singleton
â”œâ”€â”€ Dockerfile                # Multi-stage production build
â”œâ”€â”€ docker-compose.yml        # Deployment config
â””â”€â”€ .env                      # Environment variables
```

---

## Design System â€” "Mature Glass Lab"

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

- **Headings**: Space Grotesk (400â€“700)
- **Body**: Inter (400â€“600)
- **Arabic/RTL**: Noto Sans Arabic (400â€“700)

### Glass Utilities

```css
.glass-surface  /* header/nav glass â€” blurred, clipped */
.glass-card     /* content card â€” frosted glass border */
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
| `GlassNav` | Sticky header â†’ compact pill on scroll |
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
| `StudioShell` | Sidebar + âŒ˜K command palette |
| `LivePreviewSplit` | Editor + preview (desktop/tablet/mobile/RTL) |
| `ContentListClient` | Search + filter + action table |
| `ContentEditor` | Dynamic field renderer + publish toggle |
| `FormBuilderClient` | 3-pane: library â†’ canvas â†’ inspector |

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
| Milestones | 10 | 2008â€“2025 timeline |
| Team Members | 12 | 8 current bureau + 4 alumni with LinkedIn |
| Partners | 6 | ENSA, OCP, Arduino, UM6P, IAM, JLCPCB |
| Navigation | 9 | 5 header + 4 footer items |
| Forms | 2 | Published with 8-10 fields each |
| Submissions | 5 | Realistic registration data |
| Media | 6 | Entries with used-in references |

### Re-seeding

```bash
# Reset and re-seed
npx prisma migrate reset --skip-seed
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
cp .env.production.example .env.production
docker compose --env-file .env.production --profile production up -d --build
```

This starts:
- `postgres` with persistent storage
- `migrate` one-shot container (`prisma migrate deploy`)
- `app` on port 3000 with `/api/health` health checks

### Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `DATABASE_URL` | Prisma connection string (`postgresql://...`) |
| `NEXTAUTH_SECRET` | NextAuth secret (required) |
| `NEXTAUTH_URL` | Public base URL (required) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender address used by outbound email |
| `ADMIN_EMAIL` | Optional recipient for admin notifications |

### External Reverse Proxy (TLS)

Production TLS is expected to be terminated by an external reverse proxy (Nginx, Caddy, Traefik, etc.).
Forward traffic to `app:3000` and preserve standard headers:
- `Host`
- `X-Forwarded-Proto`
- `X-Forwarded-For`

---
## Scripts

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run db:migrate # Create/apply local migrations in development
npm run db:deploy # Apply migrations in production
npm run db:seed   # Run seed script
npm run db:reset  # Reset + migrate + seed
npm run db:studio # Open Prisma Studio
```

---

## License

Built for CRRT â€” Club Robotique & Recherche Technologique, ENSA Agadir.


