const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    pseudo: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        maxlength: 200,
        default: 'bienvenue'
    },
    avatar: {
        type: String,
        default: "https://media.istockphoto.com/id/2151669184/fr/vectoriel/illustration-vectorielle-plate-en-niveaux-de-gris-avatar-profil-dutilisateur-ic%C3%B4ne-de.jpg?s=612x612&w=0&k=20&c=ZV0ZPkOctwgOPezeC06TP82e4GLg5OiPoptSEHDjSqc="
    },
    role : {
        type: String,
        enum: [ 'admin', 'user' ],
        default: 'user'
    },
    // On stocke les IDs des utilisateurs suivis et qui nous suivent
    following: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    followers: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" 
    }],
    createdAt: { 
        type: Date, default: Date.now 
    },
},
    {timestamps: true}
);

module.exports = mongoose.model("User", UserSchema);
