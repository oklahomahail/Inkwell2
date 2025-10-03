# 🖋️ Inkwell Tester Guide

Welcome to testing Inkwell - an AI-powered fiction writing platform! This guide will help you effectively test all the key features.

## 🚀 Quick Start

### Access the App

- **Live App**: Visit your deployed Vercel URL (check your Vercel dashboard)
- **GitHub Repo**: https://github.com/oklahomahail/Inkwell2
- **Status**: All critical features implemented and deployment-ready

### First Time Setup

1. Open the app in your browser
2. The app uses **local storage** - no account needed!
3. Start by creating a new project
4. Everything saves automatically to your browser

## 🎯 Key Features to Test

### ✅ **1. Project Management**

**What to test:**

- Create a new project
- Edit project details
- Switch between projects
- Check that data persists on refresh

**Expected behavior:**

- Projects save automatically
- Data should persist between browser sessions
- Clean, intuitive project switching

### ✅ **2. Writing Interface**

**What to test:**

- Create chapters and scenes
- Use the rich text editor (TipTap)
- Word count tracking
- Auto-save functionality

**Key shortcuts to try:**

- `⌘/Ctrl + 1-4` - Switch between tabs
- `⌘/Ctrl + K` - Open command palette
- `⌘/Ctrl + S` - Manual save
- `F11` or focus button - Enter focus mode

### ✅ **3. AI Integration (Claude)**

**What to test:**

- **AI Text Insertion**: Select text → use AI tools → insert generated content
- **Consistency Guardian**: Check for story consistency
- **Story Architect**: Get plot suggestions and story structure advice

**Test scenarios:**

- Write a paragraph, select it, ask AI to expand
- Create characters, then ask Consistency Guardian to check for conflicts
- Use Story Architect for plot development

### ✅ **4. Focus Mode** 🎯

**What to test:**

- Enter focus mode (F11 or focus button)
- Try writing sprints with timer
- Test typewriter mode
- Zen mode (minimal UI)
- Ambient sounds toggle

**Expected behavior:**

- Distraction-free fullscreen writing
- Sprint timer counts down correctly
- Settings persist between sessions

### ✅ **5. Search Functionality**

**What to test:**

- Search across scenes, chapters, characters
- Full-text search with highlighting
- Search performance with larger documents

**Test with:**

- Character names
- Plot points
- Specific phrases from your writing

### ✅ **6. Backup & Restore** 🛡️

**What to test:**

- Create manual backups
- Export backups (download JSON files)
- Import backups from files
- Restore from previous backup points

**Critical test:**

- Create some content → backup → make changes → restore backup
- Should return to previous state perfectly

### ✅ **7. Data Persistence**

**What to test:**

- Write content → close browser → reopen → content should be there
- Multiple browser tabs working simultaneously
- No data loss during browser crashes

## 🐛 **What to Look For**

### 🚨 **Critical Issues**

- Data loss or corruption
- App crashes or white screens
- Features completely not working
- Performance issues (slow loading, freezing)

### ⚠️ **Important Issues**

- UI/UX problems
- Confusing workflows
- Missing feedback to user actions
- Inconsistent behavior

### 💡 **Nice-to-Have Feedback**

- Feature suggestions
- UI improvements
- Workflow optimizations
- Additional shortcuts or tools

## 🧪 **Test Scenarios**

### **Scenario 1: New User Journey**

1. Open app for first time
2. Create a project called "My Test Novel"
3. Create first chapter "Chapter 1: The Beginning"
4. Write 2-3 paragraphs
5. Use AI to expand on a selected sentence
6. Save and refresh browser - data should persist

### **Scenario 2: Advanced Writing**

1. Create multiple chapters and scenes
2. Use Focus Mode for distraction-free writing
3. Set up a writing sprint (5 minutes)
4. Test search across your content
5. Create a backup of your work

### **Scenario 3: AI-Assisted Writing**

1. Write a character description
2. Use Consistency Guardian to check for issues
3. Select a paragraph and ask AI to rewrite it
4. Use Story Architect for plot suggestions
5. Insert AI-generated content into your story

### **Scenario 4: Recovery Testing**

1. Write significant content
2. Create a backup
3. Make major changes
4. Restore the backup
5. Verify original content is restored

## 📊 **Feedback Areas**

### **Performance**

- How fast does the app load?
- Any lag when typing or switching between sections?
- Search speed with larger documents?

### **User Experience**

- Is the interface intuitive?
- Are the features discoverable?
- Any confusing workflows?

### **AI Features**

- Quality of AI suggestions
- Relevance of generated content
- Consistency Guardian accuracy

### **Reliability**

- Any crashes or errors?
- Data persistence working correctly?
- Backup/restore functioning properly?

## 🆘 **Reporting Issues**

When you find issues, please include:

1. **What you were doing** (step-by-step)
2. **What you expected to happen**
3. **What actually happened**
4. **Browser and OS** (Chrome/Firefox/Safari on Mac/Windows)
5. **Screenshots** (if visual issues)
6. **Console errors** (F12 → Console tab → screenshot any red errors)

## ✨ **Pro Testing Tips**

- **Try edge cases**: Very long text, special characters, empty fields
- **Test persistence**: Always try refreshing the browser mid-task
- **Use keyboard shortcuts**: Test the command palette (⌘K)
- **Mobile testing**: Try on tablet/phone if possible
- **Different browsers**: Test in Chrome, Firefox, Safari if available

## 🎉 **Current Status**

✅ **Ready for Testing**: All critical features implemented  
✅ **Deployment Ready**: No blocking bugs  
✅ **AI Integration**: Claude API fully working  
✅ **Data Safety**: Backup/restore system implemented  
✅ **Performance**: Optimized for production

---

## 📞 **Questions or Issues?**

Reach out with any questions about testing or if you encounter any issues. Focus on realistic writing workflows and don't hesitate to be thorough - better to catch issues now than after launch!

Happy testing! 🚀
