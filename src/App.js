import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">

        <nav>
          <div style={{display: 'flex', flexDirection: 'row', padding: 50}}>
            <Link to="/">List</Link>
            <Link to="/edit">Edit</Link>
          </div>
        </nav>


        <Switch>
          <Route path="/edit">
            <About />
          </Route>

          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

export default App;
