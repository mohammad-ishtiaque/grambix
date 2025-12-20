# User Progress API - Postman Testing Guide

## Getting Started

### Base URL
```
http://localhost:3000
```

### Authentication
All endpoints require JWT authentication. Add this header to all requests:
```
Authorization: Bearer <your_jwt_token>
```

### Content Types Supported
- `ebook` - For ebook content
- `audiobook` - For audiobook content  
- `book` - For general book content

---

## API Endpoints

### 1. Update Progress
**PUT** `/api/user-progress/:contentType/:contentId/progress`

Update reading or listening progress for a user.

**URL Examples:**
```
PUT http://localhost:3000/api/user-progress/ebook/675eb1234567890abcdef123/progress
PUT http://localhost:3000/api/user-progress/audiobook/675eb1234567890abcdef456/progress
PUT http://localhost:3000/api/user-progress/book/675eb1234567890abcdef789/progress
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body (For Ebooks/Books):**
```json
{
  "currentPage": 45,
  "totalPages": 250,
  "progress": 18,
  "isCompleted": false,
  "bookmarked": false
}
```

**Request Body (For Audiobooks):**
```json
{
  "currentTime": 1850,
  "totalDuration": 7200,
  "progress": 25.7,
  "isCompleted": false,
  "bookmarked": true
}x
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "_id": "675eb9876543210fedcba987",
    "userId": "675eb1234567890abcdef111",
    "contentId": "675eb1234567890abcdef123",
    "contentType": "ebook",
    "progress": 18,
    "currentPage": 45,
    "totalPages": 250,
    "currentTime": 0,
    "totalDuration": 0,
    "lastReadAt": "2025-12-18T11:25:00.000Z",
    "lastListenAt": "2025-12-18T08:30:00.000Z",
    "isCompleted": false,
    "bookmarked": false,
    "startedAt": "2025-12-15T08:30:00.000Z",
    "createdAt": "2025-12-15T08:30:00.000Z",
    "updatedAt": "2025-12-18T11:25:00.000Z"
  }
}
```

**Error Response (400 - Invalid Content Type):**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Invalid contentType. Allowed: ebook, audiobook, book"
}
```

**Error Response (400 - No Fields):**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "No progress fields provided to update"
}
```

---

### 2. Get Continue Items
**GET** `/api/user-progress/continue?limit=10`

Get incomplete books and audiobooks for "Continue Reading/Listening" sections.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/continue
GET http://localhost:3000/api/user-progress/continue?limit=5
GET http://localhost:3000/api/user-progress/continue?limit=20
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 10 | Max items per category |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Continue items retrieved successfully",
  "data": {
    "continueReading": [
      {
        "_id": "675eb9876543210fedcba987",
        "userId": "675eb1234567890abcdef111",
        "contentId": {
          "_id": "675eb1234567890abcdef123",
          "bookCover": "uploads/ebook-cover.jpg",
          "bookName": "The Great Gatsby",
          "categoryName": "Classic Literature",
          "synopsis": "A story of decadence..."
        },
        "contentType": "ebook",
        "progress": 45,
        "currentPage": 112,
        "totalPages": 250,
        "lastReadAt": "2025-12-18T09:15:00.000Z",
        "isCompleted": false,
        "bookmarked": true
      }
    ],
    "continueListening": [
      {
        "_id": "675eb9876543210fedcba989",
        "userId": "675eb1234567890abcdef111",
        "contentId": {
          "_id": "675eb1234567890abcdef456",
          "bookCover": "uploads/audiobook-cover.jpg",
          "bookName": "Atomic Habits",
          "categoryName": "Self-Help",
          "synopsis": "An easy way to build good habits..."
        },
        "contentType": "audiobook",
        "progress": 62,
        "currentTime": 4464,
        "totalDuration": 7200,
        "lastListenAt": "2025-12-18T10:45:00.000Z",
        "isCompleted": false,
        "bookmarked": true
      }
    ]
  }
}
```

---

### 3. Get Activity Statistics
**GET** `/api/user-progress/activity?period=week`

Get reading and listening statistics for a time period.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/activity?period=week
GET http://localhost:3000/api/user-progress/activity?period=month
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Options |
|-----------|------|----------|---------|---------|
| period | string | No | week | week, month |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Activity stats retrieved successfully",
  "data": {
    "period": "week",
    "totals": {
      "readingMinutes": 420,
      "listeningMinutes": 285,
      "pagesRead": 187,
      "timeListened": 17100,
      "ebooksRead": 5,
      "audiobooksListened": 3
    },
    "dailyBreakdown": [
      {
        "date": "2025-12-12T00:00:00.000Z",
        "reading": 45,
        "listening": 30,
        "ebooks": 1,
        "audiobooks": 1
      },
      {
        "date": "2025-12-13T00:00:00.000Z",
        "reading": 60,
        "listening": 45,
        "ebooks": 2,
        "audiobooks": 1
      }
    ],
    "activities": [...]
  }
}
```

---

### 4. Get Dashboard
**GET** `/api/user-progress/dashboard?period=week`

Combined dashboard with continue items and activity stats.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/dashboard
GET http://localhost:3000/api/user-progress/dashboard?period=month
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Options |
|-----------|------|----------|---------|---------|
| period | string | No | week | week, month |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "continueItems": {
      "continueReading": [...],
      "continueListening": [...]
    },
    "activityStats": {
      "period": "week",
      "totals": {...},
      "dailyBreakdown": [...]
    },
    "summary": {
      "totalReadingTime": 420,
      "totalListeningTime": 285,
      "totalPagesRead": 187,
      "totalTimeListened": 17100,
      "activeBooks": 8
    }
  }
}
```

---

### 5. Get History
**GET** `/api/user-progress/history?contentType=ebook&page=1&limit=20`

Get paginated history for a content type.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/history?contentType=ebook&page=1&limit=10
GET http://localhost:3000/api/user-progress/history?contentType=audiobook&page=1&limit=10
GET http://localhost:3000/api/user-progress/history?contentType=book&page=2&limit=5
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| contentType | string | Yes | - | ebook, audiobook, or book |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "History retrieved successfully",
  "data": {
    "history": [
      {
        "_id": "675eb9876543210fedcba987",
        "userId": "675eb1234567890abcdef111",
        "contentId": {
          "title": "The Great Gatsby",
          "subtitle": "A Classic Novel",
          "coverImage": "uploads/gatsby.jpg",
          "author": "F. Scott Fitzgerald"
        },
        "contentType": "ebook",
        "progress": 100,
        "currentPage": 250,
        "totalPages": 250,
        "lastReadAt": "2025-12-18T10:30:00.000Z",
        "isCompleted": true,
        "bookmarked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 6. Get Bookmarks
**GET** `/api/user-progress/bookmarks?page=1&limit=20`

Get all bookmarked items.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/bookmarks
GET http://localhost:3000/api/user-progress/bookmarks?page=1&limit=10
GET http://localhost:3000/api/user-progress/bookmarks?page=2&limit=20
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Bookmarks retrieved successfully",
  "data": {
    "bookmarks": [
      {
        "_id": "675eb9876543210fedcba987",
        "userId": "675eb1234567890abcdef111",
        "contentId": {
          "title": "Atomic Habits",
          "subtitle": "Tiny Changes, Remarkable Results",
          "coverImage": "uploads/atomic-habits.jpg",
          "author": "James Clear"
        },
        "contentType": "audiobook",
        "progress": 45,
        "currentTime": 3240,
        "totalDuration": 7200,
        "bookmarked": true,
        "updatedAt": "2025-12-18T09:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "pages": 1
    }
  }
}
```

---

### 7. Get Content Progress
**GET** `/api/user-progress/progress?contentId={id}&contentType={type}`

Get progress for a specific book/audiobook.

**URL Examples:**
```
GET http://localhost:3000/api/user-progress/progress?contentId=675eb1234567890abcdef123&contentType=ebook
GET http://localhost:3000/api/user-progress/progress?contentId=675eb1234567890abcdef456&contentType=audiobook
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contentId | ObjectId | Yes | Book/Audiobook ID |
| contentType | string | Yes | ebook, audiobook, or book |

**Success Response (200 - Found):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Progress retrieved successfully",
  "data": {
    "_id": "675eb9876543210fedcba987",
    "userId": "675eb1234567890abcdef111",
    "contentId": "675eb1234567890abcdef123",
    "contentType": "ebook",
    "progress": 45,
    "currentPage": 112,
    "totalPages": 250,
    "lastReadAt": "2025-12-18T09:15:00.000Z",
    "isCompleted": false,
    "bookmarked": true
  }
}
```

**Error Response (404 - Not Found):**
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Progress not found",
  "data": null
}
```

---

### 8. Toggle Bookmark
**PATCH** `/api/user-progress/bookmark?contentId={id}`

Toggle bookmark status (requires existing progress).

**URL Examples:**
```
PATCH http://localhost:3000/api/user-progress/bookmark?contentId=675eb1234567890abcdef123
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contentId | ObjectId | Yes | Book/Audiobook ID |

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Bookmark status updated successfully",
  "data": {
    "_id": "675eb9876543210fedcba987",
    "userId": "675eb1234567890abcdef111",
    "contentId": "675eb1234567890abcdef123",
    "contentType": "ebook",
    "bookmarked": true,
    "updatedAt": "2025-12-18T11:30:00.000Z"
  }
}
```

**Error Response (500 - No Progress):**
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Progress not found. Start reading/listening first."
}
```

---

## Testing Scenarios

### Scenario 1: User Starts Reading an Ebook

1. **Update Progress (First Time)**
   ```
   PUT /api/user-progress/ebook/675eb1234567890abcdef123/progress
   Body: {
     "currentPage": 1,
     "totalPages": 250,
     "progress": 0.4
   }
   ```
   ✅ Creates new progress record

2. **Update Progress (Page 50)**
   ```
   PUT /api/user-progress/ebook/675eb1234567890abcdef123/progress
   Body: {
     "currentPage": 50,
     "totalPages": 250,
     "progress": 20
   }
   ```
   ✅ Updates existing progress

3. **Get Progress**
   ```
   GET /api/user-progress/progress?contentId=675eb1234567890abcdef123&contentType=ebook
   ```
   ✅ Returns current progress (page 50)

---

### Scenario 2: User Listens to Audiobook

1. **Update Progress (30 minutes in)**
   ```
   PUT /api/user-progress/audiobook/675eb1234567890abcdef456/progress
   Body: {
     "currentTime": 1800,
     "totalDuration": 7200,
     "progress": 25
   }
   ```

2. **Get Continue Listening**
   ```
   GET /api/user-progress/continue?limit=10
   ```
   ✅ Audiobook appears in continueListening array

3. **Complete Audiobook**
   ```
   PUT /api/user-progress/audiobook/675eb1234567890abcdef456/progress
   Body: {
     "currentTime": 7200,
     "totalDuration": 7200,
     "progress": 100,
     "isCompleted": true
   }
   ```

4. **Get Continue Listening Again**
   ```
   GET /api/user-progress/continue?limit=10
   ```
   ✅ Audiobook no longer appears (because isCompleted: true)

---

### Scenario 3: User Bookmarks Items

1. **Start Reading Book**
   ```
   PUT /api/user-progress/ebook/675eb1234567890abcdef789/progress
   Body: {
     "currentPage": 25,
     "totalPages": 300,
     "progress": 8.3
   }
   ```

2. **Add Bookmark**
   ```
   PATCH /api/user-progress/bookmark?contentId=675eb1234567890abcdef789
   ```
   ✅ bookmarked: false → true

3. **Get Bookmarks**
   ```
   GET /api/user-progress/bookmarks?page=1&limit=20
   ```
   ✅ Book appears in bookmarks list

4. **Remove Bookmark**
   ```
   PATCH /api/user-progress/bookmark?contentId=675eb1234567890abcdef789
   ```
   ✅ bookmarked: true → false

---

### Scenario 4: View Dashboard

```
GET /api/user-progress/dashboard?period=week
```

**Returns:**
- All incomplete books/audiobooks (continue items)
- Week activity stats (reading minutes, listening minutes, etc.)
- Summary (total active books, time spent, pages read)

---

## Postman Collection Setup

### 1. Create Environment

**Environment Name:** Olavenniels Backend - Local

**Variables:**
```
base_url: http://localhost:3000
jwt_token: <paste_your_token_here>
ebook_id: 675eb1234567890abcdef123
audiobook_id: 675eb1234567890abcdef456
book_id: 675eb1234567890abcdef789
```

### 2. Collection Pre-request Script

Add this to your collection settings:

```javascript
// Auto-add Authorization header
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('jwt_token')
});
```

### 3. Collection Test Script

Add basic validation:

```javascript
// Test status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode');
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('data');
});

// Test success flag
pm.test("Request was successful", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});
```

---

## Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Invalid contentType | Wrong content type in URL | Use: ebook, audiobook, or book |
| 400 | No progress fields | Empty request body | Send at least one field |
| 401 | Unauthorized | Missing/invalid token | Check Authorization header |
| 404 | Progress not found | No progress record exists | User hasn't started content yet |
| 500 | Database error | MongoDB issue | Check database connection |

---

## Tips for Testing

1. **Get JWT Token First**
   - Login via auth endpoint
   - Copy token from response
   - Save in environment variables

2. **Use Real MongoDB ObjectIds**
   - Get IDs from your database
   - Or create books/audiobooks first via admin endpoints

3. **Test Error Cases**
   - Try invalid content types
   - Try without authorization
   - Try with non-existent IDs

4. **Monitor Progress Flow**
   - Create → Update → Retrieve → Complete
   - Track how lastReadAt/lastListenAt changes

5. **Test Pagination**
   - Create multiple items
   - Test different page sizes
   - Verify total counts

---

## Quick Test Checklist

- [ ] Update progress for ebook (create new)
- [ ] Update progress for ebook (update existing)
- [ ] Update progress for audiobook
- [ ] Get continue reading items
- [ ] Get continue listening items
- [ ] Get activity stats (week)
- [ ] Get activity stats (month)
- [ ] Get dashboard
- [ ] Get history with pagination
- [ ] Get bookmarks with pagination
- [ ] Get specific content progress
- [ ] Toggle bookmark on
- [ ] Toggle bookmark off
- [ ] Test with invalid content type
- [ ] Test without authorization
- [ ] Test with non-existent content ID
