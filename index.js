const express = require('express')
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookeParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()

// middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173','https://online-tutor-booking-pla-c7f2c.web.app','https://online-tutor-booking-pla-c7f2c.firebaseapp.com'],
    credentials: true,
}))
// app.use(cors())
app.use(express.json())
app.use(cookeParser())

// verification middleware

const verification = (req, res, next) => {
    const token = req.cookies?.token;
    console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'UnAuthorize Token ' })
    }
    jwt.verify(token, process.env.Secure_Web_Token, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Token Not Match' })
        }
        req.userdec = decoded
        next()
    })
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


        // Auth related APIs

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const Token = jwt.sign(user, process.env.Secure_Web_Token, { expiresIn: '10h' })
            res
                .cookie('token', Token, {
                    httpOnly: true,
                    // secure: false
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true })
        })

        app.post('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                // secure: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
            })
                .send({ success: true })
        })





        // Tutors APIs
        app.get('/tutors', async (req, res) => {
            const lang = req.query.languages;
            const search = req.query.search;
            let query = {
                language: {
                    $regex: search, $options: 'i'
                }
            };
            if (lang) {
                query = { language: lang }
            }
            const result = await tutorialCollection.find(query).toArray()

            res.send(result)
        })

        app.get('/allTutors', async (req, res) => {
            const search = req.query.search;
            let query = {
                language: {
                    $regex: search, $options: 'i'
                }

            }
            const result = await tutorialCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/tutors/:id', verification, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            const query = { _id: new ObjectId(id) }
            const result = await tutorialCollection.findOne(query)
            res.send(result)
        })


        app.put('/tutors/:id', verification, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'Unauthorized Access' })
            }
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

        app.delete('/tutors/:id', verification, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            const query = { _id: new ObjectId(id) }
            const data = await tutorialCollection.deleteOne(query);
            res.send(data)
        })


        app.patch('/tutors/:id', verification, async (req, res) => {
            const id = req.params.id;
            const email = req.query.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            const query = { _id: new ObjectId(id) }
            const update = {
                $inc: {
                    review: 1
                }
            }
            const data = await tutorialCollection.updateOne(query, update);
            res.send(data)
        })

        app.get('/tutor/:email', verification, async (req, res) => {
            const email = req.params.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'Forbidden  access' })
            }
            const query = { email }
            const result = await tutorialCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/tutors', verification, async (req, res) => {
            const data = req.body
            const email = data.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: "Email is Not Matched" })
            }
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

        app.post('/tutorBooked', verification, async (req, res) => {
            const data = req.body;
            const email = req.body.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: 'unauthorize Access' })
            }
            const query = {
                tutorId: data.tutorId,
                email: data.email

            }
            const isAxist = await tutorBookCollecton.findOne(query);
            if (isAxist) {
                return res.status(400).send('Already Booked this Tutorial')
            };
            const result = await tutorBookCollecton.insertOne(data);
            res.send(result)
        })

        app.get('/tutorBooked', verification, async (req, res) => {
            const email = req.query.email;
            const userEmail = req.userdec.email;
            if (userEmail != email) {
                return res.status(403).send({ message: "Unauthorized Access" })
            }
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