import React from "react";

import {
  Checkbox,
  Button,
  Form,
  Header,
  Segment,
  Divider
} from "semantic-ui-react";

import _ from "lodash";

import { Client } from "rhapi-client";

import { maxWidth, fsize, hsize, localdev, site, telRegex } from "./Settings";

import PriseRdv from "./PriseRdv";

import MesRdv from "./MesRdv";

var client = localdev
  ? new Client("http://localhost", (datas, response) => {
      //if (datas.networkError === 401) {
      // eq response.statusCode === 401
      //  window.location.reload();
    })
  : new Client((datas, response) => {
      //if (datas.networkError === 401) {
      // eq response.statusCode === 401
      //  window.location.reload();
    });

export default class Patients extends React.Component {
  state = {
    identifiant: "",
    etablissement: "",
    planning: 0,
    identified: false,
    gestionRDV: false,
    clientOk: false,
    patient: {},
    rdv: {}
  };

  componentDidMount() {
    /*
      3 accès possibles :
      - /#Patients : l'établissement est inconnu => formulaire identification complète du patient
        Cette forme est utilisée par le site générique et exige que le patient dispose d'identifiants complets
      - /#Patients/master : l'établissement est connu => formulaire identification libre par défaut
        Cette forme est utilisée dans un lien (Google Map ou site du cabinet par exemple)
      - /#Patients/123:AVRJoC@master : l'établissement et les identifiants sont connus
        => formulaire identification complète pré-rempli avec ouverture automatique sur la gestion des RDV si MDP
        Le mot de passe (ici AVRJoC) est optionnel
        Cette forme est utilisée dans un lien d'accès au compte (fourni au patient par mail par exemple) 
    */
    let hashParts = window.location.hash.split("/");
    let etablissement = "";
    let planning = 0;
    let identified = false;
    if (hashParts.length > 1) {
      // #Patients/xxxx
      etablissement = hashParts[1];
    }

    let identifiant;
    let parts = etablissement.split("@");
    let patient = {};
    let rdv = {};
    if (parts.length > 1) {
      // #Patients/123:password@master => un patient d'id 123, de password password pour l'organisation master
      // #Patients/123:password@master,1 => sur le planning d'id 1
      // #Patients/_123:password@master => un RDV (unique) d'id 123, de password password pour l'organisation master
      identified = !_.isEmpty(parts[0]);
      identifiant = etablissement;
      let parts2 = parts[1].split(",");
      etablissement = parts2[0];
      planning = 1 * parts2[1];
      if (!_.isInteger(planning)) {
        planning = 0;
      }
      let part0 = parts[0];
      parts = part0.split(":");
      if (parts.length > 1) {
        if (_.startsWith(parts[0], "_")) {
          rdv.id = parts[0].slice(1);
          rdv.password = parts[1];
          identifiant = "@" + etablissement;
        } else {
          patient.ipp = parts[0];
          patient.password = parts[1];
          identifiant = patient.ipp + "@" + etablissement;
        }
      }
    } else {
      // #Patients/@master
      let parts2 = etablissement.split(",");
      etablissement = parts2[0];
      planning = 1 * parts2[1];
      if (!_.isInteger(planning)) {
        planning = 0;
      }
      identifiant = _.isEmpty(etablissement) ? "" : "@" + etablissement;
    }

    this.setState({
      identifiant: identifiant,
      etablissement: etablissement,
      planning: planning,
      identified: identified,
      gestionRDV: false,
      clientOk: false,
      patient: patient,
      rdv: rdv
    });

    if (etablissement === "") {
      //console.log(this.state.patient);
      this.setState({ identified: true });
    } else {
      // local dev no auth => décommenter la ligne suivante
      //this.setState({ validation: "success", errorMessage: "" });
      // local dev no auth => commenter la ligne suivante
      this.authorize(etablissement);
    }
    window.addEventListener("resize", () => this.setState({}));
  }

  authorize = (etablissement, gestionRDVOnSuccess) => {
    client.authorize(
      site.authUrl,
      site.appToken,
      "reservation@" + etablissement, // username
      "reservation@" + etablissement, //password
      () => {
        // success
        //console.log("client ok");
        client.MonCompte.read(
          monProfil => {
            this.setState({ titre: monProfil.currentName });
          },
          () => {}
        );

        let gestionRDV =
          !_.isUndefined(gestionRDVOnSuccess) && gestionRDVOnSuccess;

        this.setState({ clientOk: true, etablissement, gestionRDV });

        if (this.state.patient.ipp && this.state.patient.password) {
          let n = 10;
          let loop = () => {
            if (!this.state.clientOk && n-- > 0) {
              _.delay(loop, 100);
              return;
            }
            this.gestionRDV();
          };
          loop();
        } else if (this.state.rdv.id && this.state.rdv.password) {
          let n = 10;
          let loop = () => {
            if (!this.state.clientOk && n-- > 0) {
              _.delay(loop, 100);
              return;
            }
            this.gestionRDVUnique();
          };
          loop();
        }
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
    if (localdev || this.state.clientOk) {
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

  gestionRDVUnique = () => {
    if (localdev || this.state.clientOk) {
      this.setState({ gestionRDV: true });
    }
  };

  render() {
    return (
      <div id="patients">
        <div
          id="patients-prochains-rdv"
          style={{ maxWidth: maxWidth, textAlign: "center", margin: "auto" }}
        >
          {this.state.gestionRDV ? (
            this.state.identified ? (
              <MesRdv
                rdv={this.state.rdv}
                patient={this.state.patient}
                identified={true}
                client={client}
              />
            ) : (
              <PriseRdv
                patient={this.state.patient}
                planning={this.state.planning}
                identified={false}
                client={client}
              />
            )
          ) : (
            <React.Fragment>
              <Divider hidden={true} />
              <Header size={hsize}>
                {_.isEmpty(this.state.titre) ? "" : <p>{this.state.titre}</p>}
                Je m'identifie pour accéder au service
              </Header>
              <Form
                onSubmit={() => {
                  if (this.state.identified) {
                    this.gestionRDV();
                  } else if (
                    !_.isEmpty(this.state.patient.telMobile) &&
                    (this.state.patient.telMobile.match(telRegex[0]) ||
                      this.state.patient.telMobile.match(telRegex[1]) ||
                      this.state.patient.telMobile.match(telRegex[2]))
                  ) {
                    this.gestionRDV();
                  } else {
                    let patient = this.state.patient;
                    patient.telMobile = "";
                    this.setState({ patient: patient });
                  }
                }}
                method="post" /*inutilisé => transmission par props*/
                size={fsize}
              >
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
                        placeholder={
                          _.isEmpty(this.state.etablissement)
                            ? "Identifiant complet requis (avec @)"
                            : "Identifiant"
                        }
                        value={
                          /*_.isUndefined(this.state.patient.ipp)
                            ? ""
                            : this.state.patient.ipp + "@" + this.state.patient.etablissement*/
                          this.state.identifiant
                        }
                        required={true}
                        type="text"
                        onChange={this.handleChange}
                        onBlur={
                          // autocomplete sur Safari ne déclenche pas onChange
                          e => {
                            this.handleChange(
                              {},
                              {
                                name: e.currentTarget.name,
                                value: e.currentTarget.value
                              }
                            );
                          }
                        }
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
                        type="text"
                        required={true}
                        onChange={this.handleChange}
                        onBlur={
                          // autocomplete sur Safari ne déclenche pas onChange
                          e => {
                            this.handleChange(
                              {},
                              {
                                name: e.currentTarget.name,
                                value: e.currentTarget.value
                              }
                            );
                          }
                        }
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
                        required={true}
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
                        required={true}
                        onChange={this.handleChange}
                        onBlur={
                          // autocomplete sur Safari ne déclenche pas onChange
                          e => {
                            this.handleChange(
                              {},
                              {
                                name: e.currentTarget.name,
                                value: e.currentTarget.value
                              }
                            );
                          }
                        }
                      />
                      <Form.Input
                        name="email"
                        fluid={true}
                        icon="mail"
                        iconPosition="left"
                        placeholder="E-Mail"
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
                        type="tel"
                        required={true}
                        onChange={this.handleChange}
                        onBlur={
                          // autocomplete sur Safari ne déclenche pas onChange
                          e => {
                            this.handleChange(
                              {},
                              {
                                name: e.currentTarget.name,
                                value: e.currentTarget.value
                              }
                            );
                          }
                        }
                        error={
                          !_.isEmpty(this.state.patient.telMobile) &&
                          !this.state.patient.telMobile.match(telRegex[0]) &&
                          !this.state.patient.telMobile.match(telRegex[1]) &&
                          !this.state.patient.telMobile.match(telRegex[2])
                        }
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
        </div>
      </div>
    );
  }
}
