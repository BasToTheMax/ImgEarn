const log = require('logging').default('DB');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO)
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

    isAdmin: {
      type: Boolean,
      default: false
    },

    nano: {
      type: String
    } // Nano address
});
const ViewIP = mongoose.model('ViewIP', {
    image: {
      type: mongoose.Types.ObjectId,
      ref: 'Image',
      required: true
    },
    date: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    }
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
    isPaid: {
      type: Boolean,
      default: false
    }
});

module.exports = {
  User,
  ViewIP,
  Image,
  DailyImageView,
  DailyStats
}