import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleAnalyze() {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }
    try {
      const path = new URL(url).pathname;
      const [, username, repo] = path.split("/");
      if (!username || !repo) {
        alert("Invalid URL. Please enter a valid GitHub repository URL.");
        return;
      }
      navigate(`/analyze/${username}/${repo}`);
    } catch (err) {
      console.error(err);
      alert("Invalid URL");
      return;
    }
  }

  // Spotlight mouse tracking effect for cards
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // Set up Intersection Observer for Framer-like scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="home-container">
      {/* 1. HERO SECTION (100vh fold) */}
      <div className="home-hero">
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

      {/* 2. CORE CAPABILITIES SECTION */}
      <section className="section-capabilities">
        <div className="section-header-wrapper">
          <div className="section-pill scroll-reveal">CORE CAPABILITIES</div>
          <h2 className="section-title scroll-reveal">
            Repository Intelligence <span className="gradient-text">Engine</span>
          </h2>
          <div className="section-underline scroll-reveal"></div>
        </div>

        <div className="capabilities-grid">
          {/* Card 1: Architecture Intelligence */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container blue-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="5" r="3" />
                    <circle cx="5" cy="19" r="3" />
                    <circle cx="19" cy="19" r="3" />
                    <line x1="12" y1="8" x2="6.8" y2="16.2" />
                    <line x1="12" y1="8" x2="17.2" y2="16.2" />
                  </svg>
                </div>
                <h3 className="card-title">Architecture Intelligence</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot blue-dot"></span>Dependency Mapping</li>
                  <li><span className="dot blue-dot"></span>Directory Topology</li>
                  <li><span className="dot blue-dot"></span>Call Graph System</li>
                  <li><span className="dot blue-dot"></span>Multi-View Modes</li>
                </ul>

                <div className="card-graphic graph-graphic">
                  <svg className="network-svg" viewBox="0 0 200 200">
                    <path className="net-line active-line" d="M100 35 L60 95" />
                    <path className="net-line active-line" d="M100 35 L140 95" />
                    <path className="net-line" d="M60 95 L30 155" />
                    <path className="net-line" d="M60 95 L90 155" />
                    <path className="net-line" d="M140 95 L110 155" />
                    <path className="net-line" d="M140 95 L170 155" />

                    <circle className="net-node-pulse" cx="100" cy="35" r="14" />
                    <circle className="net-node root-node" cx="100" cy="35" r="8" />

                    <circle className="net-node parent-node" cx="60" cy="95" r="6" />
                    <circle className="net-node parent-node" cx="140" cy="95" r="6" />

                    <circle className="net-node leaf-node" cx="30" cy="155" r="4.5" />
                    <circle className="net-node leaf-node" cx="90" cy="155" r="4.5" />
                    <circle className="net-node leaf-node" cx="110" cy="155" r="4.5" />
                    <circle className="net-node leaf-node" cx="170" cy="155" r="4.5" />

                    <circle className="flow-particle p1" r="3" fill="#00d4ff">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path="M100 35 L60 95 L30 155" />
                    </circle>
                    <circle className="flow-particle p2" r="3" fill="#00d4ff">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M100 35 L140 95 L170 155" />
                    </circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Execution Traceability */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container pulse-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3 className="card-title">Execution <span className="pink-text">Traceability</span></h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot purple-dot"></span>Execution Flow Tracking</li>
                  <li><span className="dot purple-dot"></span>Sequence Visualization</li>
                  <li><span className="dot purple-dot"></span>Call Relationships</li>
                  <li><span className="dot purple-dot"></span>Error Path Detection</li>
                </ul>

                <div className="card-graphic trace-graphic">
                  <svg className="trace-svg" viewBox="0 0 200 200">
                    <path className="trace-path active-trace" d="M100 30 L100 70" />
                    <path className="trace-path active-trace" d="M100 90 L60 130" />
                    <path className="trace-path error-trace" d="M100 90 L140 130" />

                    <rect className="trace-box" x="70" y="15" width="60" height="18" rx="4" />
                    <text className="trace-text" x="100" y="27">main()</text>

                    <rect className="trace-box highlight" x="70" y="70" width="60" height="18" rx="4" />
                    <text className="trace-text" x="100" y="82">router()</text>

                    <rect className="trace-box" x="30" y="130" width="60" height="18" rx="4" />
                    <text className="trace-text" x="60" y="142">auth()</text>

                    <rect className="trace-box error-box" x="110" y="130" width="60" height="18" rx="4" />
                    <text className="trace-text" x="140" y="142">db_conn()</text>

                    <circle className="error-circle-pulse" cx="140" cy="170" r="10" />
                    <circle className="error-circle" cx="140" cy="170" r="6" />
                    <text className="error-x" x="140" y="174" textAnchor="middle">×</text>

                    <circle className="pulse-signal p-success" r="3" fill="#a855f7">
                      <animateMotion dur="2.4s" repeatCount="indefinite" path="M100 30 L100 70 L60 130" />
                    </circle>
                    <circle className="pulse-signal p-error" r="3" fill="#dc2626">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M100 30 L100 70 L140 130" />
                    </circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI Code Intelligence */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container cyan-glow">
                  <div className="ai-icon-text">AI</div>
                </div>
                <h3 className="card-title">AI Code Intelligence</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot cyan-dot"></span>AI Code Summaries</li>
                  <li><span className="dot cyan-dot"></span>Architecture Insights</li>
                  <li><span className="dot cyan-dot"></span>Step Details Panel</li>
                  <li><span className="dot cyan-dot"></span>Heuristic Navigation</li>
                </ul>

                <div className="card-graphic ide-graphic">
                  <div className="ide-header">
                    <div className="ide-dots">
                      <span className="ide-dot red"></span>
                      <span className="ide-dot yellow"></span>
                      <span className="ide-dot green"></span>
                    </div>
                    <div className="ide-title">ast_analyzer.py</div>
                  </div>

                  <div className="ide-content">
                    <div className="code-lines">
                      <div className="code-line"><span className="line-num">1</span> <span className="k">def</span> <span className="f">analyze_ast</span>(node):</div>
                      <div className="code-line"><span className="line-num">2</span> <span className="line-indent"></span><span className="k">if</span> node <span className="k">is</span> <span className="v">None</span>:</div>
                      <div className="code-line"><span className="line-num">3</span> <span className="line-indent"></span><span className="line-indent"></span><span className="k">return</span> []</div>
                      <div className="code-line active"><span className="line-num">4</span> <span className="line-indent"></span>summary = <span className="f">ai_summarize</span>(node)</div>
                      <div className="code-line"><span className="line-num">5</span> <span className="line-indent"></span><span className="k">return</span> summary</div>
                    </div>

                    <div className="ai-summary-overlay">
                      <div className="ai-summary-title">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}>
                          <polygon points="12 2 2 22 22 22" />
                        </svg>
                        AI Summary
                      </div>
                      <div className="ai-summary-text-lines">
                        <div className="summary-line l1"></div>
                        <div className="summary-line l2"></div>
                        <div className="summary-line l3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Scalable Analysis & Automation */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container violet-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h3 className="card-title">Scalable Analysis & Automation</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot violet-dot"></span>Auto Repository Analysis</li>
                  <li><span className="dot violet-dot"></span>Large Repo Optimization</li>
                  <li><span className="dot violet-dot"></span>Productivity Dashboard</li>
                  <li><span className="dot violet-dot"></span>Export & Reports</li>
                </ul>

                <div className="card-graphic charts-graphic">
                  <div className="chart-wrapper line-chart-wrapper">
                    <svg className="chart-svg" viewBox="0 0 160 60">
                      <defs>
                        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="12" x2="160" y2="12" stroke="rgba(255,255,255,0.03)" />
                      <line x1="0" y1="30" x2="160" y2="30" stroke="rgba(255,255,255,0.03)" />
                      <line x1="0" y1="48" x2="160" y2="48" stroke="rgba(255,255,255,0.03)" />

                      <path className="chart-line-gradient" d="M 0 48 Q 30 25 60 35 T 120 12 T 160 22 L 160 60 L 0 60 Z" />
                      <path className="chart-line" d="M 0 48 Q 30 25 60 35 T 120 12 T 160 22" fill="none" />
                      <circle className="chart-point" cx="120" cy="12" r="3" />
                      <circle className="chart-point-pulse" cx="120" cy="12" r="7" />
                    </svg>
                  </div>

                  <div className="chart-wrapper bar-chart-wrapper">
                    <svg className="chart-svg" viewBox="0 0 160 50">
                      <rect className="chart-bar b1" x="10" y="32" width="10" height="18" rx="2" />
                      <rect className="chart-bar b2" x="30" y="18" width="10" height="32" rx="2" />
                      <rect className="chart-bar b3" x="50" y="26" width="10" height="24" rx="2" />
                      <rect className="chart-bar b4" x="70" y="10" width="10" height="40" rx="2" />
                      <rect className="chart-bar b5" x="90" y="20" width="10" height="30" rx="2" />
                      <rect className="chart-bar b6" x="110" y="6" width="10" height="44" rx="2" />
                      <rect className="chart-bar b7" x="130" y="14" width="10" height="36" rx="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY CODEBASE CIPHER SECTION */}
      <section className="section-why">
        <div className="section-header-wrapper">
          <div className="section-pill scroll-reveal">WHY CODEBASE CIPHER?</div>
          <div className="section-underline scroll-reveal"></div>
        </div>

        <div className="why-grid">
          {/* Item 1 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container blue-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <line x1="12" y1="8.5" x2="12" y2="7.5" />
                <line x1="15.5" y1="12" x2="16.5" y2="12" />
                <line x1="12" y1="15.5" x2="12" y2="16.5" />
                <line x1="8.5" y1="12" x2="7.5" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">AI + Graph Visualization</h4>
            <p className="why-description">AI insights combined with interactive graph intelligence.</p>
          </div>

          {/* Item 2 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container purple-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h4 className="why-title">Real-Time Traceability</h4>
            <p className="why-description">Track execution flow and understand runtime behavior.</p>
          </div>

          {/* Item 3 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container blue-cyan-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">Interactive Intelligence</h4>
            <p className="why-description">Explore architecture through dynamic, interactive graphs.</p>
          </div>

          {/* Item 4 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container pink-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">Visual Debugging</h4>
            <p className="why-description">Identify issues, errors and bottlenecks visually.</p>
          </div>

          {/* Item 5 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container cyan-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <path d="M2 20h20" />
                <path d="M12 4l6 6M12 4l-6 6" />
              </svg>
            </div>
            <h4 className="why-title">Scalable Platform</h4>
            <p className="why-description">Built to handle large repositories with optimized rendering.</p>
          </div>

          {/* Item 6 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container violet-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h4 className="why-title">Code Navigation Made Easy</h4>
            <p className="why-description">Seamlessly move from visualizations to actual source code.</p>
          </div>
        </div>
      </section>

      {/* Decorative Network Bottom Graphic */}
      <div className="home-footer-decor">
        <svg className="footer-decor-svg" viewBox="0 0 1440 200" fill="none">
          <path d="M0 100 Q360 180 720 100 T1440 100" stroke="rgba(0, 212, 255, 0.12)" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M0 130 Q360 210 720 130 T1440 130" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="1.5" />
          <circle cx="360" cy="140" r="4.5" fill="#00d4ff" className="footer-node-pulse" />
          <circle cx="1080" cy="140" r="4.5" fill="#a855f7" className="footer-node-pulse" />
        </svg>
      </div>
    </div>
  );
}

export default Home;