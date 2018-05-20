//import _ from 'lodash'
import React from "react";

import {
  Button,
  Form,
  Grid,
  Header,
  Message,
  Segment,
  Divider,
  Card,
  Icon
} from "semantic-ui-react";

import _ from "lodash";

import { Client } from "rhapi-client";
import { maxWidth, hsize, fsize } from "./Settings";
import Configuration from "./Configuration";
import Calendars from "./Calendars";
import Profil from "./Profil";
import ProfilsPatients from "./ProfilsPatients";

var client = new Client(
  // local dev no auth : décommenter la ligne suivante (et 2 lignes sur accept)
  //"http://localhost",
  (datas, response) => {
    if (datas.networkError === 401) {
      // eq response.statusCode === 401
      window.location.reload();
    }
  }
);

export default class Praticiens extends React.Component {
  state = {
    user: "masteruser", // dev => place automatiquement masteruser/masteruser
    password: "masteruser",
    validation: null,
    errorMessage: ""
  };

  accept = () => {
    // local dev no auth : décommenter les 2 lignes suivantes
    //this.setState({ validation: "success", errorMessage: "" });
    //return;

    client.authorize(
      "https://auth-dev2.rhapi.net", // auth url
      "bXlhcHA6bXlhcHBteWFwcA", // app token
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

  componentWillMount() {
    if (window.qWebChannel) {
      // Qt App auto login
      let parts = window.location.hash.split("/")[1].split("?");
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
          this.setState({
            user: params.user,
            password: params.password,
            autoLog: true
          });
        }
      }
    }
  }

  componentDidMount() {
    if (this.state.autoLog) {
      // Qt App auto login
      this.accept();
    }
  }

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
      errorMessage: ""
    });
  };

  passwordChange = event => {
    this.setState({
      password: event.target.value,
      validation: null,
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
      }

      return (
        <Card.Group style={{ marginTop: 10 }}>
          <Card>
            <Card.Content>
              <Card.Header textAlign="right">
                <Icon name="calendar" size="large" />
              </Card.Header>
              <Card.Header>Agendas</Card.Header>
              <Card.Description>
                Accès d'un praticien autorisé à ses agendas
              </Card.Description>
            </Card.Content>
            <Card.Content extra={true} textAlign="right">
              <Button
                onClick={() => {
                  window.location =
                    window.location.pathname + "#Praticiens/Agendas";
                  this.setState({});
                }}
              >
                OK
              </Button>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content>
              <Card.Header textAlign="right">
                <Icon name="settings" size="large" />
              </Card.Header>
              <Card.Header>Configuration</Card.Header>
              <Card.Description>Configuration des plannings</Card.Description>
            </Card.Content>
            <Card.Content extra={true} textAlign="right">
              <Button
                onClick={() => {
                  window.location =
                    window.location.pathname + "#Praticiens/Configuration";
                  this.setState({});
                }}
              >
                OK
              </Button>
            </Card.Content>
          </Card>
        </Card.Group>
      );
    } else
      return window.qWebChannel ? (
        ""
      ) : (
        <div className="login-form" id="praticiens">
          <Grid textAlign="center">
            <Grid.Column style={{ maxWidth: maxWidth, marginTop: 60 }}>
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
                Ouvrir un compte ?{" "}
                <a href="http://lambdasoft.fr">&nbsp;Nous contacter</a>
              </Message>
            </Grid.Column>
          </Grid>
        </div>
      );
  }
}
