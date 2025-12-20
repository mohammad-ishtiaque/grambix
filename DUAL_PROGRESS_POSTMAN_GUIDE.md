# Testing Dual Progress Tracking - Postman Guide

## 🎯 What to Test

Test that Books (with both audio & ebook) can track reading and listening progress separately.

---

## 📝 Test Scenarios

### Scenario 1: Update Reading Progress Only

**Endpoint:** `POST /api/user-progress/:contentId/book`

**Request Body:**
```json
{
  "currentPage": 50,
  "totalPages": 200,
  "progress": 25
}
```

**Expected Result:**
- ✅ `lastReadAt` timestamp updates
- ❌ `lastListenAt` stays unchanged (or previous value)
- Progress saved: `currentPage: 50`, `totalPages: 200`

---

### Scenario 2: Update Listening Progress Only

**Endpoint:** `POST /api/user-progress/:contentId/book`

**Request Body:**
```json
{
  "currentTime": 1800,
  "totalDuration": 7200,
  "progress": 25
}
```

**Expected Result:**
- ❌ `lastReadAt` stays unchanged (or previous value)
- ✅ `lastListenAt` timestamp updates
- Progress saved: `currentTime: 1800`, `totalDuration: 7200`

---

### Scenario 3: Update BOTH Reading & Listening

**Endpoint:** `POST /api/user-progress/:contentId/book`

**Request Body:**
```json
{
  "currentPage": 100,
  "totalPages": 200,
  "currentTime": 3600,
  "totalDuration": 7200,
  "progress": 50
}
```

**Expected Result:**
- ✅ `lastReadAt` timestamp updates
- ✅ `lastListenAt` timestamp updates
- Both reading and listening progress saved

---

### Scenario 4: Pagination Fix Test

**Endpoint:** `GET /api/user-progress/history?page=0&limit=10&contentType=book`

**Expected Result:**
- ✅ **No error** (previously would fail with "skip value must be >= 0")
- Returns history with default page=1
- Valid pagination response

---

### Scenario 5: Get Continue Reading (Books Only)

**Endpoint:** `GET /api/user-progress/continue?limit=10`

**Expected Result:**
- Returns books where `lastReadAt` was most recently updated
- Shows reading progress (`currentPage`/`totalPages`)

---

### Scenario 6: Get Continue Listening (Books Only)

**Endpoint:** `GET /api/user-progress/continue?limit=10`

**Expected Result:**
- Returns books where `lastListenAt` was most recently updated
- Shows listening progress (`currentTime`/`totalDuration`)

---

## 🔍 How to Verify

After making progress updates:

1. **Check the response** - should include both `lastReadAt` and `lastListenAt`
2. **Get progress** - `GET /api/user-progress/content/:contentId?contentType=book`
3. **Verify timestamps** - ensure only relevant timestamps updated

---

## ⚙️ Environment Variables

```
BASE_URL=http://localhost:3000
AUTH_TOKEN=<your_jwt_token>
USER_ID=<your_user_id>
BOOK_ID=<book_with_both_formats>
```

---

## 📊 Sample Complete Response

```json
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "_id": "...",
    "userId": "69461bc92ae3a61a0c278372",
    "contentId": "68ca44e83e30a24acbcc16ad",
    "contentType": "book",
    "progress": 50,
    "currentPage": 100,
    "totalPages": 200,
    "currentTime": 3600,
    "totalDuration": 7200,
    "lastReadAt": "2025-12-20T15:30:00.000Z",
    "lastListenAt": "2025-12-20T15:30:00.000Z",
    "isCompleted": false,
    "bookmarked": false,
    "startedAt": "2025-12-15T10:00:00.000Z",
    "createdAt": "2025-12-15T10:00:00.000Z",
    "updatedAt": "2025-12-20T15:30:00.000Z"
  }
}
```
