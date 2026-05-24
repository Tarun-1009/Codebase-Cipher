import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleAnalyze() {
    if (!url.trim()) {
      alert("Please enter a URL")
      return
    }
    try {
      const path = new URL(url).pathname;
      const [, username, repo] = path.split("/");
      navigate(`/analyze/${username}/${repo}`);
    } catch (err) {
      console.error(err);
      alert("Invalid URL");
      return
    }
  }

  return (
    <div className="home">
      <div className="home-bg" />

      <div className="home-content">
        <div className="home-title">
          <div className="heading">Codebase</div>
          <div className="heading">Cipher</div>
        </div>
        <p className="home-sub">Visualize A Codebase</p>

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