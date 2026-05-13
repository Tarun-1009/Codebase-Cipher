import './Header.css';
import logo from '../../assets/logo.png';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      
      <nav className="header-center">
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Dependencies</button>
      </nav>
      
    </header>
  );
};
export default Header;