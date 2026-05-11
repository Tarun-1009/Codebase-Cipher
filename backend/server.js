const express = require("express");
const cors = require("cors");
const { getRepo } = require("./src/services/githubService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Codebase Cipher Backend is Running!");
});


//temporary - data directly send to frontend just to check

app.get("/analyze/:username/:repo",async (req,res)=>{

    const {username,repo}=req.params;
    try {
        const tree=await getRepo(username,repo);
        
        res.json(tree);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});