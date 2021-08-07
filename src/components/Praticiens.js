//import _ from 'lodash'
import React from "react";

import {
  Button,
  Form,
  Header,
  Message,
  Segment,
  Divider,
  Dimmer,
  Loader
} from "semantic-ui-react";

import _ from "lodash";

import { Client } from "rhapi-client";
import { site, maxWidth, hsize, fsize, localdev } from "./Settings";
import Configuration from "./Configuration";
import Calendars from "./Calendars";
import Profil from "./Profil";
import ProfilsPatients from "./ProfilsPatients";

var client = localdev
  ? new Client("http://localhost", (datas, response) => {
      if (datas.networkError === 401) {
        // eq response.statusCode === 401
        window.location.reload();
      }
    })
  : new Client((datas, response) => {
      if (datas.networkError === 401) {
        // eq response.statusCode === 401
        window.location.reload();
      }
    });

export default class Praticiens extends React.Component {
  state = {
    user: _.isUndefined(site.user) ? "" : site.user, // dev => place automatiquement masteruser/masteruser
    password: _.isUndefined(site.password) ? "" : site.password,
    autoLog: false,
    validation: null,
    errorMessage: ""
  };

  /*componentWillMount() {
    console.log("willmount");
    let parts = window.location.hash.split("/");
    if (parts.length === 2) {
      parts = parts[1].split("?");
      if (parts.length === 2) {
        parts = parts[1].split("&");
        let params = {};
        _.forEach(parts, part => {
          let kv = part.split("=");
          if (kv.length === 2) {
            params[kv[0]] = kv[1];
          }
        });
        if (!_.isUndefined(params.user) && !_.isUndefined(params.password)) {
          console.log("willmount gonne set state");
          this.setState({
            user: params.user,
            password: params.password,
            autoLog: true
          });
        }
      }
    }
  }*/

  componentDidMount() {
    let parts = window.location.hash.split("/");
    if (parts.length === 2) {
      parts = parts[1].split("?");
      if (parts.length === 2) {
        parts = parts[1].split("&");
        let params = {};
        _.forEach(parts, part => {
          let kv = part.split("=");
          if (kv.length === 2) {
            params[kv[0]] = decodeURIComponent(kv[1]);
          }
        });
        if (!_.isUndefined(params.user) && !_.isUndefined(params.password)) {
          this.setState({
            user: params.user,
            password: params.password,
            autoLog: true
          });
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.autoLog && prevState.autoLog !== this.state.autoLog) {
      // auto login
      this.accept();
    }
  }

  /*componentDidMount() {
    console.log("did mount");
    if (this.state.autoLog) {
      console.log("did mount gonna accept");
      // auto login
      this.accept();
    }
  }*/

  accept = () => {
    if (localdev) {
      this.setState({ validation: "success", errorMessage: "" });
      return;
    }

    client.authorize(
      site.authUrl,
      site.appToken,
      this.state.user, // username
      this.state.password, // password
      () => {
        // success
        // auth ok
        // les groupes et méthodes RHAPI sont accessibles ici
        this.setState({ validation: "success", errorMessage: "" });
      },
      (datas, response) => {
        this.setState({
          validation: "warning",
          errorMessage:
            datas.userMessage + " Identifiant ou mot de passe incorrect."
        });
      }
    );
  };

  reject = () => {
    // disconnect
    this.setState({
      user: "",
      password: "",
      validation: null,
      errorMessage: ""
    });
    client = new Client();
  };

  /*
  componentDidUpdate() {
    // https://developer.mozilla.org/en-US/docs/Web/API/History_API
    // TODO : use https://github.com/ReactTraining/history :
    // ... a minimal API that lets you manage the history stack, navigate,
    // confirm navigation, and persist state between sessions.

    window.history.pushState(
      this.state,
      "RDV Praticiens State",
      window.location.href
    );

    window.onpopstate = e => {
      //console.log(e.state);
      this.setState(e.state);
    };
  }
  */

  userChange = event => {
    this.setState({
      user: event.target.value,
      validation: null,
      autoLog: false,
      errorMessage: ""
    });
  };

  passwordChange = event => {
    this.setState({
      password: event.target.value,
      validation: null,
      autoLog: false,
      errorMessage: ""
    });
  };

  render() {
    if (this.state.validation === "success") {
      let option = window.location.hash.split("/")[1];
      if (_.isUndefined(option)) {
        option = "";
      } else {
        option = option.split("?")[0];
      }

      if (option === "Agendas") {
        return <Calendars client={client} user={this.state.user} />;
      } else if (option === "Configuration") {
        return <Configuration client={client} user={this.state.user} />;
      } else if (option === "Profil") {
        return <Profil client={client} user={this.state.user} />;
      } else if (option === "Patients") {
        return <ProfilsPatients client={client} user={this.state.user} />;
      } else {
        return <div style={{ minHeight: 400 }} />;
      }
    } else
      return (
        <div id="praticiens">
          <Dimmer
            active={this.state.autoLog && this.state.validation !== "warning"}
          >
            <Loader />
          </Dimmer>
          <Divider hidden={true} />
          <div
            className="login-form"
            style={{
              maxWidth: maxWidth,
              textAlign: "center",
              margin: "auto",
              height: "100vh"
            }}
          >
            <Header size={hsize}>
              {/*<Image src='/logo.png' />*/}
              Connexion praticien
            </Header>
            <Segment>
              <Form size={fsize}>
                <Form.Input
                  id="form-login-user"
                  fluid={true}
                  icon="doctor"
                  iconPosition="left"
                  placeholder="Identifiant"
                  onChange={this.userChange}
                  value={this.state.user}
                  error={this.state.validation === "warning"}
                />
                <Form.Input
                  fluid={true}
                  icon="lock"
                  iconPosition="left"
                  placeholder="Mot de passe"
                  type="password"
                  onChange={this.passwordChange}
                  value={this.state.password}
                  error={this.state.validation === "warning"}
                />
              </Form>
              {/*Important : No Form submission => Button (not Form.Button and outside the form*/}
              <Divider hidden={true} />
              <Button primary={true} fluid={true} onClick={this.accept}>
                Connexion
              </Button>
              <Divider fitted={true} />
              <Button secondary={true} fluid={true} onClick={this.reject}>
                Déconnexion
              </Button>
            </Segment>
            <Message>
              Ouvrir un compte ou réinitialiser vos identifiants ?<br />
              <a href={site.support}>Nous contacter.</a>
            </Message>
          </div>
        </div>
      );
  }
}
