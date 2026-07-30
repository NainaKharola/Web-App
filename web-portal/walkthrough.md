# Walkthrough - PDF fixes and User Activity Log

We have successfully resolved the PDF blank-tab issue and implemented the complete **User Activity Log** system.

---

## 1. PDF Window Fixes
- **Headless Launch Override**: Fixed `pdfService.js` to force `headless: true` when running on local Windows, preventing a visible Chrome window from remaining open during local runs.
- **Fetch-to-Blob Downloads**: Updated `StudentDashboard.jsx` FileLink, `GyapanPreview.jsx`, and `OfferLetterPreview.jsx` download options to fetch pdfs as blobs and trigger download natively, preventing blank browser tabs from opening.
- **Hidden Iframe Printing**: Modified `Certificates.jsx` print action to render the print stream inside a hidden iframe, triggering the native print dialog directly.

---

## 2. User Activity Log System
- **Activity Log Model**: Created the [ActivityLog.js](file:///c:/Users/DELL/Downloads/Web-Portal/backend/models/ActivityLog.js) schema using `localStorageService` persistence (`backend/data/activityLogs.json`).
- **Activity Logger Utility**: Created a reusable [activityLogger.js](file:///c:/Users/DELL/Downloads/Web-Portal/backend/utils/activityLogger.js) utility to record module, action, description, status, IP address, and admin user credentials.
- **Activity Integration Across Modules**:
  - **Student Module**: Logs student review updates (edit, approve, reject), deletes, and training details saves in `adminStudentController.js`.
  - **Offer Letters**: Logs creation, PDF generation, and emails in `offerLetterController.js`.
  - **Certificates**: Logs prints and buffer changes in `adminStudentController.js`.
  - **Joining ISM**: Logs ISM preview generation and PDF printing in `gyapanController.js`.
  - **Administration Module**: Logs division configs, seat capacity updates, branch-division links, and deletions in `administrationController.js`.
  - **Management Module**: Logs colleges, branches, courses, and durations CRUD actions in `collegeController.js` and `managementController.js`.
  - **Profile Module**: Logs password changes and sub-user CRUD events in `adminAuthController.js`.
- **API Retrival & Export**:
  - Implemented `GET /api/admin/users/:id/activity` route to fetch logs sorted chronologically.
  - Implemented `GET /api/admin/users/:id/activity/export` route converting activities to professional PDF tables via headless Puppeteer or direct UTF-8 CSVs for Microsoft Excel.
- **Frontend Admin Panel Integration**:
  - Added "Actions" column in User Management tab of [AdminProfile.jsx](file:///c:/Users/DELL/Downloads/Web-Portal/web-portal/src/pages/AdminProfile.jsx).
  - Show "View Activity" button ONLY for Sub-Users, hidden for Main Admins.
  - Implemented a wide modal with live text search, date filters, module filters, action filters, and "Export PDF" / "Export Excel" download handlers.
