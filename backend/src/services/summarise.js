// Import axios for making HTTP requests to external APIs
const axios = require('axios');

function getGroqApiKey() {
    const rawKey = process.env.GROQ_API_KEY || '';
    const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('GROQ_API_KEY is missing in backend/.env. Add a valid Groq API key and restart the backend server.');
    }

    if (!apiKey.startsWith('gsk_') || apiKey.length < 40) {
        throw new Error('GROQ_API_KEY format looks invalid. Regenerate a key from Groq Console and update backend/.env.');
    }

    return apiKey;
}

// Define the async function that generates summaries based on user input
// Parameters:
// - username: GitHub username
// - repo: GitHub repository name
// - summaryType: Type of summary requested ('repo', 'file', or 'folder')
// - targetPath: Path to specific file or folder (optional, null for whole repo)
// - fileContent: The actual code/content to be summarized (passed from frontend)
async function generateSummary(username, repo, summaryType, targetPath, fileContent) {
    try {
        // Validate that fileContent is provided - this is the code that needs to be summarized
        if (!fileContent) {
            throw new Error('File content is required for summarization');
        }

        // Create a descriptive prompt based on the summary type
        // This helps the AI understand the context of what it's summarizing
        let summaryPrompt = '';

        // Check if user wants summary of entire repository
        if (summaryType === 'repo') {
            summaryPrompt = `You are a code analysis assistant. Summarize only the provided repository context.\nOutput exactly 3 short sections: Purpose, Architecture, Key Components.\nDo not invent missing details.\n\nRepository: ${username}/${repo}\n\nContext:\n${fileContent}`;
        }
        // Check if user wants summary of a specific file
        else if (summaryType === 'file') {
            summaryPrompt = `You are a code analysis assistant. Summarize only the provided file context and code.\nOutput exactly 4 short sections: File Purpose, Main Logic, Important Functions, Risks/Notes.\nDo not invent behavior not present in the code.\n\nFile: ${targetPath}\nRepository: ${username}/${repo}\n\nContext:\n${fileContent}`;
        }
        // Check if user wants summary of a specific folder
        else if (summaryType === 'folder') {
            summaryPrompt = `You are a code analysis assistant. Summarize only the provided folder context.\nOutput exactly 3 short sections: Folder Role, Notable Contents, How It Fits In Project.\nDo not invent files that are not listed.\n\nFolder: ${targetPath}\nRepository: ${username}/${repo}\n\nContext:\n${fileContent}`;
        }
        // If summaryType is invalid, throw an error
        else {
            throw new Error('Invalid summary type. Must be "repo", "file", or "folder"');
        }

        // Define the Groq API endpoint for generating content
        const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

        const groqApiKey = getGroqApiKey();

        // Debug: Log that we're about to make the API call
        console.log('Making Groq API call with key:', groqApiKey ? 'Key exists' : 'Key is undefined');

        // Set up the request configuration with authentication and parameters
        const groqConfig = {
            // Specify the HTTP method as POST
            method: 'post',
            // Set the endpoint URL
            url: groqApiUrl,
            // Prepare headers with authorization using the Groq API key
            headers: {
                // Include the Bearer token for authentication using the API key from .env file
                'Authorization': `Bearer ${groqApiKey}`,
                // Specify that we're sending JSON data
                'Content-Type': 'application/json',
            },
            // Define the request body with the chat completion parameters
            data: {
                // Specify the model to use for generating the summary (using a currently supported Groq model)
                model: 'llama-3.3-70b-versatile',
                // Array of messages to send to the API
                messages: [
                    {
                        // Set role as user - we are the ones asking for the summary
                        role: 'user',
                        // Include the constructed prompt with the code/content to summarize
                        content: summaryPrompt,
                    },
                ],
                // Set temperature to 0.7 for balanced creativity and accuracy
                temperature: 0.7,
                // Limit the response to 500 tokens to keep summaries concise
                max_tokens: 500,
            },
        };

        // Make the API request to Groq with the configured parameters
        const groqResponse = await axios(groqConfig);

        // Extract the generated summary text from the API response
        // The response contains choices array with the first choice's message content
        const summary = groqResponse.data.choices[0].message.content;

        // Return an object containing the summary and metadata about the request
        return {
            // The actual summary text generated by Groq API
            summary: summary,
            // Type of summary for reference (repo, file, or folder)
            summaryType: summaryType,
            // Path of the target if it was a file or folder summary
            targetPath: targetPath || 'entire repository',
            // Include repository information for context
            repository: `${username}/${repo}`,
            // Add timestamp to track when the summary was generated
            generatedAt: new Date().toISOString(),
        };
    } 
    // Catch any errors that occur during the summarization process
    catch (error) {
        // Log the full error for debugging
        console.error('Groq API Error:', error.response?.status, error.response?.data);
        console.error('Error message:', error.message);
        
        // Check if error is from Groq API rate limiting
        if (error.response && error.response.status === 429) {
            throw new Error('Groq API rate limit exceeded. Please try again later.');
        }
        // Check if error is from authentication issues
        else if (error.response && error.response.status === 401) {
            throw new Error('Groq API authentication failed. Check your API key.');
        }
        // Check if error is from bad request
        else if (error.response && error.response.status === 400) {
            throw new Error(`Groq API error: ${error.response.data?.error?.message || 'Invalid request'}`);
        }
        // For any other error, re-throw with context
        else {
            throw new Error(`Summary generation failed: ${error.message}`);
        }
    }
}

// Export the generateSummary function so it can be used in other files
module.exports = { generateSummary };
