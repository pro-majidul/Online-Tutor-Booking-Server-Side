const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()

// middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
}))
// app.use(cors())
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
        const languagelCollection = client.db('Tutor-Booking').collection('language');
        const tutorBookCollecton = client.db('Tutor-Booking').collection('tutorBooked')

        // Tutors APIs
        app.get('/tutors', async (req, res) => {
            const lang = req.query.language;
            let query = {};
            if (lang) {
                query = { language: lang }
            }
            const result = await tutorialCollection.find(query).toArray()

            res.send(result)
        })

        app.get('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tutorialCollection.findOne(query)
            res.send(result)
        })

        app.post('/tutors', async (req, res) => {
            const data = req.body
            const result = await tutorialCollection.insertOne(data);
            res.send(result)
        })

        app.get('/tutorsCount', async (req, res) => {

            const language = await languagelCollection.estimatedDocumentCount()
            const reviewcount = await tutorialCollection.aggregate([
                {
                    $group: { _id: null, total: { $sum: "$review" } }
                }
            ]).toArray()
            const result = await tutorialCollection.estimatedDocumentCount();

            res.send({ totaltutorial: result, totalReview: reviewcount, totalLanguage: language })
        })

        // Language APIs
        app.post('/language', async (req, res) => {
            const data = req.body
            const result = await languagelCollection.insertOne(data);
            res.send(result)
        })
        app.get('/language', async (req, res) => {
            const result = await languagelCollection.find().toArray()
            res.send(result)
        })

        //Booked Tutors APIs
        app.post('/tutorBooked', async (req, res) => {
            const data = req.body;
            const id = { tutorId: data.tutorId }
            const isAxist = await tutorBookCollecton.findOne(id)
            if (isAxist) {
                return res.status(401).send('You already Booked This Data')
            }
            const result = await tutorBookCollecton.insertOne(data);
            res.send(result)
        })

        app.get('/tutorBooked', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await tutorBookCollecton.find(query).toArray();
            res.send(result)
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