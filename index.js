const express=require('express');
const app=express();
const port=process.env.PORT ||5000;
const cors=require('cors');
const jwt=require('jsonwebtoken');



// middleware

app.use(cors(
  {
    origin:['http://localhost:5173'],
  credentials:true
  }
));
app.use(express.json());
// database connection(mongodb)
require('dotenv').config();
console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.231nuf3.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const featuredFood=client.db("featureddB").collection("foods");
    const requestFood=client.db("featureddB").collection("requestfood");
    app.get('/featured',async(req,res)=>{
      const cursor=featuredFood.find();
      const foods=await cursor.toArray();
      res.send(foods);

    })
    app.get('/featured/:id',async(req,res)=>{
      const id=req.params.id;
      const food=await featuredFood.findOne({_id:new ObjectId(id)});
      console.log(food);
      res.send(food);
    })
    app.post('/addfood',async(req,res)=>{
      const food=req.body;
      console.log('adding new food',food);
      const result=await featuredFood.insertOne(food);
      console.log(result);
      res.json(result);
    })
    app.post('/requestfood',async(req,res)=>{
      const food=req.body;
      console.log('adding new food',food);
      const result=await requestFood.insertOne(food);
      console.log(result);
      res.json(result);
    
    })
    app.get('/requestfood',async(req,res)=>{
      const cursor=requestFood.find();
      const foods=await cursor.toArray();
      res.send(foods);

    })

    

app.get('/search/:search', async (req, res) => {
    const search = req.params.search.trim(); // Trim the search term
    console.log('Search term:', search); // Log the search term for debugging

    try {
        const escapeStringRegexp = (await import('escape-string-regexp')).default; // Use dynamic import for ESM module
        const escapedSearch = escapeStringRegexp(search); // Escape special characters in the search term

        const cursor = featuredFood.find({ name: { $regex: escapedSearch, $options: 'i' } }); // Perform case-insensitive regex search
        const results = await cursor.toArray(); // Convert cursor to array

        res.send(results); // Send the search results to the client
    } catch (error) {
        console.error('Error occurred during search:', error);
        res.status(500).send('An error occurred during search.'); // Handle errors and send a 500 internal server error response
    }
});



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('food unity network server is running');
})
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})