# Polish Checklist – Quantum-Page AI v1.0 Launch

Use this list to track final clean-ups before pushing to staging / production.

## 1 Code Quality
- [ ] Run `npm run lint` & fix all ESLint/TypeScript warnings  
- [ ] Remove unused components, mock helpers, console logs  
- [ ] Enforce absolute import aliases (`@/`) in **all** new files  
- [ ] Split large React components (>300 LOC) into composables/hooks  
- [ ] Add JSDoc to exported helpers in `src/lib/`  
- [ ] Generate Prisma types (`prisma generate`) after last schema change

## 2 Styling & UX
- [ ] Verify dark-mode contrast (WCAG AA) on all new form fields  
- [ ] Align sidebar icons (16 px grid) & add tooltip labels  
- [ ] Harmonise spacing (Tailwind `gap-4`, `pt-6`) across forms  
- [ ] Replace placeholder favicon / logos with final SVG assets  
- [ ] Test responsive breakpoints on iPad Mini & Galaxy Fold

## 3 Performance
- [ ] Preload Google Fonts via `<link rel="preload" as="style">`  
- [ ] Audit Lighthouse – target **90+** perf & best-practice scores  
- [ ] Lazy-load heavy charts (`dynamic(import(), { ssr:false })`)  
- [ ] Compress uploaded logos on client (browser image compression)  
- [ ] Enable Next.js image optimisation for external domains list

## 4 Backend Hardening
- [ ] Move job worker to separate Vercel/Render background process  
- [ ] Add progress updates (25/50/75 %) inside `buildGoogleSiteAndPDF`  
- [ ] Catch Puppeteer timeouts; surface error to Job row  
- [ ] Validate `cloudPlatform` enum in API route before queueing  
- [ ] Limit build concurrency (max 3 parallel) to avoid API quotas

## 5 Security
- [ ] Store Google service-account JSON in **Secrets Manager**, not repo  
- [ ] Sanitize all custom HTML via `xss` before saving  
- [ ] Add CSRF protection to all POST routes with `next-csrf`  
- [ ] Enable Prisma strict-mode (`"strict": true` in `clientExtensions`)  
- [ ] Rotate JWT signing key & set 30-day expiry

## 6 Database & Migrations
- [ ] Add index on `Job.status` + `updatedAt` for polling efficiency  
- [ ] Back-fill `Job.progress` default to 0 on existing rows  
- [ ] Write migration script to drop temp mock tables

## 7 Testing
- [ ] Raise Jest coverage to **>80 %** statements  
- [ ] Snapshot test BuilderForm with all toggles enabled  
- [ ] Integration test `/api/site-builder` happy-path (Supertest)  
- [ ] Add e2e Cypress spec: create site → watch status → download PDF

## 8 CI/CD Pipeline
- [ ] Add `pnpm install --frozen-lockfile` to GitHub Action  
- [ ] Cache Prisma engines & Next build artefacts  
- [ ] Auto-run Lighthouse CI on preview deployment  
- [ ] Block merge if ESLint/Unit tests fail

## 9 Documentation
- [ ] Update README with `DATABASE_URL` & Google credentials setup  
- [ ] Add Postman collection + GraphQL schema docs to `/docs/api`  
- [ ] Record 2-min loom of Site Builder workflow for QA team  
- [ ] Version CHANGELOG for `v1.0.0`

## 10 Deployment Prep
- [ ] Provision production DB (Supabase / PlanetScale) & migrate  
- [ ] Set `NEXT_PUBLIC_APP_URL` & `GOOGLE_APPLICATION_CREDENTIALS` envs  
- [ ] Configure AWS S3 bucket for PDF storage + 365-day lifecycle  
- [ ] Point `dashboard.quantumpage.ai` to Vercel prod URL via CNAME  
- [ ] Smoke-test build on staging, then toggle “production” in CI

When every box is checked, tag the release and start the deploy 🚀
