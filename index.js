const http=require('http');
const path=require('path');
const express=require('express');
const app=express();
const socketIO=require('socket.io');
const config=require('dotenv').config();
const TOKEN=process.env.TWITTER_BEARER_TOKEN;
const PORT= process.env.PORT;
const server=http.createServer(app);
const IO=socketIO(server);
app.get('/',(req,res) => 
{
    res.sendFile(path.resolve(__dirname,'./','client1','index.html'));
})
const rules=[{value:"zeenews",value:"ndtv"}];

const needle=require('needle');
const rulesUrl="https://api.twitter.com/2/tweets/search/stream/rules";
const streamUrl="https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id";
async function getRules()
{
    
  const response= await needle('get',rulesUrl,{
      headers:{Authorization:`Bearer ${TOKEN}`},
  });
  
  return response.body;
  
} 
async function setRules()
{
    const data={
        add:rules,
    }
    const response= await needle('post',rulesUrl,data,{ headers:{ 'content-type':'application/json',Authorization:`Bearer ${TOKEN}`}})

    return response.body;
}
async function deleteRules(rules)
{
    if(!Array.isArray(rules.data))
        return null;
    const ids=rules.data.map((rule) => rule.id);
    
    const data={
     delete:{
         ids:ids
     }
    }
    const response=await needle('post',rulesUrl,data,{
        headers:{
            'content-type' :'application/json',
            Authorization:`Bearer ${TOKEN}`
        }
    })
    return response.body;
}
  function streamTweets(socket)
{
    
    const stream=needle.get(streamUrl,{headers:{Authorization:`Bearer ${TOKEN}`}});
    stream.on('data',(data) =>
    {
        try {
            const json=JSON.parse(data);
            socket.emit('tweet',json);
            //console.log(json);
        } catch (error) {
            
        }
    })
}
IO.on('connection' ,async () =>
{
    console.log('Client connected');
    let currentRules;
    try {
      
        currentRules=await getRules();
        await deleteRules(currentRules);
        await setRules();
        
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
    streamTweets(IO);
    
})


server.listen(PORT,() => console.log("listening on port",PORT));