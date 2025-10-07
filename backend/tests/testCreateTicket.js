const axios = require('axios');

async function testCreateTicket() {
  try {
    // Replace with your local backend URL & route
    const url = 'http://localhost:3000/api/tickets/create'; 

    // Example body — make sure registrationId exists in your DB
    const body = {
      registrationId: '68e35fe4b0c6c3cf2e50dac6', // 👈 replace with a real ObjectId from Registration collection
      quantity: 2
    };

    const response = await axios.post(url, body);

    console.log('✅ SUCCESS: Ticket(s) created');
    console.log('Response data:', response.data);

  } catch (error) {
    if (error.response) {
      console.error('❌ Server responded with error:');
      console.error(error.response.data);
    } else {
      console.error('🚫 Request failed:', error.message);
    }
  }
}

testCreateTicket();
