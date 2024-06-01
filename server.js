const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userDb = require("./userSchema");

dotenv.config({ path: "./config.env" });

const app = express();

const PORT = process.env.PORT || 80;

// db
mongoose
    .connect(process.env.MONGO_URI)
    .then((conn) =>
        console.log(`MongoDB connection successful: ${conn.connection.host}`)
    )
    .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });

const db = mongoose.connection;

const paginatedResults = (model) => {
    return async (req, res, next) => {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const startIdx = limit * (page - 1);
        const endIdx = limit * page;

        const results = {};


        if (endIdx < await userDb.countDocuments().exec())
            results.next = {
                page: page + 1,
                limit: limit
            }
        if (startIdx > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }

        try {
            results.result = await model.find().limit(limit).skip(startIdx).exec();
            res.paginatedResult = results;
            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

app.get("/users", paginatedResults(userDb), (req, res) => {
    res.json(res.paginatedResult);
})

app.listen(PORT, () => {
    console.log(`App running on PORT ${PORT}`);
})