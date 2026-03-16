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

1. **Dashboard security events** - Fixed (removed exit_count reference)
2. **Completion tracking** - Fixed (is_complete flag)
3. **Speed test routing** - Fixed (TestTypeRouter)

---

**Ready? Let's start testing!** 

Which section would you like to test first? I can help you:
- Create test data
- Check specific functionality
- Debug any issues found
