const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.oqbd1pk.mongodb.net/?appName=Cluster1`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const database = client.db("habitDB");
    const habitsCollection = database.collection("habit");

    app.get('/habits', async (req, res) => {
      const result = await habitsCollection.find().toArray();
      res.send(result)
    })

    app.get('/latest-habits', async (req, res) => {
      const sortFields = { createdAt: -1 };
      const result = await habitsCollection.find().sort(sortFields).limit(6).toArray();
      res.send(result)
    })

    app.get('/my-habits', async (req, res) => {
      const email = req.query.email;
      const filter = {}
      if (email) {
        filter.userEmail = email
      }
      const result = await habitsCollection.find(filter).toArray()
      res.send(result)
    })

    app.get('/search', async (req, res) => {
      const search = req.query.search;
      const result = await habitsCollection.find({ title: {$regex: search, $options: 'i' }}).toArray();
      res.send(result)
    })

    app.get('/filter', async (req, res) => {
      const filter = req.query.filter;
      const result = await habitsCollection.find({ category: filter}).toArray();
      res.send(result)
    })

    app.post('/habits', async (req, res) => {
      const habit = req.body;
      const newHabit = {
        ...habit,
        createdAt: new Date(),
        completionHistory: []
      }
      const result = await habitsCollection.insertOne(newHabit);
      res.send(result);
    })

    app.patch('/habits/:id', async (req, res) => {
      const id = req.params.id;
      const updatedHabit = req.body;  
      const filter = {_id: new ObjectId(id)}
      const update = {
        $set: updatedHabit
      }
      const result = await habitsCollection.updateOne(filter, update)
      res.send(result)
    })

    // delete api
    app.delete('/habits/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await habitsCollection.deleteOne(filter)
      res.send(result)
    })



    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Habit Tracker is running on server')
})

app.listen(port, () => {
  console.log(`Habit Tracker is listening on port ${port}`)
})
