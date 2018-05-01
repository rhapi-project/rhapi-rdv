//React
import React from "react";
import { render } from "react-dom";

//CSS

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

//import "fullcalendar/dist/fullcalendar.print.css";
import "fullcalendar/dist/fullcalendar.css";

import "semantic-ui-css/semantic.min.css";

import "./css/index.css";

// Iframe
import Iframe from "react-iframe";

// Semantic
import { Icon, Divider, Sidebar, Menu, Modal } from "semantic-ui-react";

import { maxWidth, site } from "./components/Settings";

//Components
import App from "./components/App";
import Patients from "./components/Patients";
import Praticiens from "./components/Praticiens";

window.qWebChannel = false;

class Main extends React.Component {
  state = { visible: false, help: false, login: false };

  componentDidMount = () => {
    // Qt Mixed App ?
    if (typeof QWebChannel !== "undefined") {
      /*eslint no-undef: "off"*/
      new QWebChannel(qt.webChannelTransport, channel => {
        window.qWebChannel = channel.objects.qWebChannel;
        this.setState({}); // rerender
      });
    }
  };

  render() {
    let sidebar = "";
    let help = "";

    let originPath = window.location.pathname;
    let subApp = window.location.hash.split("/")[0];

    let wWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    let wHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    let menuPos = wWidth < maxWidth ? "top" : "left";

    if (subApp === "#Patients") {
      return <Patients />; // no sidebar for patients
    } else if (subApp === "#Praticiens") {
      if (window.qWebChannel) {
        return (
          // no sidebar for praticien on Qt App
          <React.Fragment>
            <Divider hidden={true} fitted={true} />
            <Praticiens />
          </React.Fragment>
        );
      }
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
              style={{ paddingTop: "10px", paddingBottom: "24px" }}
              onClick={() => {
                this.setState({ visible: false });
              }}
            >
              <Icon
                name="close"
                onClick={() => {
                  this.setState({ visible: false });
                }}
              />
            </Menu.Item>
            <Menu.Item
              header={true}
              name="home"
              onClick={() => {
                window.location = site.url;
              }}
            >
              <Icon name="home" />
              {site.title}
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
                <Menu.Item
                  name="Patients"
                  icon="users"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Patients";
                    this.setState({ visible: false });
                  }}
                />
                <Menu.Item
                  name="Profil"
                  icon="address card"
                  onClick={() => {
                    window.location = originPath + "#Praticiens/Profil";
                    this.setState({ visible: false });
                  }}
                />
                {// TODO : No help on login
                false /* test if no login */ ? (
                  ""
                ) : (
                  <Menu.Item
                    name="Aide"
                    icon="help"
                    onClick={() => {
                      this.setState({ visible: false, help: true });
                    }}
                  />
                )}
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
              <Icon name="user" />
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
        <Sidebar.Pushable>
          <Sidebar
            style={{
              position: "fixed",
              top: 0,
              zIndex: 100
            }}
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
              style={{ paddingTop: "10px", paddingBottom: "24px" }}
              onClick={() => {
                this.setState({ visible: false });
              }}
            >
              <Icon
                name="close"
                onClick={() => {
                  this.setState({ visible: false });
                }}
              />
            </Menu.Item>
            <Menu.Item
              header={true}
              name="home"
              onClick={() => {
                window.location = site.url;
              }}
            >
              <Icon name="home" />
              {site.title}
            </Menu.Item>
            <Menu.Item
              header={true}
              name="praticien"
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
              <Icon name="user" />
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
        {this.state.visible ? (
          ""
        ) : subApp === "#Patients" ? (
          ""
        ) : (
          <Icon
            id="menu-icon"
            size="large"
            style={{
              cursor: "pointer",
              position: "fixed",
              top: 0,
              zIndex: 100
            }}
            name="bars"
            onClick={() => {
              this.setState({ visible: true });
              window.scrollTo(0, 0);
            }}
          />
        )}
        {help}
        {sidebar}
        <Modal
          size="fullscreen"
          open={this.state.help}
          closeIcon={true}
          onClose={() => this.setState({ help: false })}
        >
          <Modal.Header>Aide</Modal.Header>
          <Iframe
            url="docs/Agendas.html"
            height={wHeight * 0.8 + "px"}
            display="initial"
            position="relative"
            allowFullScreen={true}
          />
        </Modal>
      </React.Fragment>
    );
  }
}

render(<Main />, document.getElementById("root"));
