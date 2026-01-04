const express = require("express");
const router = express.Router();

// IMPORTATION DU CONTROLLER
const MessageController = require("../controllers/Message.controller");
const verifyToken = require("../middlewares/auth");

router.post("/send/:receiverId", verifyToken, MessageController.sendMessage);

// Modifier un message (sender only)
router.patch("/update/:id", verifyToken, MessageController.updateMessage);

// Supprimer un message (sender only)
router.delete("/delete/:id", verifyToken, MessageController.deleteMessage);

// Voir mes messages reçus
router.get("/received", verifyToken, MessageController.getReceivedMessages);

// Voir mes messages envoyés
router.get("/sent", verifyToken, MessageController.getSentMessages);


module.exports = router;