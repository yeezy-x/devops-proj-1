import express from 'express';
import { db } from '@repo/prisma';

const app=express();
app.use(express.json())

app.get('/users',async(_req,res)=>{
    const users=await db.orm.public?.User?.all();
    res.json(users);
})

app.post('/signup',async(req,res)=>{
    const {username,password}=req.body;
    const user=await db.orm.public?.User?.create({
        username,
        password
    });
    res.json({
        message:"User created successfully",
        id:user?.id
    });
})

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})