# 🧪 TESTING GUIDE - RIZQUNA ERP 2.0

## 🚀 QUICK START

### **1. Start Development Server**
```bash
cd admin-panel
npm install
npm run dev
```

**Expected Output:**
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

---

## 📝 TESTING CHECKLIST

### **AUTH PAGES (3 pages)**

#### **1. Login Page** ✅
```
URL: http://localhost:3000/login

Test:
[ ] Page loads correctly
[ ] Gradient background displays
[ ] Form inputs work
[ ] Email validation works
[ ] Password validation works
[ ] "Login" button works
[ ] "Google Login" button visible
[ ] "Register" link works
[ ] Responsive on mobile
[ ] Animations smooth

Visual Check:
[ ] Split screen layout
[ ] Logo displays
[ ] Brand colors correct
[ ] Features section visible
[ ] No layout issues
```

#### **2. Register Page** ✅
```
URL: http://localhost:3000/register

Test:
[ ] Page loads correctly
[ ] Form inputs work
[ ] Name validation (min 3 chars)
[ ] Email validation
[ ] Phone validation
[ ] Password validation (min 8 chars)
[ ] Password confirmation
[ ] Terms & conditions checkbox
[ ] Submit button works
[ ] Success state displays
[ ] Redirect to login works
[ ] Responsive on mobile

Visual Check:
[ ] Clean form design
[ ] Success icon displays
[ ] Features section visible
[ ] No layout issues
```

#### **3. Author Register Page** ✅
```
URL: http://localhost:3000/author-register

Test:
[ ] Page loads correctly
[ ] Step indicator displays (4 steps)
[ ] Progress bar works
[ ] Step 1: Account info validation
[ ] Step 2: Profile info validation
[ ] Step 3: Bank info validation
[ ] Step 4: Success state
[ ] Back/Next buttons work
[ ] Form submission works
[ ] Success message displays
[ ] Responsive on mobile

Visual Check:
[ ] Multi-step wizard design
[ ] Progress bar animates
[ ] Step icons display
[ ] No layout issues
```

---

### **MAIN PAGES (4 pages)**

#### **4. Dashboard** ✅
```
URL: http://localhost:3000/dashboard

Test:
[ ] Page loads correctly
[ ] Sidebar collapsible
[ ] Header displays user info
[ ] Stats cards display (4 cards)
[ ] Charts render correctly
[ ] Data tables load
[ ] Hover effects work
[ ] Responsive on mobile

Visual Check:
[ ] Gradient stat cards
[ ] Area chart displays
[ ] Bar chart displays
[ ] Tables formatted correctly
[ ] No layout issues
```

#### **5. Book Catalog** ✅
```
URL: http://localhost:3000/katalog

Test:
[ ] Page loads correctly
[ ] Search bar works
[ ] Category filter works
[ ] Book grid displays (12 books)
[ ] Book cards hover effect
[ ] Pagination works
[ ] Book detail navigation
[ ] Empty state (if no results)
[ ] Loading state
[ ] Responsive on mobile

Visual Check:
[ ] Book cover images load
[ ] Cards have shadow
[ ] Bestseller tags display
[ ] Grid layout correct
[ ] No layout issues
```

#### **6. Author Portal** ✅
```
URL: http://localhost:3000/penulis

Test:
[ ] Page loads correctly
[ ] User avatar displays
[ ] Stats cards display (4 cards)
[ ] Quick actions buttons work
[ ] Recent books table loads
[ ] Progress indicators work
[ ] "Kirim Naskah" button works
[ ] Responsive on mobile

Visual Check:
[ ] Welcome header
[ ] Gradient stat cards
[ ] Progress bars animate
[ ] Tables formatted correctly
[ ] No layout issues
```

---

### **ADMIN PAGES (3 pages)**

#### **7. Finance Dashboard** ✅
```
URL: http://localhost:3000/finance

Test:
[ ] Page loads correctly
[ ] Stats cards display (4 cards)
[ ] Revenue/Expense tracking
[ ] Invoice table loads
[ ] Expense table loads
[ ] Cash flow progress bars
[ ] Quick actions work
[ ] Responsive on mobile

Visual Check:
[ ] Gradient stat cards
[ ] Tables formatted correctly
[ ] Progress bars display
[ ] No layout issues
```

#### **8. Percetakan Dashboard** ✅
```
URL: http://localhost:3000/percetakan

Test:
[ ] Page loads correctly
[ ] Stats cards display (4 cards)
[ ] Order table loads
[ ] Production stages display (3)
[ ] Progress indicators work
[ ] Quick actions work
[ ] "Order Baru" button works
[ ] Responsive on mobile

Visual Check:
[ ] Gradient stat cards
[ ] Stage cards display
[ ] Progress bars animate
[ ] Tables formatted correctly
[ ] No layout issues
```

---

## 🎨 VISUAL TESTING

### **Design Consistency**
```
[ ] All pages use same color palette
[ ] Typography consistent
[ ] Spacing consistent (8px grid)
[ ] Border radius consistent
[ ] Shadows consistent
[ ] Animations smooth
[ ] Hover effects work
```

### **Responsive Design**
```
Test on these breakpoints:

📱 Mobile (375px - 576px)
[ ] Login page
[ ] Register page
[ ] Dashboard
[ ] Catalog
[ ] Author portal

📱 Tablet (576px - 1024px)
[ ] Login page
[ ] Register page
[ ] Dashboard
[ ] Catalog
[ ] Author portal

💻 Desktop (> 1024px)
[ ] All pages
```

---

## ⚡ PERFORMANCE TESTING

### **Load Time**
```
Test each page:
[ ] Login: < 2s
[ ] Register: < 2s
[ ] Dashboard: < 3s
[ ] Catalog: < 3s
[ ] Author Portal: < 3s
```

### **Animations**
```
Check smoothness:
[ ] Page transitions
[ ] Card hover effects
[ ] Button animations
[ ] Loading spinners
[ ] Progress bars
```

---

## ♿ ACCESSIBILITY TESTING

### **Keyboard Navigation**
```
[ ] Tab through all inputs
[ ] Tab through all buttons
[ ] Tab through all links
[ ] Enter/Space activates buttons
[ ] Escape closes modals
[ ] Focus visible on all elements
```

### **Screen Reader**
```
[ ] All images have alt text
[ ] All inputs have labels
[ ] All buttons have accessible names
[ ] Headings in correct order
[ ] Links have descriptive text
```

---

## 🐛 BUG CHECKLIST

### **Common Issues**
```
[ ] Broken images
[ ] Console errors
[ ] Network errors
[ ] Missing icons
[ ] Overlapping elements
[ ] Text overflow
[ ] Broken links
[ ] Form validation issues
[ ] State management issues
```

---

## 📊 TESTING RESULTS TEMPLATE

### **Summary**
```
Total Pages Tested: ___ / 14
Passed: ___ / 14
Failed: ___ / 14
Issues Found: ___
```

### **Issues Log**
```
Issue #1:
- Page: _______
- Description: _______
- Severity: [Critical/Major/Minor]
- Screenshot: [Yes/No]

Issue #2:
...
```

### **Browser Compatibility**
```
Chrome: [ ] Pass [ ] Fail
Firefox: [ ] Pass [ ] Fail
Safari: [ ] Pass [ ] Fail
Edge: [ ] Pass [ ] Fail
```

---

## ✅ FINAL CHECKLIST

### **Before Deployment**
```
[ ] All pages tested
[ ] All issues fixed
[ ] Responsive tested
[ ] Accessibility tested
[ ] Performance tested
[ ] Browser compatibility tested
[ ] No console errors
[ ] No network errors
[ ] Documentation updated
[ ] Ready for production
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Production Build**
```bash
cd admin-panel
npm run build
```

**Check:**
```
[ ] Build successful
[ ] No errors
[ ] No warnings
[ ] Bundle size acceptable
[ ] Assets optimized
```

### **Post-Deployment**
```
[ ] All pages load
[ ] All links work
[ ] All forms work
[ ] All animations work
[ ] Responsive works
[ ] Performance good
[ ] No errors in console
```

---

## 📞 REPORTING ISSUES

### **Issue Report Template**
```
**Page:** _______
**Issue:** _______
**Steps to Reproduce:**
1. _______
2. _______
3. _______

**Expected:** _______
**Actual:** _______
**Screenshot:** [Attach if available]
**Browser:** _______
**Device:** _______
**Severity:** [Critical/Major/Minor]
```

---

## 🎉 TESTING COMPLETE!

### **When All Tests Pass:**
```
✅ All pages functional
✅ All designs correct
✅ All responsive
✅ All accessible
✅ All performant
✅ No bugs found
✅ Ready for deployment
```

**Status:** PRODUCTION READY! 🚀

---

**LAST UPDATED:** {{ new Date().toLocaleDateString('id-ID') }}
**TESTER:** _______
**STATUS:** [ ] In Progress [ ] Complete [ ] Blocked
