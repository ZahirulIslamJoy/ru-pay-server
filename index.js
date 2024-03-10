require("dotenv").config();
const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const port = 7000;
const { MongoClient, ServerApiVersion } = require("mongodb");
app.use(cors());
app.use(express.json());

//HJE7l9muvAoGQbIU
//rupay

const uri =
  "mongodb+srv://rupay:HJE7l9muvAoGQbIU@cluster0.tzxjncj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const userCollection = client.db("rupay").collection("users");
    const paymentCollection = client.db("rupay").collection("payments");
    const cardsCollection = client.db("rupay").collection("cards");

    //post method of the jwt token
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //store user info in the database //no verify needed
    app.put("/users", async (req, res) => {
      const userInfo = req.body;
      console.log(userInfo);
      const query = { email: userInfo.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: userInfo,
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    //get details of a single user
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/sendmoney", async (req, res) => {
      const paymentInfo = req.body;
      const sendingUser = paymentInfo.sendingUserAccountNo;
      const receiverUserAccount = paymentInfo.receiverAccountNo;
      const sendingUserQuery = { accountNo: sendingUser };
      const receiverUserQuery = { accountNo: receiverUserAccount };
      const sendingUserData = await userCollection.findOne(sendingUserQuery);
      const receiveUserData = await userCollection.findOne(receiverUserQuery);
      const sendingUserBalance = parseInt(sendingUserData.balance);
      const newBalanceOfSender = sendingUserBalance - paymentInfo.sendingMoney;
      console.log(newBalanceOfSender);
      const receiverUserBalance = receiveUserData.balance;
      const newBalanceOfReceiver =
        receiverUserBalance + paymentInfo.sendingMoney;
      const updateDoc = {
        $set: {
          balance: newBalanceOfSender,
        },
      };
      const updateDoc1 = {
        $set: {
          balance: newBalanceOfReceiver,
        },
      };
      const paymentResult = await paymentCollection.insertOne(paymentInfo);
      const modifiedSenderBalanceResult = await userCollection.updateOne(
        sendingUserQuery,
        updateDoc
      );
      const modifiedReceiverBalanceResult = await userCollection.updateOne(
        receiverUserQuery,
        updateDoc1
      );
      res.send({
        modifiedSenderBalanceResult,
        modifiedReceiverBalanceResult,
        paymentResult,
      });
    });

    app.post("/withdraw", async (req, res) => {
      const paymentInfo = req.body;
      const sendingUser = paymentInfo.sendingUserAccountNo;
      const receiverUserAccount = paymentInfo.receiverAccountNo;
      const sendingUserQuery = { accountNo: sendingUser };
      const receiverUserQuery = { accountNo: receiverUserAccount };
      const sendingUserData = await userCollection.findOne(sendingUserQuery);
      const receiveUserData = await userCollection.findOne(receiverUserQuery);
      const sendingUserBalance = parseInt(sendingUserData.balance);
      const newBalanceOfSender = sendingUserBalance - paymentInfo.sendingMoney;
      console.log(newBalanceOfSender);
      const receiverUserBalance = receiveUserData.balance;
      const newBalanceOfReceiver =
        receiverUserBalance + paymentInfo.sendingMoney;
      const updateDoc = {
        $set: {
          balance: newBalanceOfSender,
        },
      };
      const updateDoc1 = {
        $set: {
          balance: newBalanceOfReceiver,
        },
      };
      const paymentResult = await paymentCollection.insertOne(paymentInfo);
      const modifiedSenderBalanceResult = await userCollection.updateOne(
        sendingUserQuery,
        updateDoc
      );
      const modifiedReceiverBalanceResult = await userCollection.updateOne(
        receiverUserQuery,
        updateDoc1
      );
      res.send({
        modifiedSenderBalanceResult,
        modifiedReceiverBalanceResult,
        paymentResult,
      });
    });

    app.post("/addMoney", async (req, res) => {
      let paymentInfo = req.body;
      const sendingUser = paymentInfo.receiverAccountNo;
      const cardNo = paymentInfo.cardNo;
      const cardNoQuery = { number: cardNo };
      const cardNumberInfo = await cardsCollection.findOne(cardNoQuery);
      if (!cardNumberInfo) {
        res.send({ status: "Invalid Card No" });
      }
      if (cardNumberInfo) {
        const cardNumberAmount = parseInt(cardNumberInfo.amount);
        paymentInfo.sendingMoney = cardNumberAmount;
        const receiverUserQuery = { accountNo: sendingUser };
        const receiveUserData = await userCollection.findOne(receiverUserQuery);
        const newBalanceOfReceiver = receiveUserData.balance + cardNumberAmount;
        const updateDoc = {
          $set: {
            balance: newBalanceOfReceiver,
          },
        };
        const modifiedBalanceResult = await userCollection.updateOne(
          receiverUserQuery,
          updateDoc
        );
        const paymentResult = await paymentCollection.insertOne(paymentInfo);
        const deletedResult = await cardsCollection.deleteOne(cardNoQuery);
        res.send({ modifiedBalanceResult, paymentResult, deletedResult });
      }
    });

    app.get("/history/:userAccount", async (req, res) => {
      const account = req.params.userAccount;
      const query = {
        $or: [
          { sendingUserAccountNo: account },
          { receiverAccountNo: account },
        ],
      };
      const result = await paymentCollection.find(query).sort({ time: -1 }).toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
