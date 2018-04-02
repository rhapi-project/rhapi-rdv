//React
import React from "react";
import { render } from "react-dom";

//CSS

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

import "./css/fullcalendar.css";
import "semantic-ui-css/semantic.min.css";

import "./css/index.css";

// Semantic
import { Icon, Divider, Sidebar, Menu } from "semantic-ui-react";

import { maxWidth } from "./components/Settings";

//Components
import App from "./components/App";
import Patients from "./components/Patients";
import Praticiens from "./components/Praticiens";

class Main extends React.Component {
  state = { visible: false };

  render() {
    let sidebar = "";
    let originPath = window.location.pathname;
    let subApp = window.location.hash.split("/")[0];

    let width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    let menuPos = width < maxWidth ? "top" : "left";

    if (subApp === "#Patients") {
      sidebar = (
        <Sidebar.Pushable style={{ minHeight: "400px" }}>
          <Sidebar
            as={Menu}
            animation="overlay"
            direction={menuPos}
            visible={this.state.visible}
            inverted={true}
            size="massive"
            width="wide"
            vertical={true}
          >
            <Menu.Item
              header={true}
              name="home"
              onClick={() => {
                window.location = originPath;
              }}
            >
              <Icon name="home" />
              Accueil
            </Menu.Item>
            <Menu.Item
              header={true}
              onClick={() => {
                window.location = originPath + "#Praticiens";
                window.location.reload();
              }}
            >
              <Icon name="doctor" />
              Praticien
            </Menu.Item>
            <Menu.Item
              header={true}
              name="patient"
              onClick={() => {
                window.location = originPath + "#Patients";
                window.location.reload();
              }}
            >
              <Icon name="users" />
              Patient
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher>
            <Divider fitted={true} hidden={true} />
            <Patients />
            <Divider fitted={true} hidden={true} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      );
    } else if (subApp === "#Praticiens") {
      sidebar = (
        <Sidebar.Pushable style={{ minHeight: "400px" }}>
          <Sidebar
            as={Menu}
            animation="overlay"
            direction={menuPos}
            visible={this.state.visible}
            inverted={true}
            size="massive"
            width="wide"
            vertical={true}
          >
            <Menu.Item
              header={true}
              name="home"
              onClick={() => {
                window.location = originPath;
              }}
            >
              <Icon name="home" />
              Accueil
            </Menu.Item>
            <Menu.Item header={true}>
              <Icon name="doctor" />
              Praticien
              <Menu.Menu>
                <Menu.Item
                  name="Agendas"
                  icon="calendar"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Agendas";
                    this.setState({ visible: false });
                  }}
                />
                <Menu.Item
                  name="Configuration"
                  icon="settings"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Configuration";
                    this.setState({ visible: false });
                  }}
                />
              </Menu.Menu>
            </Menu.Item>
            <Menu.Item
              header={true}
              name="patient"
              onClick={() => {
                window.location = originPath + "#Patients";
                window.location.reload();
              }}
            >
              <Icon name="users" />
              Patient
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher>
            <Divider fitted={true} hidden={true} />
            <Praticiens />
            <Divider fitted={true} hidden={true} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      );
    } else {
      sidebar = (
        <Sidebar.Pushable style={{ minHeight: "400px" }}>
          <Sidebar
            as={Menu}
            animation="overlay"
            direction={menuPos}
            visible={this.state.visible}
            inverted={true}
            size="massive"
            width="wide"
            vertical={true}
          >
            <Menu.Item
              header={true}
              name="home"
              onClick={() => {
                window.location = originPath;
              }}
            >
              <Icon name="home" />
              Accueil
            </Menu.Item>
            <Menu.Item header={true}>
              <Icon name="doctor" />
              Praticien
              <Menu.Menu>
                <Menu.Item
                  name="Agendas"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Agendas";
                    this.setState({ visible: false });
                  }}
                />
                <Menu.Item
                  name="Configuration"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Configuration";
                    this.setState({ visible: false });
                  }}
                />
              </Menu.Menu>
            </Menu.Item>
            <Menu.Item
              header={true}
              name="patient"
              onClick={() => {
                window.location = originPath + "#Patients";
                window.location.reload();
              }}
            >
              <Icon name="users" />
              Patient
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher>
            <Divider fitted={true} hidden={true} />
            <App />
            <Divider fitted={true} hidden={true} />
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      );
    }

    return (
      <React.Fragment>
        <Icon
          size="large"
          style={{ cursor: "pointer" }}
          name="bars"
          onClick={() => {
            this.setState({ visible: !this.state.visible });
          }}
        />
        {sidebar}
      </React.Fragment>
    );
  }
}

render(<Main />, document.getElementById("root"));
