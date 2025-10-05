const mongoose = require('mongoose')

async function connectToDB(){
    const uri = process.env.MONGO_URI;
    if (!uri)
        throw new Error("Missing MongoDB URI")
    await mongoose.connect(uri,{
        dbName: "The-Flemmards-ConUEvents"
    });
    console.log('Successfully connected to: ', mongoose.connection.name)
}

module.exports = connectToDB;