import React from "react";

import {
  Checkbox,
  Button,
  Form,
  Grid,
  Header,
  Segment,
  Divider
} from "semantic-ui-react";

import _ from "lodash";

import { Client } from "rhapi-client";

import { maxWidth, fsize, hsize } from "./Settings";
import PriseRdv from "./PriseRdv";
import MesRdv from "./MesRdv";

var client = new Client(
  //"http://localhost", // local dev
  (datas, response) => {
    //if (datas.networkError === 401) {
    // eq response.statusCode === 401
    //  window.location.reload();
  }
);

export default class Patients extends React.Component {
  componentWillMount() {
    this.setState({
      gestionRDV: false,
      identified: false,
      patient: {}
    });
  }

  componentDidMount() {
    // local dev no auth
    //this.setState({ validation: "success", errorMessage: "" });

    client.authorize(
      "https://auth-dev.rhapi.net", // auth url
      "bXlhcHA6bXlhcHBteWFwcA", // app token
      "masteragenda", // username
      "masteragenda", //password
      () => {
        // success
        console.log("client ok");
      },
      (datas, response) => {
        console.log("erreur auth client");
      }
    );
  }

  componentDidUpdate() {
    // https://developer.mozilla.org/en-US/docs/Web/API/History_API
    // TODO : use https://github.com/ReactTraining/history :
    // ... a minimal API that lets you manage the history stack, navigate,
    // confirm navigation, and persist state between sessions.

    window.history.pushState(
      this.state,
      "RDV Patients State",
      window.location.href
    );

    window.onpopstate = e => {
      //console.log(e.state);
      this.setState(e.state);
    };
  }

  handleChange = (e, d) => {
    const patient = this.state.patient;
    patient[d.name] = d.value;
    this.setState({ patient: patient });
  };

  gestionRDV = () => {
    /* ?
    let patient = this.state.patient;
    if (this.state.identified) {
      patient = _.omit(patient, [
        "nom",
        "prenom",
        "email",
        "telMobile",
        "password"
      ]);
    } else {
      patient = _.omit(patient, ["ipp", "ipp2", "password"]);
    }
    */
    this.setState({ gestionRDV: true });
  };

  render() {
    return (
      <Grid textAlign="center">
        <Grid.Column style={{ maxWidth: maxWidth }}>
          {this.state.gestionRDV ? (
            this.state.identified ? (
              <MesRdv
                patient={this.state.patient}
                identified={true}
                client={client}
              />
            ) : (
              <PriseRdv
                patient={this.state.patient}
                identified={false}
                client={client}
              />
            )
          ) : (
            <React.Fragment>
              <Header size={hsize}>
                Je m'identifie pour accéder au service
              </Header>
              <Form onSubmit={this.gestionRDV} size={fsize}>
                <Segment stacked={true}>
                  <Checkbox
                    label="Je dispose d'un identifiant personnel"
                    toggle={true}
                    checked={this.state.identified}
                    onChange={(e, d) => {
                      this.setState({
                        identified: d.checked
                      });
                    }}
                  />
                  <Divider hidden={true} />
                  {this.state.identified ? (
                    <React.Fragment>
                      <Form.Input
                        name="ipp"
                        fluid={true}
                        icon="user"
                        iconPosition="left"
                        placeholder="Identifiant"
                        value={
                          _.isUndefined(this.state.patient.ipp)
                            ? ""
                            : this.state.patient.ipp
                        }
                        required={true}
                        type="text"
                        onChange={this.handleChange}
                      />
                      <Form.Input
                        name="password"
                        fluid={true}
                        icon="lock"
                        iconPosition="left"
                        placeholder="Mot de passe"
                        value={
                          _.isUndefined(this.state.patient.password)
                            ? ""
                            : this.state.patient.password
                        }
                        type="password"
                        required={true}
                        onChange={this.handleChange}
                      />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Form.Input
                        name="nom"
                        fluid={true}
                        icon="user"
                        iconPosition="left"
                        placeholder="Nom"
                        value={
                          _.isUndefined(this.state.patient.nom)
                            ? ""
                            : this.state.patient.nom
                        }
                        type="text"
                        onChange={this.handleChange}
                      />
                      <Form.Input
                        name="prenom"
                        fluid={true}
                        icon="user"
                        iconPosition="left"
                        placeholder="Prénom"
                        value={
                          _.isUndefined(this.state.patient.prenom)
                            ? ""
                            : this.state.patient.prenom
                        }
                        type="text"
                        onChange={this.handleChange}
                      />
                      <Form.Input
                        name="email"
                        fluid={true}
                        icon="mail"
                        iconPosition="left"
                        placeholder="Email"
                        value={
                          _.isUndefined(this.state.patient.email)
                            ? ""
                            : this.state.patient.email
                        }
                        type="email"
                        required={true}
                        onChange={this.handleChange}
                      />
                      <Form.Input
                        name="telMobile"
                        fluid={true}
                        icon="mobile"
                        iconPosition="left"
                        placeholder="Téléphone mobile"
                        value={
                          _.isUndefined(this.state.patient.telMobile)
                            ? ""
                            : this.state.patient.telMobile
                        }
                        type="text"
                        onChange={this.handleChange}
                      />
                    </React.Fragment>
                  )}
                  <Divider hidden={true} />
                  <Button type="submit" secondary={true} fluid={true}>
                    {this.state.identified ? "Gérer mes RDV" : "Prendre un RDV"}
                  </Button>
                </Segment>
              </Form>
            </React.Fragment>
          )}
        </Grid.Column>
      </Grid>
    );
  }
}
