const express = require('express');
const router = express.Router();


// IMPORTATION DU CONTROLLER
const UserController = require('../controllers/User.controller')
const verifyToken = require('../middlewares/auth');



/* =========================
   AUTH
========================= */
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/logout", verifyToken, UserController.logout);

/* =========================
   USERS (admin / liste)
========================= */
router.get("/all", verifyToken, UserController.getAll); // admin only (checkIsAdmin est dans le controller)

/* =========================
   FOLLOW / UNFOLLOW
========================= */
router.post("/follow/:id", verifyToken, UserController.followUser);
router.post("/unfollow/:id", verifyToken, UserController.unfollowUser);

/* =========================
   FOLLOWERS / FOLLOWING
========================= */
// Public: voir followers / following d'un user
router.get("/followers/:id", verifyToken, UserController.getFollowers);
router.get("/following/:id", verifyToken, UserController.getFollowing);

// Privé: voir MES followers
router.get("/me/followers", verifyToken, UserController.getMyFollowers);

/* =========================
   STATS
========================= */
router.get("/stats/:id", verifyToken, UserController.getUserStats);

/* =========================
   UPDATE / DELETE USER
========================= */
router.patch("/update/:id", verifyToken, UserController.updateUser);
router.delete("/delete/:id", verifyToken, UserController.deleteUser);



module.exports = router;