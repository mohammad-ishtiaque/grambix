const express = require( "express");
const morgan = require( "morgan");
const helmet = require( "helmet");
const cors = require( "cors");
const cookieParser = require( "cookie-parser");
const errorMiddleware = require("./middleware/errorHandler");
const authRoutes = require( "./models/Auth/auth.routes");
const ebookRoutes = require("./models/Ebook/ebook.routes");
const adminRoutes = require("./models/Admin/admin.routes");
const bookCategoryRoutes = require("./models/BookCategory/bookCategory.routes");
const audioBookRoutes = require("./models/AudioBook/audioBook.routes");
const userRoutes = require("./models/User/user.routes");
const bannerRoutes = require("./models/Banner/banner.routes");
const homePageRoutes = require("./models/HomePage/homePage.routes");
const categoryRoutes = require("./models/BookCategory/category.routes");
// const userActivityRoutes = require("./models/UserActivity/userActivity.routes");
const manageRoutes = require("./models/Manage/manage.routes");
const bookRoutes = require("./models/Book/book.routes");
const userManagementRoutes = require("./models/UserManagement/userManagement.routes");
const userProgressRoutes = require("./models/UserProgress/userProgress.routes");
const userPersonalizedRoutes = require("./models/UserPersonalized/userPersonalized.routes");
// const userRoutes = require( "./modules/user/user.routes.js");
const path = require("path");
const fs = require("fs");
const app = express();

// Static files
// app.use("/uploads", express.static(path.join(__dirname, '..', 'uploads', 'images')));
// app.use("/uploads", express.static(path.join(__dirname, '..', 'uploads', 'pdfs')));
app.use("/", express.static(path.join(__dirname, '..')));

// Test file check endpoint
// app.get('/test-upload-file', (req, res) => {
//   const uploadsDir = path.join(__dirname, '..',  'uploads', 'images'); // Go up one level to project root
//   const testFile = path.join(uploadsDir, '1754711813859-1-3.jpg');
  
//   // Create uploads directory if it doesn't exist{"exists":true,"message":"File exists on server","path":"C:\\Users\\arifi\\OneDrive\\Documents\\All Projects\\petApp_backend\\uploads\\1754380067076-age1.jpg"}
//   if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
//     return res.status(404).json({ 
//       exists: false, 
//       message: 'Uploads directory did not exist. Created it.',
//       path: uploadsDir
//     });
//   }
  
// // Check if file exists
//   fs.access(testFile, fs.constants.F_OK, (err) => {
//     if (err) {
//       return res.status(404).json({ 
//         exists: false, 
//         message: 'File not found',
//         path: testFile,
//         currentDirectory: process.cwd(),
//         directoryContents: fs.readdirSync(uploadsDir)
//       });
//     }
//     res.status(200).json({ 
//       exists: true, 
//       message: 'File exists on server',
//       path: testFile
//     });
//   });
// });

const allowedOrigins = [      
  "*",   // your main frontend from .env
  "http://10.10.20.54:3500",
  "http://localhost:3500",
  "https://olavenniels.vercel.app",
  "http://13.62.91.46:3001", 
  "https://app.grambix.com",
  "http://13.62.165.184:3001" ,
  "https://dashboard.grambix.com"     // fallback localhost
];


// Security Middlewares 
app.use(helmet());  
app.use(cors({
  origin: function (origin, callback) {
    console.log("Incoming origin:", origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      console.log("Allowed:", origin);
      return callback(null, true);
    }
    console.log("Blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(cookieParser());

// Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logger (only in dev)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.send("Grambix Backend");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/book-categories", bookCategoryRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/home", homePageRoutes);
app.use("/api/audio-books", audioBookRoutes);
app.use("/api/categories", categoryRoutes);
// app.use("/api/user-activity", userActivityRoutes);
app.use("/api/manage", manageRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/user-progress", userProgressRoutes);
app.use("/api/user-personalized", userPersonalizedRoutes);

// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);

app.use(errorMiddleware);

module.exports = app;
