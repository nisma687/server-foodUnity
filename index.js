const express=require('express');
const app=express();
const port=process.env.PORT ||5000;
const cors=require('cors');
const jwt=require('jsonwebtoken');
const cookieParser=require ('cookie-parser');


// middleware

app.use(cors(
  {
    origin:['http://localhost:5173'],
  credentials:true
  }
));
app.use(cookieParser());
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
const verifyToken=async(req,res,next)=>{
  const token=req.cookies.token;
  console.log(token);
  if(!token){
    res.status(401).send({error:'unauthorized user',
    success:false,message:'unauthorized user'
    });
  }
  jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
    if(err){
      console.log(err);
      res.status(401).send({error:'unauthorized user',
    success:false,message:'unauthorized user'
    });
    }
    console.log('decoded',decoded);
    req.user=decoded;
    next();
  })
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const featuredFood=client.db("featureddB").collection("foods");
    const requestFood=client.db("featureddB").collection("requestfood");
    const fivedb=client.db("featureddB").collection("fivedb");
    const events=client.db("featureddB").collection("events");
    app.get('/fivedb',async(req,res)=>{
      const cursor=fivedb.find();
      const foods=await cursor.toArray();
      res.send(foods);

    })
    app.get('/events',async(req,res)=>{
      const cursor=events.find();
      const foods=await cursor.toArray();
      res.send(foods);

    })
    // jwt (json web token setup)
    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      console.log(user);
      const token=jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1h'});
      console.log(token);
      // for checking token
      // res.send({token});
      res.cookie('token',
      token,{httpOnly:true,secure:true,sameSite:'none'})
      .send({success:true});
    })
    app.post('/logout',(req,res)=>{
      const user=req.body;
      console.log(user);
      res.clearCookie('token',{maxAge:0})
      .send({success:true});
    })
    


    app.get('/fivedb/:id',async(req,res)=>{
      const id=req.params.id;
      const food=await fivedb.findOne({_id:new ObjectId(id)});
      console.log(food);
      res.send(food);
    })
    app.get('/featured',async(req,res)=>{
      const cursor=featuredFood.find();
      const foods=await cursor.toArray();
      res.send(foods);

    })
    app.get('/featured/:id',verifyToken,async(req,res)=>{
     
      // console.log(req.params)
      const id=req.params.id;
      const food=await featuredFood.findOne({_id:new ObjectId(id)});
      console.log(food);
      res.send(food);
    })
    app.patch('/featured/:id',async(req,res)=>{
      const id=req.params.id;
      
      const food=req.body;
      console.log('updating food',id,food);
      const query={_id:new ObjectId(id)};
      const newValues={
        $set:food,
      };
      const result=await featuredFood.updateOne(query,newValues);
      console.log(result);
      res.json(result);
    })
    app.post('/featured',async(req,res)=>{
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
    app.delete('/featured/:id',async (req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await featuredFood.deleteOne(query);
      console.log(result);
      res.json(result);
    })
    app.get('/requestfood',verifyToken,async(req,res)=>{
      console.log(req.user);
      // console.log(req.query);
      console.log(req.query.donorName);
      let query={};
      if(req.query?.donorName){
        query.donorName=req.query.donorName;
        
      }
      const cursor=requestFood.find(query);
      const foods=await cursor.toArray();
      console.log(foods);
      res.send(foods);

    })
    app.get('/requestfood/:id',async(req,res)=>{
      const id=req.params.id;
      const food=await requestFood.findOne({_id:new ObjectId(id)});
      console.log(food);
      res.send(food);
    })
    
    app.delete('/requestfood/:id',async (req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await requestFood.deleteOne(query);
      console.log(result);
      res.json(result);
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