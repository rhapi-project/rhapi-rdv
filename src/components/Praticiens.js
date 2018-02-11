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

var client = new Client(
  //"http://localhost", // local dev
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

  accept = () => {
    // local dev no auth
    //this.setState({ validation: "success", errorMessage: "" });

    client.authorize(
      "https://auth-dev.rhapi.net", // auth url
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

  render() {
    if (this.state.validation === "calendar") {
      return <Calendars client={client} />;
    }
    if (this.state.validation === "configuration") {
      return <Configuration client={client} />;
    }
    if (this.state.validation === "success") {
      return (
        <Card.Group>
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
                primary={true}
                onClick={() => {
                  this.setState({ validation: "calendar" });
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
                primary={true}
                onClick={() => {
                  this.setState({ validation: "configuration" });
                }}
              >
                OK
              </Button>
            </Card.Content>
          </Card>
        </Card.Group>
      );
    }

    return (
      <div className="login-form">
        <Grid textAlign="center">
          <Grid.Column style={{ maxWidth: maxWidth }}>
            <Header size={hsize} color="teal">
              {/*<Image src='/logo.png' />*/}
              Connexion praticien
            </Header>
            <Segment>
              <Form size={fsize}>
                <Form.Input
                  id="form-login-user"
                  fluid={true}
                  icon="user"
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
