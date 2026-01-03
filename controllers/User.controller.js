const createError = require('../middlewares/error');
const ModelUser = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ENV = require('../config/env');
const { checkIsAdmin } = require('../services/userService');

// Ajout un nouvel utilisateur
const register = async (req, res, next) => {
    try {
        const { email, pseudo} = req.body;

        const verifPseudo = await ModelUser.findOne({ pseudo });
        if (verifPseudo) {
            return next(createError(409, "Pseudo already used"));
        }

        const verifEmail = await ModelUser.findOne({ email });
        if (verifEmail) {
            return next(createError(409, "Email already used"));
        }

        const hashPassword = await bcrypt.hash(req.body.password, 10) // moyenne de salage = 10 bon cryptage et pas trop lourd dans la base

        const user = await ModelUser.create({
            ...req.body,
            password: hashPassword
        });
    
        res.status(201).json(user);
    } catch (error) {
        next(createError(error.status || 500, "Failed to register", error.message));
    }
}

// connexion de l'utilisateur
const login = async(req, res, next) => {
    try {
        // 1 - Recherche 1 utilisateur dans la base de données ( basé sur son adresse email )
        const user = await ModelUser.findOne({ email: req.body.email });

        // 2 - Si l'utilisateur n'est pas trouvé, renvoie une erreur 404
        if (!user) return res.status(404).json('user not found ! ');

        // compare le mot de passe fourni dans la requete
        // avec le mot de passe de l'utilisateur
        const hashCompare = await bcrypt.compare(req.body.password, user.password)

        // 4 - Si le mot de passe est incorrect, renvoie une erreur 400
        if(!hashCompare){
            return res.status(400).json('Wrong Credentials !'); // ne pas mettre invalid password pour ne pas donner trop d'indice
        }
        
        // Crée un JWT
        const token = jwt.sign(
            { id: user._id},
            ENV.TOKEN,
            { expiresIn: "24h" },
        )

        const { password, ...others } = user._doc

        res.cookie(
            'access_token',
            token,
            {httpOnly: true}
        )
        .status(200)
        .json(others);
        
    } catch (error) {
        next(createError(error.status || 500, "Failed to login", error.message));
    }
}

// Déconnexion
const logout = async (req, res) => {
    try {
        res.clearCookie('access_token');
        res.status(200).json('Disconnection successful !');
    } catch (error) {
        res.status(500).json(error.message);
    }
}

// récupérer tout les utilisateurs
const getAll = async (req, res, next) => {
    try {
        // Status admin verification
        await checkIsAdmin(req.auth.id);
        const users = await ModelUser.find();
        res.status(200).json(users);
    } catch (error) {
        next(createError(error.status || 500, "Failed to get all users", error.message));
    }
}

// POST /users/:id/follow       abonner a un user
const followUser = async (req, res, next) => {
  try {
    const currentUserId = req.auth.id;      // id du user connecté (depuis ton middleware auth)
    const targetUserId = req.params.id;    // id du user à suivre

    if (currentUserId === targetUserId) {
      return next(createError(400, "You cannot follow yourself"));
    }

    const targetUser = await ModelUser.findById(targetUserId);
    if (!targetUser) {
      return next(createError(404, "User to follow not found"));
    }

    // (Optionnel) check déjà follow pour renvoyer un message clair
    const alreadyFollowing = await ModelUser.exists({
      _id: currentUserId,
      following: targetUserId,
    });

    if (alreadyFollowing) {
      return next(createError(409, "You are already following this user"));
    }

    // ✅ Mise à jour des 2 côtés
    await Promise.all([
      ModelUser.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }, // addToSet évite les doublons
      }),
      ModelUser.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    next(createError(500, "Error during subscription"));
  }
};

// POST /users/:id/unfollow    désabonner d'un user
const unfollowUser = async (req, res, next) => {
  try {
    const currentUserId = req.auth.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return next(createError(400, "You cannot unsubscribe from yourself."));
    }

    const targetUser = await ModelUser.findById(targetUserId);
    if (!targetUser) {
      return next(createError(404, "User not found"));
    }

    await Promise.all([
      ModelUser.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }, // retire
      }),
      ModelUser.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({ message: "Unsubscription successful" });
  } catch (error) {
    next(createError(500, "Error during unsubscription"));
  }
};

// récupérer les followers d'un user
const getFollowers = async (req, res, next) => {
  try {
    const user = await ModelUser.findById(req.params.id)
      .populate("followers", "pseudo avatar bio");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json(user.followers);
  } catch (error) {
    next(createError(500, "Error recovering followers"));
  }
};

// récupérer les following d'un user
const getFollowing = async (req, res, next) => {
  try {
    const user = await ModelUser.findById(req.params.id)
      .populate("following", "pseudo avatar bio");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json(user.following);
  } catch (error) {
    next(createError(500, "Error recovery following"));
  }
};

// récupérer mes followers
const getMyFollowers = async (req, res, next) => {
  try {
    const currentUserId = req.auth.id;

    const user = await ModelUser.findById(currentUserId)
      .populate("followers", "pseudo avatar");

    res.status(200).json(user.followers);
  } catch (error) {
    next(createError(500, "Error"));
  }
};

// récupérer les stats
const getUserStats = async (req, res, next) => {
  try {
    const user = await ModelUser.findById(req.params.id)
      .select("followers following");

    res.status(200).json({
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    next(createError(500, "User statistics error"));
  }
};

// update user
const updateUser = async (req, res, next) => {
    try {
        // Is it me?
        if (req.auth.id !== req.params.id) {
            // If it's not me, am I admin?
            await checkIsAdmin(req.auth.id);
        }

        const user = await ModelUser.findByIdAndUpdate(req.params.id, req.body, { new: true } );

        if(!user) return res.status(404).json('User not found');

        res.status(200).json('User updated', user);
    } catch (error) {
        next(createError(error.status || 500, "Failed to update user", error.message));
    }
}

// delete user
const deleteUser = async (req, res, next) => {
    try {
        const currentUserId = req.auth.id; // The connected user
        const targetUserId = req.params.id; // The user to delete

        // If I'm not deleting my account...
        if (currentUserId !== targetUserId) {
            // Then I should be an admin
            await checkIsAdmin(currentUserId);
        }

        const user = await ModelUser.findByIdAndDelete(req.params.id);

        if(!user) return res.status(404).json('User not found');
        
        res.status(200).json('User deleted');
    } catch (error) {
        next(createError(error.status || 500, "Failed to delete user", error.message));
    }
};

module.exports = {
    register,
    login,
    logout,
    getAll,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getMyFollowers,
    getUserStats,
    updateUser,
    deleteUser
};
