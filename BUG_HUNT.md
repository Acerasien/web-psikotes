# Bug Hunt Checklist - Web Psikotes

## 🔐 Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Logout and verify redirect
- [ ] Session persistence (refresh page)
- [ ] Token expiration handling

## 👥 Admin Panel
### Dashboard
- [ ] Dashboard loads without errors
- [ ] Pie chart displays correctly
- [ ] Security events show (if any exist)
- [ ] Incomplete submissions count is accurate
- [ ] Recent completions table displays

### Participants
- [ ] View participant list
- [ ] Search participants
- [ ] Add new participant
- [ ] Edit participant
- [ ] Delete participant (single)
- [ ] Delete participants (bulk)
- [ ] Assign test to participant
- [ ] Assign all tests
- [ ] Unlock locked test
- [ ] View participant profile
- [ ] Mobile view (card layout)

### Results
- [ ] View results table
- [ ] Filter by test
- [ ] Filter by date range
- [ ] Search by participant
- [ ] Expand result details
- [ ] Mobile view (card layout)

### Security (Superadmin)
- [ ] View locked assignments
- [ ] View exit logs

## 🧪 Test Taking (Participant)
### General
- [ ] Start test from dashboard
- [ ] Tutorial shows before test (if not completed)
- [ ] Fullscreen enforcement works
- [ ] Timer counts down correctly
- [ ] Question navigation works (next/prev)
- [ ] Question indicator grid works
- [ ] Answer selection works
- [ ] Submit confirmation modal
- [ ] Test submission success
- [ ] Redirect to dashboard after submit

### DISC Test
- [ ] Most/Least selection works
- [ ] All questions must be answered
- [ ] Mobile card view works
- [ ] Submission validation

### Speed Test
- [ ] Auto-advance to next question
- [ ] Keyboard shortcuts (1-9)
- [ ] Can skip questions
- [ ] Progress bar updates
- [ ] Timer visible and working

### Memory Test
- [ ] Encoding phase shows table
- [ ] Timer for encoding phase
- [ ] Recall phase starts automatically
- [ ] Question navigation works
- [ ] Flag questions works

### Logic Test
- [ ] Questions display correctly
- [ ] Navigation works
- [ ] Flag questions works
- [ ] Timer works

### Temperament Test
- [ ] Questions display correctly
- [ ] Navigation works
- [ ] Timer works

## 📱 Mobile Responsiveness
### Admin Panel
- [ ] Sidebar collapses/opens (hamburger menu)
- [ ] Participants page (card view)
- [ ] Results page (card view)
- [ ] Dashboard (pie chart responsive)

### Participant
- [ ] Dashboard cards
- [ ] Test screens (all types)
- [ ] Question navigation (scrollable)
- [ ] Touch targets (min 44px)
- [ ] Modals (positioned correctly)

## ⚠️ Edge Cases
- [ ] Start test with no internet
- [ ] Refresh during test
- [ ] Browser back button during test
- [ ] Multiple tabs with same test
- [ ] Submit test with timeout
- [ ] Exit fullscreen multiple times (lock test)
- [ ] View completed test (should not restart)
- [ ] Assign duplicate test (should show error)

## 📊 Data Integrity
- [ ] Completion status updates correctly
- [ ] Score calculation accurate
- [ ] Incomplete tests flagged correctly
- [ ] Security events logged
- [ ] Results match submissions

## 🔄 Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

---

## How to Use This Checklist

1. **Open two browser windows:**
   - Window 1: Admin (superadmin account)
   - Window 2: Participant account

2. **Go through each section** and test systematically

3. **For each bug found:**
   - Note the steps to reproduce
   - Expected vs actual behavior
   - Browser/device info
   - Screenshot if applicable

4. **Priority rating:**
   - 🔴 Critical: App crashes, data loss
   - 🟡 High: Feature broken, workaround exists
   - 🟢 Low: UI glitch, minor inconvenience

---

## Known Issues to Verify

1. **Dashboard security events** - ✅ Fixed (removed exit_count reference)
2. **Completion tracking** - ✅ Fixed (is_complete flag)
3. **Speed test routing** - ✅ Fixed (TestTypeRouter)
4. **Speed Test score showing 0/100** - ✅ Fixed (stale closure in handleSubmit)
5. **PDF export duplicate "Laporan"** - ✅ Fixed (deduplicated results by test_id)
6. **Incomplete test results not recorded** - ✅ Fixed (all tests now use refs for stable state)
7. **Duplicate test submission on timer expiry** - ✅ Fixed (added isSubmittingRef + database lock)
8. **Export function location** - ✅ Clarified (Export is in ResultsPage.jsx, not ResultsTable - superadmin only)

---

## Bugs Fixed (March 26, 2026)

### 1. Duplicate Test Submission on Timer Expiry 🔴 Critical
**Issue:** When the test timer ran out, the result was submitted twice, causing duplicate entries in the database.

**Root Cause:** Race condition in timer effects across all test components. When timer reached 0:
1. Timer interval calls `handleSubmit(true)`
2. `setTimeLeft(0)` triggers effect re-run (dependency on `timeLeft`)
3. Interval could fire twice before cleanup completed
4. Multiple `handleSubmit` calls executed concurrently

**Fix:** Added `isSubmittingRef` flag to prevent duplicate submissions:
- Frontend: Added ref-based lock in all test components
- Backend: Added `with_for_update()` database lock and re-check assignment status before creating result

**Files Changed:**
- `client/src/hooks/useTestSession.js` - Added isSubmittingRef
- `client/src/components/DISCTest.jsx` - Added isSubmittingRef
- `client/src/components/LogicTest.jsx` - Added isSubmittingRef
- `client/src/components/MemoryTest.jsx` - Added isSubmittingRef (recall timer)
- `client/src/components/TemperamentTest.jsx` - Added isSubmittingRef
- `server/routes/assignments.py` - Added database lock with `with_for_update()`

---

### 2. Speed Test Score Always 0/100 🔴 Critical
**Issue:** When the Speed Test timer ran out, the score showed 0/100 even though answers were selected.

**Root Cause:** Stale closure in `handleSubmit` - the function captured an empty `answers` state. When the timer called `handleSubmit(true)`, it submitted an empty array.

**Fix:**
- Added `answersRef` to store latest answers
- Added `formatAnswers` callback passed to `useTestSession` hook
- Hook now calls `formatAnswers()` on timeout to get answers from the component's ref

**Files Changed:**
- `client/src/components/tests/SpeedTest.jsx`
- `client/src/hooks/useTestSession.js`

---

### 3. All Tests - Answers Not Submitted on Timeout 🔴 Critical
**Issue:** Logic, Memory, and Temperament tests had the same stale closure issue - answers weren't submitted when timer ran out.

**Root Cause:** `handleSubmit` used `answers` state directly instead of a stable ref reference.

**Fix:** Added refs to all test components:
- `answersRef` - stores latest answers
- `testDataRef` - stores test configuration
- `timeLeftRef` - stores current timer value
- `questionsRef` - stores questions list (where applicable)

**Files Changed:**
- `client/src/components/LogicTest.jsx`
- `client/src/components/MemoryTest.jsx`
- `client/src/components/TemperamentTest.jsx`

**Note:** DISCTest already had proper ref handling. StandardTest uses `useTestSession` hook which handles refs internally.

---

### 4. PDF Export Shows Duplicate Test Results 🟡 High
**Issue:** When exporting participant PDF, tests appeared multiple times if the participant had retaken them.

**Root Cause:** Backend fetched all results without deduplication.

**Fix:** Added deduplication logic to keep only the latest result per test_id.

**Files Changed:**
- `server/routes/results.py` - `export_participant_pdf()` and `export_participant_results()`

---

### 5. PDF "Laporan" Narrative Duplication 🟢 Low
**Issue:** DISC test narrative in PDF had repetitive text ("Berdasarkan hasil tes DISC" appeared twice).

**Root Cause:** Narrative was built by concatenating multiple strings with redundant phrases.

**Fix:** Consolidated narrative into a single, concise paragraph.

**Files Changed:**
- `server/services/pdf_report.py`

---

### 7. Results Page - Missing Pagination 🟡 High
**Issue:** Results page displays all results at once, causing performance issues and difficult navigation when there are many results.

**Fix:** Added pagination with 10 items per page:
- Page number buttons with smart ellipsis (shows first/last pages, current ±2 pages)
- Previous/Next buttons
- Mobile and desktop pagination controls
- Shows "X to Y of Z results" indicator
- Resets to page 1 when filters change

**Files Changed:**
- `client/src/components/ResultsTable.jsx` - Added pagination logic and UI

---

### 8. Long Names Breaking Layout 🟢 Low
**Issue:** Long participant names and test names overflow their containers in Results, Participants, and Dashboard pages, breaking the table layout.

**Fix:** Added text truncation with max-width and tooltip titles:
- Results page: Participant names max 200px, test names max 150px
- Participants page: Names max 200px with proper flex layout
- Dashboard page: Recent completions - participant names max 200px, test names max 150px
- Added `title` attribute for hover tooltip showing full text
- Mobile card view already had truncation (verified)

**Files Changed:**
- `client/src/components/ResultsTable.jsx` - Added truncate classes and max-width
- `client/src/pages/ParticipantsPage.jsx` - Added truncate classes and min-w-0 flex layout
- `client/src/pages/Dashboard.jsx` - Added truncate classes to Recent Activity table

---

### 9. Add Participant Page Improvements 🟢 Enhancement
**Issue:** Add Participant page had basic UI with no validation, poor error handling, and unclear form layout.

**Fix:** Complete UI/UX overhaul with:
- **Form Validation:**
  - Username: required, min 3 characters
  - Password: required, min 6 characters
  - Full name: required
  - Age: 1-120 range validation
  - Real-time error display with field highlighting
  
- **Improved Layout:**
  - Organized into "Required" and "Optional" sections
  - Clear section headers with borders
  - Better spacing and grouping
  - Placeholder text for guidance
  
- **Better UX:**
  - Loading state with spinner on submit button
  - Success/error notifications with SweetAlert
  - Clear Form button to reset all fields
  - Auto-focus on first error field
  - Error clears when user starts typing
  - Trim whitespace from inputs
  
- **Enhanced Page:**
  - Better header with back button
  - Help section with tips
  - Responsive layout

**Files Changed:**
- `client/src/CreateUser.jsx` - Complete rewrite with validation and better UI
- `client/src/pages/AddParticipantPage.jsx` - Improved page layout and help section

---

### 6. Environment Configuration Bug 🟡 High
**Issue:** Login failed with "invalid credentials" even with correct username/password.

**Root Cause:** Multiple `.env` files with conflicting API URLs:
- `.env` had `http://localhost:8000`
- `.env.local` had `http://10.10.1.221:8000` (higher priority in Vite)

**Fix:** Updated `.env.local` to use `http://localhost:8000`

**Files Changed:**
- `client/.env.local`

**Note:** Vite .env priority (highest to lowest):
1. `.env.local`
2. `.env.development.local`
3. `.env.development`
4. `.env`

---

**Ready? Let's start testing!**

Which section would you like to test first? I can help you:
- Create test data
- Check specific functionality
- Debug any issues found
