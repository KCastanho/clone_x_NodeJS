const jwt = require('jsonwebtoken');
const createError = require('./error');
const ENV = require('../config/env');

const verifyToken = (req, res, next) => {
    // Récupère le json (token) jwt à partir des cookies

    const token = req.cookies.access_token;

    if(!token) return next(createError(401, "Acces Denied"));

    // vérifie la validité du token en utilisant jwt.verify
    jwt.verify(token, ENV.TOKEN, (err, user) => {
        if(err) return next(createError(403, "Invalid Token"));

        /* 
            Si la vérification réussi, on ajoute les informations de l'utilisateur dans l'objet "req.auth"
        */
        req.auth = user

        next()
    })

}

module.exports = verifyToken;