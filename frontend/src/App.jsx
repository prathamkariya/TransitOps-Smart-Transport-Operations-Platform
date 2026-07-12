import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to TransitOps</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/auth">Auth</Link></li>
            <li><Link to="/vehicles">Vehicles</Link></li>
            <li><Link to="/drivers">Drivers</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<div>Auth Feature Scaffold</div>} />
          <Route path="/vehicles" element={<div>Vehicles Feature Scaffold</div>} />
          <Route path="/drivers" element={<div>Drivers Feature Scaffold</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
