const express = require("express");
const router = express.Router();

// IMPORTATION DU CONTROLLER
const TweetController = require("../controllers/Tweet.controller");
const verifyToken = require("../middlewares/auth");


// TWEETS (CRUD)
// Créer un tweet
router.post("/post", verifyToken, TweetController.createTweet);

// Modifier un tweet (auteur uniquement)
router.patch("/updateTweet/:id", verifyToken, TweetController.updateTweet);

// Supprimer un tweet (auteur uniquement)
router.delete("/deleteTweet/:id", verifyToken, TweetController.deleteTweet);

// Récupérer tous les tweets
router.get("/get/all", verifyToken, TweetController.getAllTweets);

// Récupérer un tweet
router.get("/get/one/:id", verifyToken, TweetController.getOneTweet);


// TWEETS PAR UTILISATEUR
// Récupérer mes tweets
router.get("/get/me", verifyToken, TweetController.getMyTweets);

// Récupérer les tweets d’un utilisateur
router.get("/get/user/:userId", verifyToken, TweetController.getTweetsByUser);


// LIKES
// Liker un tweet
router.post("/like/:id", verifyToken, TweetController.likeTweet);

// Retirer son like
router.post("/unlike/:id", verifyToken, TweetController.unlikeTweet);


// COMMENTS
// Ajouter un commentaire à un tweet
router.post("/comment/:id", verifyToken, TweetController.addComment);

// Modifier un commentaire
router.patch("/updateComment/:tweetId/:commentId", verifyToken, TweetController.updateComment);

// Supprimer un commentaire
router.delete("/deleteComment/:tweetId/:commentId", verifyToken, TweetController.deleteComment);

// Répondre à un commentaire
router.post("/replyComment/:tweetId/:commentId", verifyToken, TweetController.replyToComment);

// RETWEET
// Retweeter un tweet
router.post("/retweet/:id", verifyToken, TweetController.retweetTweet);

// Supprimer son retweet
router.delete("/deleteRetweet/:id", verifyToken, TweetController.unretweetTweet);


// FEED & RECHERCHE
// Feed (tweets des users suivis)
router.get("/feed", verifyToken, TweetController.getFeed);

// Recherche de tweets
router.get("/search", verifyToken, TweetController.searchTweets);

// Tweets populaires
router.get("/popular", verifyToken, TweetController.getPopularTweets);

module.exports = router;