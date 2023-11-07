const express=require('express');
const app=express();
const port=process.env.PORT ||5000;
const cors=require('cors');
const jwt=require('jsonwebtoken');



// middleware

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('food unity network server is running');
})
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})