const axios = require("axios");

const getRepo=async (username,repo)=>{
    try{
    const response=axios.get(`https://api.github.com/repos/${username}/${repo}/git/trees/main?recursive=4`,
        {
            headers:{
                'User-Agent' : 'Codebase-Cipher'
            }
        }
    );
    // tree structure repo
    return response.data.tree;
}catch (error) {
    if (error.response && error.response.status === 403) {
      console.error("Problem: You've hit the 60-request free limit!");
    } else {
      console.error("Error fetching data:", error.message);
    }
    throw error;
  }

}
module.exports = { getRepo };
    
