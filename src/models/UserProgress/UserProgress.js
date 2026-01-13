const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentModel',
    index: true
  },
  contentModel: {
    type: String,
    required: true,
    enum: ['Ebook', 'AudioBook', 'Book']
  },
  contentType: {
    type: String,
    enum: ['ebook', 'audiobook', 'book'],
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: Number, // in seconds
    default: 0
  },
  totalDuration: {
    type: Number, // in seconds
    default: 0
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  },
  lastListenAt: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  bookmarked: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userProgressSchema.index({ userId: 1, contentType: 1 });
userProgressSchema.index({ userId: 1, lastReadAt: -1 });
userProgressSchema.index({ userId: 1, lastListenAt: -1 });

module.exports = mongoose.model('UserProgress', userProgressSchema); 