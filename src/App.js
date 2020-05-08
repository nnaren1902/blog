import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import List from './components/List.js'

function App() {
  return (
    <Router>
      <div className="App">

        <Switch>
          <Route path="/edit">
            <About />
          </Route>

          <Route path="/">
            <List />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}


function About() {
  return <h2>About</h2>;
}

export default App;
