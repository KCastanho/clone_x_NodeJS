const createError = (status, message, details = null) => {
    // Cree une nouvelle instance d'eerreur vide
    const error = new Error()
/*
Definit le code de l'erreur en fonction du paramètre "status"
*/ 
    error.status = status;
/*
Definit le code d'etat de l'erreur en fonction du paramètre "message"
*/ 
    error.message = message;
/* 
    Permet d'ajouter des infos supplémentaire si besoin
*/
    error.details = details;

    return error;
}

module.exports = createError