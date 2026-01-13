# Grambix Backend API Documentation

## Base URL
`http://<host>:<port>/api`
(e.g., `http://localhost:4000/api`)

## Authentication
Most endpoints require authentication.
- **Headers**: Authorization: Bearer <token>
- **Roles**: `USER`, `ADMIN`, `SUPER_ADMIN`

---

## 1. Auth Module
**Base Route**: `/auth`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new user | Public |
| POST | `/verify-email` | Verify email with OTP | Public |
| POST | `/login` | User login | Public |
| POST | `/refresh-token` | Refresh access token | Public |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |
| POST | `/resend-verification` | Resend verification email | Public |
| POST | `/logout` | Logout user | Auth |

---

## 2. User Module (Profile)
**Base Route**: `/user`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/profile/get` | Get user profile | Auth |
| PUT | `/profile/update` | Update user profile (Multipart form-data) | Auth |
| POST | `/profile/change-password` | Change password | Auth |
| POST | `/save-unsave-book` | Toggle save/unsave book | Auth |
| GET | `/saved-items` | Get all saved items | Auth |
| POST | `/clear-information` | Clear user info | Auth |
| DELETE | `/delete-account` | Delete user account | Auth |

---

## 3. User Progress Module (Core)
**Base Route**: `/user-progress`
*Primary module for tracking user reading/listening progress.*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| PUT | `/:contentType/:contentId/progress` | **Update Progress**. Handles `book`, `ebook`, `audiobook`. For 'book', it intelligently updates reading vs listening timestamp based on fields provided (`currentPage` vs `currentTime`). | Auth |
| GET | `/continue` | Get items to continue reading/listening | Auth |
| GET | `/history` | Get reading/listening history | Auth |
| GET | `/bookmarks` | Get bookmarked items | Auth |
| GET | `/activity` | Get activity statistics | Auth |
| GET | `/progress` | Get specific content progress | Auth |
| PATCH | `/bookmark` | Toggle bookmark status | Auth |
| GET | `/dashboard` | Get aggregate dashboard data | Auth |

---

## 4. User Personalized Module (Aggregated Views)
**Base Route**: `/user-personalized`
*Modules for personalized recommendations and dashboards. **Note:** Some endpoints here duplicate `User Progress` logic. Recommend using `User Progress` for raw data and this module for aggregated views.*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/content` | Get full personalized content (Recommendations, Trending, Continue) | Auth |
| GET | `/dashboard` | Get personalized dashboard (Similar to UserProgress dashboard) | Auth |
| GET | `/continue` | *Duplicate of /user-progress/continue* | Auth |
| GET | `/activity` | *Duplicate of /user-progress/activity* | Auth |
| GET | `/history/:contentType` | *Wrapper for /user-progress/history* | Auth |
| GET | `/bookmarks/:contentType` | *Wrapper for /user-progress/bookmarks* | Auth |

---

## 5. Home Page Module
**Base Route**: `/home`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get home page data (Banners, Categories, Featured Books) | Public |
| GET | `/book` | Get book details by ID | Public |
| POST | `/save` | Save/Unsave book | Public (token required usually) |
| GET | `/saved` | Get saved books | Public |

---

## 6. Book Modules (Content Content)

### Ebooks
**Base Route**: `/ebooks`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Create Ebook (Multipart: bookCover, pdfFile) | Admin |
| GET | `/get` | Get all Ebooks | Public |
| GET | `/get/:id` | Get Ebook by ID | Public |
| PUT | `/update/:id` | Update Ebook | Admin |
| DELETE | `/delete/:id` | Delete Ebook | Admin |

### AudioBooks
**Base Route**: `/audio-books`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Create AudioBook (Multipart: bookCover, audioFile) | Admin |
| GET | `/get` | Get all AudioBooks | Public |
| GET | `/get/:id` | Get AudioBook by ID | Public |
| PUT | `/update/:id` | Update AudioBook | Admin |
| DELETE | `/delete/:id` | Delete AudioBook | Admin |

### Books (Physical/Hybrid)
**Base Route**: `/books`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Create Book (Multipart: bookCover, pdfFile, audioFile) | Admin |
| GET | `/get` | Get all Books | Public |
| GET | `/get/:id` | Get Book by ID | Public |
| PUT | `/update/:id` | Update Book | Admin |
| DELETE | `/delete/:id` | Delete Book | Admin |

### Book Categories
**Base Route**: `/book-categories`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Create Category | Admin |
| GET | `/get` | Get all Categories | Public |
| GET | `/get/:id` | Get Category by ID | Public |
| PUT | `/update/:id` | Update Category | Admin |
| DELETE | `/delete/:id` | Delete Category | Admin |

### Categories (Aggregated)
**Base Route**: `/categories`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get categories with book counts | Public |
| GET | `/books` | Get books by category (Filter/Paginate) | Public |

---

## 7. Admin & Management Modules

### Admin Auth & Profile
**Base Route**: `/admin`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/register-admin` | Register new admin | Super Admin |
| POST | `/login-admin` | Admin login | Public |
| POST | `/logout` | Admin logout | Admin |
| GET | `/profile/get` | Get admin profile | Admin |
| PUT | `/profile/update` | Update admin profile | Admin |
| PUT | `/profile/change-password` | Change admin password | Admin |
| GET | `/get-all-admins` | List all admins | Super Admin |
| DELETE | `/delete-admin/:id` | Delete admin | Super Admin |

### User Management (Admin Side)
**Base Route**: `/user-management`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/get-all-users` | Get all users (Search + Pagination) | Admin |
| GET | `/get-user-by-id` | Get user details | Admin |
| PUT | `/block-user` | Block a user | Admin |
| PUT | `/unblock-user` | Unblock a user | Admin |
| GET | `/get-user-growth` | Get user registration growth stats | Admin |

### Banner Management
**Base Route**: `/banner`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Create Banner | Admin |
| GET | `/get` | Get all Banners | Public |
| GET | `/get/:id` | Get Banner by ID | Public |
| PUT | `/update` | Update Banner | Admin |
| DELETE | `/delete` | Delete Banner | Admin |

### Manage (Static Content)
**Base Route**: `/manage`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/add-terms-conditions` | Add Terms | Admin |
| GET | `/get-terms-conditions` | Get Terms | Public |
| DELETE | `/delete-terms-conditions` | Delete Terms | Admin |
| POST | `/add-privacy-policy` | Add Privacy Policy | Admin |
| GET | `/get-privacy-policy` | Get Privacy Policy | Public |
| DELETE | `/delete-privacy-policy` | Delete Privacy Policy | Admin |
| POST | `/add-about-us` | Add About Us | Admin |
| GET | `/get-about-us` | Get About Us | Public |
| DELETE | `/delete-about-us` | Delete About Us | Admin |
| POST | `/add-faq` | Add FAQ | Admin |
| PATCH | `/update-faq` | Update FAQ | Admin |
| GET | `/get-faq` | Get FAQ | Public |
| GET | `/delete-faq` | Delete FAQ | Admin |
| POST | `/add-contact-us` | Add Contact Us info | Admin |
| GET | `/get-contact-us` | Get Contact Us info | Public |
| DELETE | `/delete-contact-us` | Delete Contact Us info | Admin |

---