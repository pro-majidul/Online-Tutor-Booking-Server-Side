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
        const UserCollection = client.db('Tutor-Booking').collection('users')

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
        app.put('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const data = req.body;
            const option = { upsert: true }
            const updateInfo = {
                $set: {
                    language: data.language,
                    price: data.price,
                    description: data.description,
                    photo: data.photo
                }
            }
            const result = await tutorialCollection.updateOne(query, updateInfo, option);
            res.send(result)
        })

        app.delete('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const data = await tutorialCollection.deleteOne(query);
            res.send(data)
        })


        app.patch('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const update = {
                $inc: {
                    review: 1
                }
            }
            const data = await tutorialCollection.updateOne(query, update);
            res.send(data)
        })

        app.get('/tutor/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await tutorialCollection.find(query).toArray()
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
            const users = await UserCollection.estimatedDocumentCount()
            res.send({ totaltutorial: result, totalReview: reviewcount, totalLanguage: language, usercount: users })
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
            const query = {
                tutorId: data.tutorId,
                email: data.email

            }
            const isAxist = await tutorBookCollecton.findOne(query);
            if (isAxist) {
                return res.status(401).send('Already Booked this Tutorial')
            };
            const result = await tutorBookCollecton.insertOne(data);
            res.send(result)
        })

        app.get('/tutorBooked', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await tutorBookCollecton.find(query).toArray();
            res.send(result)
        })


        // Useer APIs

        app.post('/users', async (req, res) => {
            const data = req.body;
            const result = await UserCollection.insertOne(data)
            res.send(result)
        })

        app.put('/users/:email', async (req, res) => {
            const user = req.body;
            const email = req.params.email
            const query = { email: email }
            const option = { upsert: true }
            const updatedata = {
                $set: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo
                }
            }
            const result = await UserCollection.updateOne(query, updatedata, option);
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await UserCollection.find().toArray()
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