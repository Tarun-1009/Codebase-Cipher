import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleAnalyze() {
    if(!url.trim()){
      alert("Please enter a URL")
      return
    }
    try{
      const path =new URL(url).pathname;
      const [,username, repo] = path.split("/");
      navigate(`/analyze/${username}/${repo}`);
    }catch(err){
      console.error(err);
      alert("Invalid URL");
      return
    }
  }

  return (
    <div className="home">
      <div className="home-bg" />

      <div className="home-content">
        <h1 className="home-title">
          Codebase <span>Cipher</span>
        </h1>
        <p className="home-sub">Analyze your GitHub repo for security vulnerabilities</p>

        <div className="search-bar">
          <input
            type="url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button onClick={handleAnalyze}>Analyze →</button>
        </div>
      </div>
    </div>
  );
}

export default Home;