const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");
const cors = require("cors");

app.get('/', (req, res) => {
  res.send('hello');
});


// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("dist"));

//API credentials (from .env)
const apiKey = process.env.YAYA_API_KEY;
const apiSecret = process.env.YAYA_API_SECRET;
const baseUrl = process.env.YAYA_BASE_URL; // Include base URL from env

// Function to generate signature
function generateSignature(timestamp, method, endpoint, body) {
  const preHashString = `${timestamp}${method}${endpoint}${body}`;
  const hmac = crypto.createHmac("sha256", apiSecret);
  hmac.update(preHashString);
  return Buffer.from(hmac.digest()).toString("base64");
}

function authHeaders(timestamp, signature) {
  return {
    "Content-Type":"application/json",
    "YAYA-API-KEY": apiKey,
    "YAYA-API-TIMESTAMP": timestamp,
    "YAYA-API-SIGN": signature,
  };
}
// Route to handle transaction retrieval
app.get("/transactions", async (req, res) => {
  try {
    const endpoint = "/api/en/transaction/find-by-user";
    const method = "GET";
    // Get current timestamp
    const timestamp = Date.now();
    // Generate signature using empty body for GET request
    const signature = generateSignature(timestamp, method, endpoint, "");
    // Build authentication headers
    const headers = authHeaders(timestamp, signature);
    // Build query parameters (if any)
    const queryParams = req.query;
    // Make API request to YAYA END POINT API
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers,
      params: queryParams,
    });
    const pageSize = response?.data && response.data?.lastPage
    // mapping data to what the application needs
    const transactions = response?.data?.data.map((transaction) => {
      const { id, sender, receiver, amount, currency, cause, created_at_time } =
        transaction;
      return  {
        id,
        sender,
        receiver,
        amount,
        currency,
        cause,
        created_at_time,
      };
    });
    // Handle successful response
    res.json({transactions, pageSize, itemsPerPage:transactions.length});
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
app.get("/transactions/search", async (req, res) => {
  try {
    const method = "POST";
    const endpoint = "/api/en/transaction/search";
    const timestamp = Date.now();

    const data = {
      query:req?.query?.query
    } 
   const params = {
    p:req.query.p
   }

    const signature = generateSignature( timestamp,method, endpoint,JSON.stringify(data));
    const headers = authHeaders(timestamp, signature);
    
    const response = await axios.post(`${baseUrl}${endpoint}`, JSON.stringify(data), { headers, params});
    const pageSize = response?.data && response.data?.lastPage
    // mapping data to what the application needs
    const transactions = response?.data?.data.map((transaction) => {
      const { id, sender, receiver, amount, currency, cause, created_at_time } =
        transaction;
      return  {
        id,
        sender,
        receiver,
        amount,
        currency,
        cause,
        created_at_time,
      };
    });
    // Handle successful response
    res.json({transactions, pageSize, itemsPerPage:transactions.length});
    
  } catch (error) {
    console.log(error)
    res.send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
