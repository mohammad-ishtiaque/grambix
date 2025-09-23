const dotenv = require( "dotenv");
const http = require( "http");
const app = require( "./app.js");
const connectDB = require( "./config/db.js");

dotenv.config();

// 🗄️ Connect to Database
connectDB();

// Create HTTP Server (for socket.io support if needed)
const server = http.createServer(app);

// Server Listening
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST_URL || "0.0.0.0";

server.listen(PORT, HOST,  () => {
    console.log(`Grambix Server is running on ${HOST}:${PORT}`);
  });
  

// Handle Uncaught Errors
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! Shutting down...");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  });
  
  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! Shutting down...");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  });
  
