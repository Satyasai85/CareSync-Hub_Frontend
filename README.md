# CareSync Hub Frontend

ReactJS frontend for the Hospital Appointment & Patient Management System.

## Live Links

- Frontend app: `https://care-sync-hub-frontend.vercel.app`
- Backend API: `https://caresync-hub-backend.onrender.com`
- GitHub repository: `https://github.com/Satyasai85/CareSync-Hub_Frontend`
- Video recording: add the final 5 to 8 minute recording link before submission.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Default local app URL: `http://localhost:5173`

Set `VITE_API_URL=http://localhost:5000` for local backend testing. The deployed app should use `https://caresync-hub-backend.onrender.com`.

## Demo Login

Use the login screen to enter one of the seeded accounts.

Password for every account: `demo123`

| Role | Email |
| --- | --- |
| Admin | `admin@caresync.test` |
| Receptionist | `reception@caresync.test` |
| Doctor | `neha.rao@caresync.test` |
| Patient | `aarav@caresync.test` |

## Implemented Screens

- Polished demo login with role-based workspaces.
- Analytics dashboard with total appointments, active patients, completed consultations, open visits, and doctor workload.
- Doctor listing with specialization, rooms, ratings, and availability slots.
- Doctor profile creation and availability management.
- Patient registration with profile, emergency contact, blood group, and allergy fields.
- Appointment booking with backend double-booking and availability validation.
- Receptionist/admin appointment confirmation, reschedule, and cancellation.
- Doctor consultation status updates.
- Consultation record creation with diagnosis, treatment, and prescription details.
- Patient medical history and visit timeline.
- Search and filters by doctor/patient text, date, and status.
- Downloadable appointment and consultation CSV reports.

## Production Checklist

- Run `npm run build` before deployment.
- Confirm `VITE_API_URL` points to the deployed Render backend in Vercel.
- Record a 5 to 8 minute demo showing login, patient registration, booking validation, reschedule/cancel, doctor consultation completion, medical history, CSV reports, SQLite persistence, and deployed links.
- Add final screenshots after opening the deployed app:
  - Login screen
  - Analytics dashboard
  - Appointment booking flow
  - Doctor consultation form
  - Medical history page

## Submission Links

- GitHub repository link: `https://github.com/Satyasai85/CareSync-Hub_Frontend`
- Deployed/published application link: `https://care-sync-hub-frontend.vercel.app`
