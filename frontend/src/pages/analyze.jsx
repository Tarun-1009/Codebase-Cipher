import {useState,useEffect} from "react"
import {Link,useParams} from "react-router-dom"

function analyze() {
    const {username,repo}=useParams();
    const [repoData,setRepoData]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);

    useEffect(() => {
        // temprory fetching from  github directly
        fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/main?recursive=3`)
        .then(res=>res.json())
        .then(data=>setRepoData(data))
        .catch(err=>setError(err))
        .finally(()=>setLoading(false))
    }, [username,repo]);

    if(loading){
        return <div>Loading...</div>
    }
    else if(error){
        return <div>Failed to analyze</div>
    }
    else if(!repoData) {
        return <div>No data found</div>
    }
    return <div>
        <h3>Tree structure</h3>
        <pre>{JSON.stringify(repoData,null,2)}</pre>
    </div>
}
export default analyze  