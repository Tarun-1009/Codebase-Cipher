require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { BuildDependencyTree } = require("./src/utils/buildDependencyTree");
const { generateSummary } = require("./src/services/summarise");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Codebase Cipher Backend is Running!");
});


//Returns: { tree, traceability, apiEndpoints } - 3-object analysis response

app.get("/analyze/:username/:repo",async (req,res)=>{

    const {username,repo}=req.params;
    try {
        const analysisResult = await BuildDependencyTree(username,repo);
        res.json(analysisResult);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})

// POST endpoint for generating summaries using Groq API
app.post("/summarize", async (req, res) => {
    // Extract parameters from request body
    const { username, repo, summaryType, targetPath, fileContent } = req.body;
    
    try {
        // Validate required fields
        if (!username || !repo || !summaryType || !fileContent) {
            return res.status(400).json({ 
                error: "Missing required fields: username, repo, summaryType, fileContent" 
            });
        }
        
        // Call the generateSummary function
        const result = await generateSummary(username, repo, summaryType, targetPath, fileContent);
        
        // Send the summary back to frontend
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});