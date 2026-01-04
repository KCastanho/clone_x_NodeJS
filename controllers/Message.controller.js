const createError = require('../middlewares/error');
const ModelUser = require('../models/User.model');
const ModelMessage = require('../models/Message.model');

// envoyer un message
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.auth.id;
    const { receiverId } = req.params;
    const { content } = req.body;

    // sécurité : pas s’envoyer un message à soi-même
    if (String(senderId) === String(receiverId)) {
      return next(createError(400, "You cannot message yourself"));
    }

    // validation contenu
    if (!content || !content.trim()) {
      return next(createError(400, "Message content is required"));
    }

    // vérifier que le receiver existe
    const receiverExists = await ModelUser.exists({ _id: receiverId });
    if (!receiverExists) {
      return next(createError(404, "Receiver not found"));
    }

    const message = await ModelMessage.create({
      content: content.trim(),
      sender: senderId,
      receiver: receiverId,
    });

    return res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    next(createError(500, "Failed to send message", error.message));
  }
};

// modifier un message
const updateMessage = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(createError(400, "Message content is required"));
    }

    const message = await ModelMessage.findById(id);
    if (!message) {
      return next(createError(404, "Message not found"));
    }

    // Seul le sender peut modifier
    if (String(message.sender) !== String(connectedUserId)) {
      return next(createError(403, "You can only edit your own messages"));
    }

    message.content = content.trim();
    await message.save();

    res.status(200).json({
      message: "Message updated",
      data: message,
    });
  } catch (error) {
    next(createError(500, "Failed to update message", error.message));
  }
};

// supprimé un message
const deleteMessage = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;
    const { id } = req.params;

    const message = await ModelMessage.findById(id);
    if (!message) {
      return next(createError(404, "Message not found"));
    }

    // Seul le sender peut supprimer
    if (String(message.sender) !== String(connectedUserId)) {
      return next(createError(403, "You can only delete your own messages"));
    }

    await ModelMessage.findByIdAndDelete(id);

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    next(createError(500, "Failed to delete message", error.message));
  }
};

// messages reçus
const getReceivedMessages = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;

    const messages = await ModelMessage.find({
      receiver: connectedUserId,
    })
      .sort({ createdAt: -1 }) // plus récents en premier
      .populate("sender", "pseudo");

    res.status(200).json(messages);
  } catch (error) {
    next(createError(500, "Failed to get received messages", error.message));
  }
};

// messages envoyés
const getSentMessages = async (req, res, next) => {
  try {
    const connectedUserId = req.auth.id;

    const messages = await ModelMessage.find({
      sender: connectedUserId,
    })
      .sort({ createdAt: -1 }) // plus récents en premier
      .populate("receiver", "pseudo");

    res.status(200).json(messages);
  } catch (error) {
    next(createError(500, "Failed to get sent messages", error.message));
  }
};


module.exports = { 
    sendMessage,
    updateMessage,
    deleteMessage,
    getReceivedMessages,
    getSentMessages
};