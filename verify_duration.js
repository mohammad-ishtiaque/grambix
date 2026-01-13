require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const AudioBook = require('./src/models/AudioBook/AudioBook');
const Book = require('./src/models/Book/Book');
const { ObjectId } = mongoose.Types;

const runVerification = async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected");

        console.log("\n🧪 Test 1: AudioBook Duration Formatting");

        // Format: HH:MM:SS -> 01:30:00 (1hr 30m) = 5400 seconds
        const ab1 = await AudioBook.create({
            bookName: "Duration Test 1 " + Date.now(),
            synopsis: "Testing HH:MM:SS",
            category: new ObjectId(),
            audioFile: "test.mp3",
            bookCover: "test.jpg", // Required field
            duration: "01:30:00" 
        });

        if (ab1.duration === 5400) {
            console.log(`✅ PASSED: "01:30:00" converted to ${ab1.duration} seconds.`);
        } else {
            console.error(`❌ FAILED: "01:30:00" -> Got ${ab1.duration}, expected 5400.`);
        }

        // Format: MM:SS -> 10:00 (10 mins) = 600 seconds
        const ab2 = await AudioBook.create({
            bookName: "Duration Test 2 " + Date.now(),
            synopsis: "Testing MM:SS",
            category: new ObjectId(),
            audioFile: "test.mp3",
            bookCover: "test.jpg",
            duration: "10:00"
        });

        if (ab2.duration === 600) {
            console.log(`✅ PASSED: "10:00" converted to ${ab2.duration} seconds.`);
        } else {
            console.error(`❌ FAILED: "10:00" -> Got ${ab2.duration}, expected 600.`);
        }

        console.log("\n🧪 Test 2: Book Duration Formatting");
        
        // Format: Number -> 300 = 300 seconds
        const b1 = await Book.create({
            bookName: "Book Duration Test",
            synopsis: "Testing Number input",
            category: new ObjectId(),
            categoryName: "Test",
            createdBy: new ObjectId(),
            duration: 300
        });

        if (b1.duration === 300) {
            console.log(`✅ PASSED: Number 300 preserved as ${b1.duration}.`);
        } else {
            console.error(`❌ FAILED: Number input failed.`);
        }

        // Cleanup
        console.log("\n🧹 Cleaning up...");
        await AudioBook.findByIdAndDelete(ab1._id);
        await AudioBook.findByIdAndDelete(ab2._id);
        await Book.findByIdAndDelete(b1._id);
        
    } catch (error) {
        console.error("💥 Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runVerification();
