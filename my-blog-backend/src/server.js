
import 'dotenv/config' ;


//build wala step 
// nodemon is only dev mode not for production
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



import express from 'express';

//since we have mention "type": "module", so need to write .js
import {db, connectToDb } from './db.js';


//firebase admin 
import fs from 'fs';
import admin from 'firebase-admin';
const credentials = JSON.parse(
    fs.readFileSync('../credentials.json')
);
admin.initializeApp({credential:  admin.credential.cert(credentials),});



const app = express();
app.use(express.json());
// adding a middle ware ;


// build folder
app.use(express.static(path.join(__dirname,'../build')));
// route handler anything other than our api's (handles all that don't start with /api)
app.get(/^(?!\/api).+/ , (req,res)=>{
    res.sendFile(path.join(__dirname,'../build/index.html'));
});


///adding middleware to use auth token includesd in headers
app.use(async(req,res,next)=>{
    // bhai name waam sahi se likha karo bc authtoken me token ka t Capital likhdiya tha toh chal hi nhi rha tha 
    const {authtoken } = req.headers ;
    
    //null a skte hai even if the usr is not logged in kyoki axios null bhejdega aur if bhi chal jayega 
    if(authtoken )
    {   try{
            req.user = await admin.auth().verifyIdToken(authtoken );
        }
        catch (e) {
           return  res.sendStatus(400);
        }
    }
    req.user = req.user || {};
    next();
})

//async
app.get('/api/articles/:name', async (req, res) => {
    const {name} = req.params;
    
    const {uid} = req.user;

    const article = await db.collection('articles').findOne({ name }); 
    if(article){
        const upvoteIds = article.upvoteIds || [];
        article.canUpvote = uid && !upvoteIds.includes(uid); 
        res.json(article);    
    }
    else
    res.status(404).send("Article Not Found");
});




app.use((req,res,next)=>{
    if(req.user){
        next();
    }
    else    
    res.sendStatus(401);
})
app.put('/api/articles/:name/upvote',async(req,res) =>{
    const {uid} = req.user;
    
    const {name} = req.params;
    const article = await db.collection('articles').findOne({ name }); 
    // console.log(uid);
    if(article){
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.includes(uid); 
        
        if(canUpvote){
        await db.collection('articles').updateOne({ name } , {
            $inc:{upvotes:1},
            $push:{upvoteIds :uid},
        }); 
    }
        const updatedArticle = await db.collection('articles').findOne({ name });
        res.json(updatedArticle );
    }
    else
        res.send( `The ${name} has not exist`);


});







app.post('/api/articles/:name/comments',async(req,res) =>{
    const {name} = req.params;
    const { text } = req.body;
    const {email} = req.user;

    
    await db.collection('articles').updateOne({ name } , {
        $push:{comments:{postedBy: email  , text }},
    });
    const article = await db.collection('articles').findOne({ name });
    if(article){
        
        res.json( article );
    }
    else
        res.send( `The ${name} has not exist`);

});





const PORT = process.env.port || 8000 ;


connectToDb( ()=> {
    app.listen(PORT, () =>{
        console.log("Server is Listening on port "+PORT);
    });
})