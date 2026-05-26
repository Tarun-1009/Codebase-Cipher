import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/logo.png';
import { FaPlay, FaDownload } from 'react-icons/fa';

const Header = ({ repoUrl, setRepoUrl, onAnalyze, onExport, branches = [], selectedBranch, setSelectedBranch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAnalyze = location.pathname.startsWith('/analyze');

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onAnalyze();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        {isAnalyze ? (
          <span className="header-logo">Codebase Cipher</span>
        ) : (
          <img src={logo} alt="Logo" className="logo" />
        )}
      </div>

      <div class="app-header">
        {branches && branches.length > 0 && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="header-branch-select"
            title="Select Branch"
          >
            {branches.map(br => (
              <option key={br} value={br}>
                {br}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="header-center-search">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
          className="header-search-input"
          onKeyDown={handleKeyDown}
        />
      </div>

      <div>
        <button onClick={onAnalyze} className="header-action-btn run-btn" title="Analyze Repository">
          <FaPlay size={10} style={{ marginRight: '6px' }} /> Analyze
        </button>
      </div>

      <div className="header-right">
        <button onClick={onExport} className="header-action-btn export-btn" title="Export Analysis as JSON">
          <FaDownload size={10} style={{ marginRight: '6px' }} /> Export Report
        </button>
      </div>
    </header>
  );
};
export default Header;