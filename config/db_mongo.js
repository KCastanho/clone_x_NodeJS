const mongoose = require('mongoose');

const connectDB = (mongoURI, dbName) => {
    mongoose.connect(mongoURI, {dbName: dbName})
    .then(() => console.log('connexion à mongo reussi !'))
    .catch(error => console.log(`Erreur de connexion à mongo : ${error}`))
}

module.exports = connectDB;