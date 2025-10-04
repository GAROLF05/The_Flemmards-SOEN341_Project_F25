const express = require('express')
const app = express()
const PORT = 3000
const mongoose = require('mongoose')

// 1. Connect to your MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/conuvents')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

// 2. Define a simple schema (like a table structure)
const ticketSchema = new mongoose.Schema({
  event: String,
  price: Number,
  buyer: String
});

// 3. Create a model (like a table interface)
const Ticket = mongoose.model('Ticket', ticketSchema);

// 4. Add (insert) one document to the collection
async function addTicket() {
  const newTicket = new Ticket({
    event: 'Homecoming Party',
    price: 25,
    buyer: 'Nameer'
  });

  await newTicket.save(); // save it to MongoDB
  console.log('🎟️ Ticket saved:', newTicket);
  mongoose.connection.close(); // optional: close connection after saving
}

// 5. Run it
addTicket();


app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}/`));
