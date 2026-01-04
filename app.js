const express = require('express');
const connectDB = require('./config/db_mongo');
const ENV = require('./config/env');
const app = express();
const cookieParser = require('cookie-parser');

// IMPORT ROUTES
const userRouter = require('./router/user.router');
const tweetRouter = require("./router/tweet.rooter");



// CONNECTION MONGO
connectDB(ENV.MONGO_URI_LOCAL, ENV.DB_NAME);


// MIDDLEWARES
app.use(cookieParser()); 
app.use(express.json());



// PREFIX
app.use('/api/user', userRouter);
app.use("/api/tweet", tweetRouter);


// MIDDLEWARE DE GESTION D'ERREURS
app.use((error, req, res, next) => {
    const status = error.status || 500
    const message = error.message || "Une erreur est survenue."
    const detail = error.details || null

    res.status(status).json({
        error: {
            status,
            message,
            detail
        }
    })
})

module.exports = app;