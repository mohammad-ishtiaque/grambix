require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const UserProgressService = require('./src/models/UserProgress/userProgress.service');
const Book = require('./src/models/Book/Book');
// Assuming User model is here, if not we'll just use a random ObjectId for testing if we don't need to create a real user
// But let's try to import it to be safe, or just use a fake dummy ID since we aren't testing User auth.
const { ObjectId } = mongoose.Types;

const runVerification = async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected");

        // 1. Setup Test Data
        const dummyUserId = new ObjectId();
        console.log(`👤 Using Dummy User ID: ${dummyUserId}`);

        // Create a dummy Book that has BOTH text and audio
        const book = await Book.create({
            bookName: "Test Dual Book " + Date.now(),
            synopsis: "A book for testing dual progress",
            category: new ObjectId(), // Random category ID
            categoryName: "Test",
            createdBy: new ObjectId(), // Random admin ID
            isBook: true,
            isEbook: false,
            isAudioBook: false,
            // Ebook fields
            pdfFile: "http://example.com/test.pdf",
            totalPages: 100,
            // AudioBook fields
            audioFile: "http://example.com/test.mp3",
            duration: 3600 // 60 minutes
        });
        console.log(`📖 Created Test Book: ${book._id}`);

        // 2. Test Reading Progress (simulating missing totalPages in input)
        console.log("\n🧪 Test 1: Reading Progress (Backfilling Check)");
        const readResult = await UserProgressService.updateProgress(dummyUserId, book._id, 'book', {
            currentPage: 50,
            // Intentionally omitting totalPages to see if it backfills from Book model
            progress: 50
        });
        
        if (readResult.totalPages === 100) {
            console.log("✅ PASSED: totalPages backfilled correctly from Book model.");
        } else {
            console.error("❌ FAILED: totalPages was not backfilled. Got:", readResult.totalPages);
        }
        
        if (readResult.readingProgress === 50) {
            console.log("✅ PASSED: readingProgress updated correctly.");
        } else {
            console.error("❌ FAILED: readingProgress mismatch.");
        }

        // 3. Test Listening Progress (Independent of Reading)
        console.log("\n🧪 Test 2: Listening Progress (Independence Check)");
        const listenResult = await UserProgressService.updateProgress(dummyUserId, book._id, 'book', {
            currentTime: 900, // 15 mins
            // progress: 25 // Let's see if it calculates it if we omit valid progress but give time?
            // Service logic: if progressData.progress is undefined, it calculates from totals.
        });

        // CurrentTime 900 / Duration 3600 = 25%
        if (Math.abs(listenResult.listeningProgress - 25) < 1) {
             console.log("✅ PASSED: listeningProgress calculated correctly (25%).");
        } else {
             console.error(`❌ FAILED: listeningProgress calculation wrong. Got: ${listenResult.listeningProgress}%`);
        }

        if (listenResult.readingProgress === 50) {
            console.log("✅ PASSED: readingProgress remained 50% while listening updated.");
        } else {
            console.error(`❌ FAILED: readingProgress was affected! Got: ${listenResult.readingProgress}%`);
        }

        // 4. Test Continue Items
        console.log("\n🧪 Test 3: Continue Lists");
        const continueItems = await UserProgressService.getContinueItems(dummyUserId);
        
        const inReading = continueItems.continueReading.find(i => i.contentId._id.toString() === book._id.toString());
        const inListening = continueItems.continueListening.find(i => i.contentId._id.toString() === book._id.toString());

        if (inReading && inListening) {
            console.log("✅ PASSED: Book appears in BOTH Reading and Listening continue lists.");
        } else {
            console.error("❌ FAILED: Book missing from one or both lists.", { 
                inReading: !!inReading, 
                inListening: !!inListening 
            });
        }

        // Cleanup
        console.log("\n🧹 Cleaning up...");
        await Book.findByIdAndDelete(book._id);
        await mongoose.model('UserProgress').deleteMany({ userId: dummyUserId });
        console.log("✨ Cleanup complete.");

    } catch (error) {
        console.error("💥 Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runVerification();
