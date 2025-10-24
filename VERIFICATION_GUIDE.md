# Quick Verification Guide

## How to Test the Fixes

### Test 1: Character Count on Dashboard

1. **Navigate to Dashboard**
   - Go to the Dashboard view
   - Note the current character count (should be 0 initially)

2. **Create a Character**
   - Switch to Planning view
   - Click "Characters" tab
   - Click "Add Character" or the "+" button
   - Fill in character details:
     - Name: "Henry" (or any name)
     - Role: Select a role (protagonist, antagonist, etc.)
     - Description: Add some text
   - Click "Save"

3. **Verify Dashboard Updates**
   - Switch back to Dashboard view
   - Check the middle tile (where it shows stats)
   - **Expected**: "Characters: 1" should appear immediately
   - **No refresh needed!**

4. **Test Persistence**
   - Refresh the browser (F5 or Cmd+R)
   - Go to Dashboard
   - **Expected**: "Characters: 1" still shows

5. **Test Multiple Characters**
   - Create a second character
   - Dashboard should show "Characters: 2"

---

### Test 2: Analytics Session Tracking

#### Part A: First Writing Session

1. **Start Fresh**
   - Create a new project or use existing one
   - Navigate to Writing view

2. **Write Some Content**
   - Type at least 20-30 words in the editor
   - This could be:
     ```
     The old house stood at the end of the lane,
     weathered and worn by years of neglect.
     Sarah approached cautiously, her hand trembling
     as she reached for the rusted doorknob.
     ```

3. **Wait 10 Seconds**
   - Session auto-saves every 10 seconds
   - Just wait a bit after typing

4. **Check Analytics**
   - Navigate to Analytics view
   - **Expected Results**:
     - "Total Words" shows your word count (e.g., "30")
     - "Writing Days" shows "1"
     - "Daily Average" shows your word count
     - "Recent Sessions" shows today's date with word count

#### Part B: Continued Writing

5. **Write More**
   - Go back to Writing view
   - Add another 20-30 words
   - Wait 10 seconds

6. **Refresh Analytics**
   - Go to Analytics again
   - **Expected**: Total words increased (e.g., "60")
   - Same date session updated with new word count

#### Part C: Persistence Test

7. **Close and Reopen**
   - Close the browser tab/window
   - Reopen the application
   - Navigate to Analytics
   - **Expected**: All session data persists

---

### Test 3: Fallback Behavior (New Users)

1. **Scenario**: User has written but no sessions yet
   - This can happen if testing locally before session tracking was added
2. **Expected Behavior**:
   - Analytics shows current document word count
   - Yellow notice displays:
     > "Session Tracking Starting  
     > Analytics will track your writing sessions going forward..."
3. **After Next Writing Session**:
   - Yellow notice disappears
   - Real session data starts showing

---

### Test 4: Multi-Project Isolation

1. **Create Two Projects**
   - Create "Project A" and "Project B"

2. **Add Characters to Project A**
   - Create 2 characters in Project A
   - Dashboard shows "Characters: 2"

3. **Switch to Project B**
   - Select Project B
   - Dashboard shows "Characters: 0"
   - Characters are properly isolated per project

4. **Write in Both Projects**
   - Write 100 words in Project A
   - Write 50 words in Project B
   - Analytics for each project shows correct, isolated data

---

## Common Issues & Solutions

### Issue: Character count shows 0 after creating character

**Cause**: Old version of component still in memory  
**Solution**:

- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Clear localStorage and retry
- Check browser console for errors

### Issue: Analytics still shows "No sessions"

**Cause**: Session not saving yet  
**Solution**:

- Make sure you've typed at least a few words
- Wait 10+ seconds after typing
- Try refreshing the page
- Check localStorage key: `sessions-{projectId}`

### Issue: Words show but no session appears

**Cause**: Using fallback data (pre-session-tracking content)  
**Expected**: This is normal! Yellow notice should explain.  
**Solution**: Continue writing, new sessions will start tracking

---

## Developer Verification (Console Commands)

### Check Characters in localStorage

```javascript
// Get all projects
const projects = JSON.parse(localStorage.getItem('inkwell_projects') || '[]');

// Check current project's characters
const currentId = localStorage.getItem('inkwell_current_project_id');
const currentProject = projects.find((p) => p.id === currentId);
console.log('Characters:', currentProject?.characters);
```

### Check Sessions in localStorage

```javascript
// Get current project ID
const projectId = localStorage.getItem('inkwell_current_project_id');

// Get sessions for that project
const sessions = JSON.parse(localStorage.getItem(`sessions-${projectId}`) || '[]');
console.log('Sessions:', sessions);
```

### Force Save Session (for testing)

```javascript
// This would normally be called automatically
const projectId = localStorage.getItem('inkwell_current_project_id');
const today = new Date().toISOString().split('T')[0];
const sessions = JSON.parse(localStorage.getItem(`sessions-${projectId}`) || '[]');

sessions.push({
  date: today,
  wordCount: 100,
  duration: 15,
});

localStorage.setItem(`sessions-${projectId}`, JSON.stringify(sessions));
console.log('Test session added!');
```

---

## Success Criteria

✅ **Character Count Fix**

- [ ] Character count shows immediately after creation
- [ ] Character count persists after refresh
- [ ] Character count updates on delete
- [ ] Character count is per-project (isolated)

✅ **Analytics Fix**

- [ ] Sessions appear in "Recent Sessions" after writing
- [ ] All tiles show non-zero values after writing
- [ ] Sessions persist across page refreshes
- [ ] Analytics is per-project (isolated)
- [ ] Fallback notice shows for new users appropriately

✅ **Overall**

- [ ] No console errors during testing
- [ ] Build completes successfully
- [ ] UI updates are immediate (no refresh needed)
- [ ] Data persists in localStorage correctly
