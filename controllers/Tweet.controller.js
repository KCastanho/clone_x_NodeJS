const createError = require("../middlewares/error");
const ModelTweet = require("../models/Tweet.model");
const ModelUser = require("../models/User.model");
const { checkIsAdmin } = require("../services/userService");

// Poster un tweet
const createTweet = async (req, res, next) => {
  try {
    const { content, links = [], images = [], videos = [] } = req.body;
    const connectedUserId = req.auth.id;

    // Vérification : au moins un contenu
    const hasText = content && content.trim().length > 0;
    const hasLinks = Array.isArray(links) && links.length > 0;
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasVideos = Array.isArray(videos) && videos.length > 0;

    if (!hasText && !hasLinks && !hasImages && !hasVideos) {
      return next(createError(400,"A tweet must contain at least one text, link, image or video"));
    }

    const tweet = await ModelTweet.create({
      author: connectedUserId,
      content: content || "",
      links,
      images,
      videos,
    });

    res.status(201).json(tweet);
  } catch (error) {
    next(createError(error.status || 500, "Failed to create tweet", error.message));
  }
};

// modifier un tweet
const updateTweet = async (req, res, next) => {
  try {
    const updatedTweetId = req.params.id;
    const connectedUserId = req.auth.id;

    const { content, links = [], images = [], videos = [] } = req.body;

    // Récupère le tweet
    const tweet = await ModelTweet.findById(updatedTweetId);
    if (!tweet) {
      return res.status(404).json("Tweet not found");
    }

    // Vérifie que c'est l'auteur
    if (String(tweet.author) !== String(connectedUserId)) {
      return next(createError(403, "You can only edit your own tweet"));
    }

    // Vérification : le tweet ne doit pas être vide
    const hasText = content && content.trim().length > 0;
    const hasLinks = Array.isArray(links) && links.length > 0;
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasVideos = Array.isArray(videos) && videos.length > 0;

    if (!hasText && !hasLinks && !hasImages && !hasVideos) {
      return next(
        createError(
          400,
          "A tweet must contain at least one text, link, image or video"
        )
      );
    }

    // Mise à jour
    tweet.content = content ?? "";
    tweet.links = links;
    tweet.images = images;
    tweet.videos = videos;

    await tweet.save();

    res.status(200).json({
      message: "Tweet updated",
      tweet,
    });
  } catch (error) {
    next(createError(error.status || 500, "Failed to update the tweet"));
  }
};

// supprime un tweet, createur uniquement
const deleteTweet = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const deletedTweet = await ModelTweet.findById(req.params.id);
    if (!deletedTweet) return res.status(404).json("Tweet not found");

    if (String(deletedTweet.author) !== String(connectedUserId)) {
      return next(createError(403, "Not allowed to delete this tweet, you can only delete one of your own tweet"));
    }

    await ModelTweet.findByIdAndDelete(req.params.id);
    res.status(200).json("Tweet deleted");
  } catch (error) {
    next(createError(error.status || 500, "Failed to delete tweet", error.message));
  }
};

// récupérer mes tweets
const getMyTweets = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;

    const tweets = await ModelTweet.find({ author: connectedUserId })
      .sort({ createdAt: -1 })
      .populate("author", "pseudo");

    res.status(200).json(tweets);
  } catch (error) {
    next(createError(500, "Failed to get my tweets"));
  }
};

// récupérer tout les tweets
const getAllTweets = async (req, res, next) => {
  try {
    const tweets = await ModelTweet.find()
      .sort({ createdAt: -1 })
      .populate("author", "pseudo");

    res.status(200).json(tweets);
  } catch (error) {
    next(createError(error.status || 500, "Failed to get tweets", error.message));
  }
};

//récupérer un tweet
const getOneTweet = async (req, res, next) => {
  try {
    const tweet = await ModelTweet.findById(req.params.id)
      .populate("author", "pseudo")
      .populate("comment.author", "pseudo");

    if (!tweet) return res.status(404).json("Tweet not found");

    res.status(200).json(tweet);
  } catch (error) {
    next(createError(error.status || 500, "Failed to get tweet", error.message));
  }
};

// récupérer les tweets d'un utilisateur
const getTweetsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tweets = await ModelTweet.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "pseudo");

    res.status(200).json(tweets);
  } catch (error) {
    next(createError(500, "Failed to get user's tweets"));
  }
};


// liker un tweet
const likeTweet = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const tweet = await ModelTweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json("Tweet not found");
    }

    // Vérifie si déjà liké
    const alreadyLiked = tweet.likes.some(
      (userId) => String(userId) === String(connectedUserId)
    );

    if (alreadyLiked) {
      return next(createError(409, "Already liked"));
    }

    // Ajout du like (sans doublon)
    await ModelTweet.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: connectedUserId } },
      { new: true }
    );

    res.status(200).json({
      message: "Tweet liked",
      likesCount: tweet.likes.length + 1
    });
  } catch (error) {
    next(createError(500, "Failed to like tweet"));
  }
};

// supprimer son like d'un tweet
const unlikeTweet = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const tweet = await ModelTweet.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: connectedUserId } },
      { new: true }
    );

    if (!tweet) return res.status(404).json("Tweet not found");

    res.status(200).json({ 
        message: "Unliked",
        likesCount: tweet.likes.length 
    });
  } catch (error) {
    next(createError(500, "Failed to unlike tweet"));
  }
};

// ajouter un commentaire a un tweet
const addComment = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const { content} = req.body;

    // Vérifier que le tweet existe
    const tweetExists = await ModelTweet.findById(req.params.id);
    if (!tweetExists) {
      return next(createError(404, "Tweet not found"));
    }

    if (!content || !content.trim()) return next(createError(400, "Comment content is required"));

    const tweet = await ModelTweet.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comment: {
            author: connectedUserId,
            content: content.trim(),
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate("comment.author", "pseudo");

    res.status(201).json({ message: "Comment added", tweet });
  } catch (error) {
    next(createError(500, "Failed to add comment"));
  }
};

// modifier un commentaire
const updateComment = async (req, res, next) => {
  try {
    const { tweetId, commentId } = req.params;
    const connectedUserId = req.auth.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(createError(400, "Comment content is required"));
    }

    const tweet = await ModelTweet.findById(tweetId);
    if (!tweet) return next(createError(404, "Tweet not found"));

    // Trouver le commentaire
    const comment = tweet.comment.id(commentId);
    if (!comment) return next(createError(404, "Comment not found"));

    // Seul l'auteur ou l'admin peut modifier
    if (String(comment.author) !== String(connectedUserId)) {
      await checkIsAdmin(connectedUserId);
    }

    // Update
    comment.content = content.trim();
    await tweet.save();

    res.status(200).json({
      message: "Comment updated",
      tweet,
    });
  } catch (error) {
    next(createError(500, "Failed to update comment"));
  }
};

// supprimer un commentaire
const deleteComment = async (req, res, next) => {
  try {
    const { tweetId, commentId } = req.params;
    const connectedUserId = req.auth.id;

    const tweet = await ModelTweet.findById(tweetId);
    if (!tweet) return next(createError(404, "Tweet not found"));

    const comment = tweet.comment.id(commentId);
    if (!comment) return next(createError(404, "Comment not found"));

    // Seul l'auteur ou l'admin peut modifier
    if (String(comment.author) !== String(connectedUserId)) {
      await checkIsAdmin(connectedUserId);
    }

    // Supprimer le commentaire
    comment.deleteOne();
    await tweet.save();

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    next(createError(500, "Failed to delete comment"));
  }
};

// ajouter un commentaire à un commentaire
const replyToComment = async (req, res, next) => {
  try {
    const { tweetId, commentId } = req.params;
    const connectedUserId = req.auth.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(createError(400, "Reply content is required"));
    }

    // Vérifier que le tweet existe
    const tweet = await ModelTweet.findById(tweetId);
    if (!tweet) return next(createError(404, "Tweet not found"));

    // Vérifier que le commentaire parent existe
    const parentComment = tweet.comment.id(commentId);
    if (!parentComment) {
      return next(createError(404, "Parent comment not found"));
    }

    // Ajouter la réponse (nouveau commentaire)
    tweet.comment.push({
      author: connectedUserId,
      content: content.trim(),
      replyToComment: parentComment._id,
      createdAt: new Date(),
    });

    await tweet.save();
    await tweet.populate("comment.author", "pseudo");

    res.status(201).json({
      message: "Reply added",
      tweet,
    });
  } catch (error) {
    next(createError(500, "Failed to reply to comment"));
  }
};

// retweeter un tweet
const retweetTweet = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;

    const original = await ModelTweet.findById(req.params.id);
    if (!original) return next(createError(404, "Original tweet not found"));

    // Empêcher double retweet
    const already = await ModelTweet.exists({
        author: connectedUserId,
        retweetedTweet: original._id,
    });
    if (already) return next(createError(409, "Already retweeted"));

    // 1) Crée le tweet retweet
    const rt = await ModelTweet.create({
      author: connectedUserId,
      content: original.content,
      retweetedTweet: original._id,
    });

    res.status(201).json({ message: "Retweeted", retweet: rt });
  } catch (error) {
    console.error("RETWEET ERROR =>", error);
    next(createError(500, "Failed to retweet", error.message));
  }
};

// supprimer le retweet
const unretweetTweet = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const originalTweetId = req.params.id;

    const deleted = await ModelTweet.findOneAndDelete({
      author: connectedUserId,
      retweetedTweet: originalTweetId,
    });

    if (!deleted) return next(createError(404, "Retweet not found"));

    res.status(200).json({ message: "Unretweeted" });
  } catch (error) {
    next(createError(500, "Failed to unretweet"));
  }
};


// rechercher un tweet
const searchTweets = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return next(createError(400, "Search query is required"));
    }

    const tweets = await ModelTweet.find({
      content: { $regex: q.trim(), $options: "i" }
    })
      .sort({ createdAt: -1 })
      .populate("author", "pseudo");

    res.status(200).json(tweets);
  } catch (error) {
    next(createError(500, "Failed to search tweets"));
  }
};

// feed des tweets des users suivie
const getFeed = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;

    const me = await ModelUser.findById(connectedUserId).select("following");
    if (!me) return next(createError(404, "User not found"));

    const authors = [connectedUserId, ...me.following];

    const tweets = await ModelTweet.find({ author: { $in: authors } })
      .sort({ createdAt: -1 })
      .populate("author", "pseudo")
      .populate("retweetedTweet")
      .populate("retweetedTweet.author", "pseudo");

    return res.status(200).json(tweets);
  } catch (error) {
    next(createError(500, "Failed to get feed"));
  }
};

// tweets les plus populaires (les plus likés)
const getPopularTweets = async (req, res, next) => {
  try {
    const tweets = await ModelTweet.find()
      .sort({ likes: -1 }) // Mongo trie par taille du tableau
      .populate("author", "pseudo")
      .populate("retweetedTweet")
      .populate("retweetedTweet.author", "pseudo");

    res.status(200).json(tweets);
  } catch (error) {
    next(createError(500, "Failed to get popular tweets"));
  }
};


module.exports = {
createTweet,
updateTweet,
deleteTweet,
getMyTweets,
getAllTweets,
getOneTweet,
getTweetsByUser,
likeTweet,
unlikeTweet,
addComment,
updateComment,
deleteComment,
replyToComment,
retweetTweet,
unretweetTweet,
searchTweets,
getFeed,
getPopularTweets
};