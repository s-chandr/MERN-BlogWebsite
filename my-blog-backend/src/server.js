// nodemon is only dev mode not for production


import express from 'express';

//since we have mention "type": "module", so need to write .js
import {db, connectToDb } from './db.js';

const app = express();

app.use(express.json());
// adding a middle ware ;

//async
app.get('/api/articles/:name', async (req, res) => {
    const {name} = req.params;
    const article = await db.collection('articles').findOne({ name }); 
    if(article)
    res.json(article);
    else
    res.status(404).send("Article Not Found");
});

// //sample array db
// let articleInfo =[{
//     name:"learn-react",
//     upvotes:0,
//     comments:[],
// },{
//     name:"learn-node",
//     upvotes:0,
//     comments:[]
// },{
//     name:"mongoDb",
//     upvotes:0,
//     comments:[],
// }]








app.put('/api/articles/:name/upvote',async(request,response) =>{

    const {name} = request.params;
    
    
    
    await db.collection('articles').updateOne({ name } , {
        $inc:{upvotes:1},
    }); 

    const article = await db.collection('articles').findOne({ name });
    if(article)
    {   
        // article.upvotes += 1;
        response.send(article);
    }
    else
        response.send( `The ${name} has not exist`);


});







app.post('/api/articles/:name/comments',async(request,response) =>{
    const {name} = request.params;
    const {postedBy , text } = request.body;
    

    
    await db.collection('articles').updateOne({ name } , {
        $push:{comments:{postedBy , text }},
    });
    const article = await db.collection('articles').findOne({ name });
    if(article){
        
        response.json( article );
    }
    else
        response.send( `The ${name} has not exist`);

});








connectToDb( ()=> {
    app.listen(8000, () =>{
        console.log("Server is Listening on port 8000");
    });
})