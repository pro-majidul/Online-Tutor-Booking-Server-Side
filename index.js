const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    Credential: true
}))
app.use(express.json())

// verification middleware
const verification = (req, res, next) => {
    console.log('varification on');
    next()
}


app.get('/', (req, res) => {
    res.send(`localhost open on port ${port}`)
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xihi8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const tutorialCollection = client.db('Tutor-Booking').collection('tutors')
        const languagelCollection = client.db('Tutor-Booking').collection('language')

        app.get('/tutors', async (req, res) => {
            const result = await tutorialCollection.find().toArray()
            res.send(result)
        })

        app.post('/tutors', async (req, res) => {
            const data = req.body
            const result = await tutorialCollection.insertOne(data);
            res.send(result)
        })

        app.post('/language', async (req, res) => {
            const data = req.body
            const result = await languagelCollection.insertOne(data);
            res.send(result)
        })
        app.get('/language', async (req, res) => {
            const result = await languagelCollection.find().toArray()
        })


        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);











app.listen(port, () => {
    console.log(`localhost PORT is ${port}`);
})