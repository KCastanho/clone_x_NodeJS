const mongoose = require('mongoose');

const TweetSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    content: {
        type: String,
        required: true,
        maxlength: 280,
        trim: true
    },

    links: { type: [String], default: [] },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },

    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    retweetedTweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
        default: null
    },
    comment: {
        type: [
            {
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                content: {
                    type: String,
                    required: true,
                    maxlength: 280,
                    trim: true
                },
                replyToComment: {
                    type: mongoose.Schema.Types.ObjectId,
                    default: null
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: []
    }
},
    {timestamps: true}
);

module.exports = mongoose.model("Tweet", TweetSchema);
