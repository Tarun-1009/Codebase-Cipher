import {Routes,Route, BrowserRouter} from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import Analyze from './pages/analyze'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
