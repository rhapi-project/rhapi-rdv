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
  // local dev no auth (décommenter la ligne suivante)
  //"http://localhost",
  (datas, response) => {
    //if (datas.networkError === 401) {
    // eq response.statusCode === 401
    //  window.location.reload();
  }
);

export default class Patients extends React.Component {
  componentWillMount() {
    // l'identifiant d'établissement peut être récupéré directement de l'URL
    // => le patient non identifié accède via l'URL du cabinet
    // Sinon si depuis le site global lors de la saisie de l'identifiant patient
    // => forme identifiant@etablissement
    let hashParts = window.location.hash.split("/");
    let etablissement = "";
    let identified = false;
    if (hashParts.length > 1) {
      etablissement = hashParts[1];
    } else {
      identified = true;
    }

    // identifiant => 123@etablissement
    let identifiant = _.isEmpty(etablissement) ? "" : "@" + etablissement;

    this.setState({
      identifiant,
      etablissement,
      identified,
      gestionRDV: false,
      clientOk: false,
      patient: {}
    });
  }

  authorize = (etablissement, gestionRDVOnSuccess) => {
    client.authorize(
      "https://auth-dev.rhapi.net", // auth url
      "bXlhcHA6bXlhcHBteWFwcA", // app token
      "reservation@" + etablissement, // username
      "reservation@" + etablissement, //password
      () => {
        // success
        console.log("client ok");
        let gestionRDV =
          !_.isUndefined(gestionRDVOnSuccess) && gestionRDVOnSuccess;
        this.setState({ clientOk: true, etablissement, gestionRDV });
      },
      (datas, response) => {
        console.log("erreur auth client");
        console.log(datas);
        this.setState({ identified: true, etablissement: "", identifiant: "" });
        //alert("Impossible de se connecter au serveur d'authentification. Essayer à nouveau...");
        //window.location.reload();
      }
    );
  };

  componentDidMount() {
    // local dev no auth (décommenter les 2 lignes suivantes)
    //this.setState({ validation: "success", errorMessage: "" });
    //return;

    if (this.state.etablissement === "") {
      console.log(this.state.patient);
      this.setState({ identified: true });
      return;
    }

    this.authorize(this.state.etablissement);
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
    let { patient, etablissement, identifiant } = this.state;
    let key = d.name;
    if (key === "ipp") {
      identifiant = d.value;
      let parts = identifiant.split("@");
      patient["ipp"] = parts[0];
      if (parts.length > 1) {
        etablissement = parts[1];
      }
    } else {
      patient[key] = d.value;
    }
    this.setState({ patient, etablissement, identifiant });
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

    if (this.state.clientOk) {
      this.setState({ gestionRDV: true });
    } else {
      let patient = this.state.patient;
      let parts = patient.ipp.split("@");
      if (parts.length > 1) {
        patient.ipp = parts[0];
        let etablissement = parts[1];
        this.setState({ patient, etablissement });
        this.authorize(etablissement, true);
      } else {
        this.authorize(this.state.etablissement, true);
      }
    }
  };

  render() {
    return (
      <Grid textAlign="center" id="patients">
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
              <Divider hidden={true} />
              <Header size={hsize}>
                Je m'identifie pour accéder au service
              </Header>
              <Form onSubmit={this.gestionRDV} size={fsize}>
                <Segment stacked={true}>
                  {!_.isEmpty(this.state.etablissement) ? (
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
                  ) : (
                    ""
                  )}
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
                          /*_.isUndefined(this.state.patient.ipp)
                            ? ""
                            : this.state.patient.ipp + "@" + this.state.patient.etablissement*/
                          this.state.identifiant
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
