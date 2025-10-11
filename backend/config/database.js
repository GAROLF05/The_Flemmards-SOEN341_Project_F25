const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function connectToDB({ retries = 3, backoffMs = 500 } = {}) {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MongoDB URI");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, { dbName: "The-Flemmards-ConUEvents" });
      console.log("Successfully connected to:", mongoose.connection.name);
      return mongoose.connection;
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${attempt} failed:`,
        err.message || err
      );
      if (attempt === retries) {
        console.error("All MongoDB connection attempts failed.");
        throw err; // let the caller decide (exit/retry)
      }
      const wait = backoffMs * Math.pow(2, attempt - 1);
      console.log(`Retrying MongoDB connection in ${wait}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, wait));
    }
  }
}

module.exports = connectToDB;
