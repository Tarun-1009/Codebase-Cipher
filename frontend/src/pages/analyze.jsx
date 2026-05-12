import {useState,useEffect} from "react"
import {Link,useParams} from "react-router-dom"
import Tree from "../feature/graph/Tree";

function Analyze() {
    const {username,repo}=useParams();
    const [repoData,setRepoData]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);

    useEffect(() => {
        // temprory fetching from  github directly
        fetch(`http://localhost:5000/analyze/${username}/${repo}`)
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
        <Tree repoData={repoData}/>
    </div>
}
export default Analyze  