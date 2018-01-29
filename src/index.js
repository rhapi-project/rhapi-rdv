//React
import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

//CSS
import "../node_modules/semantic-ui-css/semantic.min.css";
import "./css/index.css";

// Semantic
import { Button, Icon, Divider } from "semantic-ui-react";

//Components
import App from "./components/App";
import NotFound from "./components/Notfound";
import Patients from "./components/Patients";
import Praticiens from "./components/Praticiens";

render(
  <React.Fragment>
    <Button
      size="tiny"
      style={{ marginLeft: -12 }}
      icon={true}
      onClick={() => {
        window.location = "/";
      }}
    >
      <Icon name="home" />
    </Button>
    <Divider hidden={true} />
    <Router>
      <Switch>
        <Route exact={true} path="/" component={App} />
        <Route path="/Patients/" component={Patients} />
        <Route path="/Praticiens/" component={Praticiens} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  </React.Fragment>,
  document.getElementById("root")
);
