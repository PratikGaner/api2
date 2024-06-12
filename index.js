const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
 
require('dotenv').config();
 
const app = express();
const port = 4000; // Change to your desired port number

// Middleware to parse JSON bodies
app.use(express.json());

// GET endpoint for testing
app.get('/webhook', async (req, res) => {
  console.log('GET request received');
  res.status(200).send("GET Reached");   
});

// POST endpoint to handle webhook
app.post('/webhook', async (req, res) => {
  console.log('POST request received');
  try {
    // Log the incoming request body
    const payload = req.body;
    console.log('Request Payload:', payload);

    // Validate payload
    if (!payload.title || !payload.message) {
      console.log('Invalid payload:', payload);
      return res.status(400).send('Invalid payload');
    }

    // Send an email with the payload
    await sendEmail(payload);

    // Respond to the client
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

// Function to send an email
async function sendEmail(payload) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // Replace with your SMTP host
    port: 587, // Replace with your SMTP port
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Replace with your email username
      pass: process.env.EMAIL_PASS, // Replace with your email password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM, // Replace with your email address
    to: [process.env.EMAIL_TO, process.env.EMAIL_TO_1,process.env.EMAIL_TO_2], // Replace with recipient email address
    subject: payload.title,
    text: payload.message,
  };

  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully');
}
 
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
 
  do this in this code
