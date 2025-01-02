const router = require("./routes/route");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const Stripe = require("stripe");
const app = express();
const cloudinary = require("cloudinary").v2;
const admin = require("firebase-admin");
require("dotenv").config();
app.use(express.json());
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors());
const PORT = 3000;

// setup for push notification
const serviceAccount = {
  projectId: process.env.GOOGLE_PROJECT_ID,
  privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  clientId: process.env.GOOGLE_CLIENT_ID,
  authUri: process.env.GOOGLE_AUTH_URI,
  tokenUri: process.env.GOOGLE_TOKEN_URI,
  certUrl: process.env.GOOGLE_CERT_URL,
  clientX509CertUrl: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  universeDomain: process.env.GOOGLE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// const PORT = process.env.SECRET_KEY || 3000;

// for generating image url
cloudinary.config({
  cloud_name: "doyux5mj8",
  api_key: "869138434164782",
  api_secret: "uOFk1ocUAqFDPRgAxJu3CRd4d4E",
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const URL =
  "mongodb+srv://ms0319255:hkPA6m6dTEsnw2vJ@trinity.imcsgrs.mongodb.net/?appName=Trinity";
const client = new MongoClient(URL);

const connectToMongoose = async () => {
  try {
    await mongoose.connect(URL, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Connected to mongoose ");
  } catch (error) {}
};

const connectToMongoDb = async () => {
  try {
    await client.connect();
    console.log("Connected to mongodb database");
  } catch (error) {
    console.log("Error while connecting to mongoDb database", error.message);
  }
};

// app.post("/create-payment-intent", async (req, res) => {
//   const { amount, currency } = req.body;
//   console.log(req.body);
//   // return;

//   try {
//     // Create a PaymentIntent with the specified amount and currency
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency,
//       payment_method_types: ["card", "alipay"],
//     });

//     res.status(200).send({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (error) {
//     console.error("Error creating payment intent:", error);
//     res.status(500).send({ error: error.message });
//   }
// });

app.use("/", router);

app.listen(PORT, () => {
  try {
    console.log("Server is running on port", PORT);
    connectToMongoDb();
    connectToMongoose();
  } catch (error) {
    console.log("Error while running server internal server error!");
  }
});
