const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress/UserProgress');
require('dotenv').config();

/**
 * Migration script to populate the contentModel field for existing UserProgress documents
 * This is needed because we added refPath to enable dynamic population
 */

const mapContentTypeToModel = (type) => {
    switch (type) {
        case 'ebook': return 'Ebook';
        case 'audiobook': return 'AudioBook';
        case 'book': return 'Book';
        default: return null;
    }
};

async function migrateUserProgress() {
    try {
       // console.log('🚀 Starting UserProgress migration...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
       // console.log('✅ Connected to MongoDB');

        // Find all UserProgress documents that don't have contentModel field
        const documentsToUpdate = await UserProgress.find({
            contentModel: { $exists: false }
        });

       // console.log(`📊 Found ${documentsToUpdate.length} documents to update`);

        if (documentsToUpdate.length === 0) {
           // console.log('✨ No documents need updating. Migration complete!');
            process.exit(0);
        }

        // Update each document
        let successCount = 0;
        let errorCount = 0;

        for (const doc of documentsToUpdate) {
            try {
                const contentModel = mapContentTypeToModel(doc.contentType);

                if (!contentModel) {
                    console.warn(`⚠️  Skipping document ${doc._id} - invalid contentType: ${doc.contentType}`);
                    errorCount++;
                    continue;
                }

                await UserProgress.updateOne(
                    { _id: doc._id },
                    { $set: { contentModel } }
                );

                successCount++;

                if (successCount % 100 === 0) {
                   // console.log(`📝 Updated ${successCount} documents...`);
                }
            } catch (error) {
               // console.error(`❌ Error updating document ${doc._id}:`, error.message);
                errorCount++;
            }
        }

       // console.log('\n✅ Migration completed!');
       // console.log(`   Successfully updated: ${successCount} documents`);
       // console.log(`   Errors: ${errorCount} documents`);

        process.exit(0);
    } catch (error) {
       // console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateUserProgress();
