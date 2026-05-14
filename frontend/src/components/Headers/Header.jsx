import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({viewMode, setViewMode}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      
      <nav className="header-center">
        <button className={viewMode === 'tree' ? 'nav-btn active' : 'nav-btn'} onClick={() => setViewMode('tree')}>Dashboard</button>
        <button className={viewMode === 'dependencies' ? 'nav-btn active' : 'nav-btn'} onClick={() => setViewMode('dependencies')}>Dependencies</button>
      </nav>
      
    </header>
  );
};
export default Header;