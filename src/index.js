//React
import React from "react";
import { render } from "react-dom";

//CSS
import "../node_modules/semantic-ui-css/semantic.min.css";
import "./css/index.css";

// Semantic
import { Button, Icon, Divider } from "semantic-ui-react";

//Components
import App from "./components/App";
import Patients from "./components/Patients";
import Praticiens from "./components/Praticiens";

const originPath = window.location.pathname;
const subApp = window.location.hash;

let app;

if (subApp === "#Patients") {
  app = <Patients />;
} else if (subApp === "#Praticiens") {
  app = <Praticiens />;
} else {
  app = <App />;
}

render(
  <React.Fragment>
    <Button
      size="tiny"
      style={{ marginLeft: -12 }}
      icon={true}
      onClick={() => {
        window.location = originPath;
      }}
    >
      <Icon name="home" />
    </Button>
    <Divider hidden={true} />
    {app}
  </React.Fragment>,
  document.getElementById("root")
);
