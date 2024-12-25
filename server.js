const mongodb = require("mongodb");
const router = require("./routes/route");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const Stripe = require("stripe");
const app = express();
// const PORT = process.env.SECRET_KEY || 3000;

require("dotenv").config();
app.use(express.json());
app.use(bodyParser.json());

const cors = require("cors");
app.use(cors());
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = 3000;

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
