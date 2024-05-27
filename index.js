const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
const port = 3000; // Change to your desired port number

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

    // Extract the message part from the payload
    const message = payload.message;
    console.log('Received message:', message);
    // Extract text up to the 'Annotations' label
    const annotationsLabelIndex = message.indexOf('Annotations:');
    if (annotationsLabelIndex === -1) {
      return res.status(400).send('Invalid payload: Annotations label not found');
    }

    const extractedMessage = message.substring(0, annotationsLabelIndex).trim();
    
    // Define work item data
    const workItemData = {
      title: payload.title,
      reproSteps: extractedMessage,
    };

    // Call Azure DevOps API to create a work item
    const response = await createWorkItem(workItemData);

    // Log the response from Azure DevOps API
    console.log('Work item created:', response.data);

    // Send an email with the payload
    await sendEmail(payload);

    // Respond to the client
    res.status(200).send('Work item created and email sent successfully');
  } catch (error) {
    console.error('Error creating work item or sending email:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      console.error('Request made but no response received:', error.request);
      res.status(500).send('No response received from Azure DevOps');
    } else {
      console.error('Error setting up request:', error.message);
      res.status(500).send('Error setting up request to Azure DevOps');
    }
  }
});

// Function to create a work item using Azure DevOps API
async function createWorkItem(workItemData) {
  const organization = 'TICMPL';
  const project = 'Training';
  const personalAccessToken = process.env.PAT;
  const type = 'Bug';

  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${type}?api-version=6.0`;

  // Define the work item fields
  const workItemFields = [
    {
      op: 'add',
      path: '/fields/System.Title',
      value: workItemData.title,
    },
    {
      op: 'add',
      path: '/fields/Microsoft.VSTS.TCM.ReproSteps',
      value: workItemData.reproSteps,
    },
  ];

  const config = {
    headers: {
      'Content-Type': 'application/json-patch+json',
      Authorization: `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
    },
  };

  // Log the fields and config
  console.log('Work Item Fields:', workItemFields);
  console.log('Request Config:', config);

  return axios.post(url, workItemFields, config);
}

// Function to send an email
async function sendEmail(payload) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Replace with your SMTP host
    port: 587, // Replace with your SMTP port
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'process.env.EMAIL_USER', // Replace with your email username
      pass: 'process.env.EMAIL_PASS', // Replace with your email password
    },
  });

  const mailOptions = {
    from: 'process.env.EMAIL_FROM', // Replace with your email address
    to: 'process.env.EMAIL_TO', // Replace with recipient email address
    subject: `Webhook Payload: ${payload.title}`,
    text: JSON.stringify(payload, null, 2),
  };

  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully');
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
