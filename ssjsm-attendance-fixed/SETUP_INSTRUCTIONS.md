# 🚀 Setup Instructions - Organisation Attendance Tracker

## Overview
This app uses Google Sheets as the database. All data is stored in YOUR Google Drive and accessible by all group leaders through the web app.

---

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **"Organisation Attendance Database"**
4. Create **4 sheets** (tabs at the bottom) with these EXACT names:
   - `Groups`
   - `Members`
   - `Duties`
   - `Attendance`

### Sheet 1: "Groups" - Add these headers in Row 1:
```
id | name | leaderName | pin
```

Then add your 12 groups (example):
```
group_1 | Group 1 | Rajesh Kumar | 1001
group_2 | Group 2 | Suresh Patel | 1002
group_3 | Group 3 | Amit Singh | 1003
... (add all 12 groups)
```

### Sheet 2: "Members" - Add these headers in Row 1:
```
id | groupId | name | phone | firmName | photoUrl
```
(Leave empty - members will be added via the app)

### Sheet 3: "Duties" - Add these headers in Row 1:
```
id | groupId | date | title | description
```
(Leave empty - duties will be allotted via the app)

### Sheet 4: "Attendance" - Add these headers in Row 1:
```
odId | dutyId | memberId | present | markedAt | markedBy
```
(Leave empty - attendance will be marked via the app)

---

## Step 2: Create the Google Apps Script (API)

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy and paste the ENTIRE code from the file: `google-apps-script.js` (included in this project)
4. Click **Save** (💾 icon) - name it "Attendance API"

---

## Step 3: Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the ⚙️ gear icon next to "Select type" → Choose **Web app**
3. Fill in:
   - **Description:** "Attendance API v1"
   - **Execute as:** "Me" (your email)
   - **Who has access:** "Anyone"
4. Click **Deploy**
5. Click **Authorize access** → Choose your Google account → Click "Advanced" → "Go to Attendance API (unsafe)" → Allow
6. **COPY THE WEB APP URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## Step 4: Configure the App

1. Open the web app (the attendance tracker)
2. You'll see a setup prompt asking for the Google Sheets API URL
3. Paste the Web App URL you copied
4. Click "Connect"
5. The app will load all data from your Google Sheet!

---

## Step 5: Share with Group Leaders

Simply share the web app URL with all 17 users. They can:
- View all groups and data
- Unlock their own group with their PIN
- Mark attendance for their group
- All changes sync automatically to your Google Sheet

---

## 📋 Quick Reference

### Default PINs (change these in the Groups sheet):
- Group 1: 1001
- Group 2: 1002
- ... and so on

### To change a PIN:
1. Open your Google Sheet
2. Go to "Groups" tab
3. Edit the PIN in column D
4. Changes reflect immediately in the app

### To view all data:
Just open the Google Sheet anytime - all members, duties, and attendance records are there in a readable format.

### Data Retention:
Google Sheets retains data indefinitely. Your 2.5 years requirement is easily met. You can also:
- Download as Excel anytime
- Make copies for archival
- Google keeps version history for 30+ days

---

## ⚠️ Important Notes

1. **Don't change column headers** in the Google Sheet
2. **Don't delete the header row** (Row 1)
3. You CAN manually edit data in the sheet if needed
4. The app auto-refreshes data every time a page loads

---

## Need Help?

If you see "Failed to connect" error:
1. Make sure the Apps Script is deployed as a Web App
2. Make sure "Who has access" is set to "Anyone"
3. Check that you authorized the script properly
4. Try redeploying with a new version

