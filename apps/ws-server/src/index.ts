import {WebSocketServer} from 'ws';
import {db} from '@repo/prisma';
await db.connect()

const wss = new WebSocketServer({port: 3001});

wss.on("connection",(socket)=>{
    console.log("WebSocket connection established");
    socket.send(JSON.stringify({message:"Welcome to the WebSocket server!"}));
    socket.on("message",async(msg)=>{
        try{
            const data=JSON.parse(msg.toString());
            if(data.type==="getUsers"){
                const users=await db.orm.public?.User?.all();
                socket.send(JSON.stringify({type:"users",users}));
                return
            }
            if(data.type==="createUser"){
                const {username,password}=data;
                const user=await db.orm.public?.User?.create({
                    username,
                    password
                });
                socket.send(JSON.stringify({type:"userCreated",user}));
                return
            }  
            socket.send(JSON.stringify({type:"error",message:"Unknown message type"}));     
        }
        catch(err){
            console.error("Error processing message:",err);
            socket.send(JSON.stringify({error:"Error processing message"}));
        }
    })
    socket.on("close",()=>{
        console.log("WebSocket connection closed");
    })
})

console.log("WebSocket server is running on port 3001");