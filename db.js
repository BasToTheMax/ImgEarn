const log = require('logging').default('DB');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB)
  .then(() => {
    log.info('Connected to MongoDB');
})
  .catch(err => {
    log.error('MongoDB connection error:', err);
    process.exit(1);
});

const User = mongoose.model('User', {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },

    token: {
      type: String,
      required: true
    },

    nano: {
      type: String
    } // Nano address
});
const UserIP = mongoose.model('UserIP', {
    IP: String
});

const Image = mongoose.model('Image', {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'Untitled'
    },
    size: {
      type: Number,
      required: true
    }, // Storage
    status: {
      type: String,
      enum: ['pending', 'public', 'denied'],
      default: 'pending'
    },
    denyReason: {
      type: String,
      default: ''
    }
});

const DailyImageView = mongoose.model('DailyImageView', {
    image: {
      type: mongoose.Types.ObjectId,
      ref: 'Image',
      required: true
    },
    date: {
      type: String,
      required: true
    }, // Date in format: YYYY-MM-DD
    views: {
      type: Number,
      default: 0
    }
});

const DailyStats = mongoose.model('DailyStats', {
    date: { // Date in format: YYYY-MM-DD
      type: String,
      required: true,
      unique: true
    },
    totalViews: {
      type: Number,
      default: 0
    },
    adRevenue: {  // Total ad revenue for this day
      type: Number,
      default: 0
    },
    earnings: { // Earnings for each user for this day (userId => earnings)
      type: Map,
      of: Number,
      default: {}
    } 
});

module.exports = {
  User,
  UserIP,
  Image,
  DailyImageView,
  DailyStats
}