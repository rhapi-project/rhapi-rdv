import React from "react";

import _ from "lodash";

import { Button, Form, Icon, Modal, Search } from "semantic-ui-react";

import { denominationDefaultFormat } from "./Settings";

export default class PatientSearchModal extends React.Component {
  state = {
    open: false,
    searchBy: 1 // recherche par
  };

  options = [
    { text: "Recherche par IPP", value: 1 },
    { text: "Recherche par IPP2", value: 2 },
    { text: "Recherche par nom + prénom", value: 3 },
    { text: "Recherche par prénom + nom", value: 4 },
    { text: "Recherche par téléphones", value: 5 },
    { text: "Recherche par numéro de sécurité sociale", value: 6 }
  ];

  componentWillReceiveProps(next) {
    this.setState({
      open: next.open
    });
    this.reload();
  }

  reload = () => {
    this.setState({
      isLoading: false,
      results: [],
      value: "",
      patientId: -1,
      error: false
    });
  };

  close = () => {
    this.props.patientSearchModalOpen(false);
  };

  changeSearchBy = (e, d) => {
    this.setState({ searchBy: d.value });
    this.reload();
  };

  completionSearch = (champ, valeur, texte) => {
    let params = {};
    let results = [];

    let regexNumber = /([0-9])+/;
    //let regexLetter = /([a-z][A-Z])+/;

    if (champ === "ipp") {
      params = { ipp: valeur, format: denominationDefaultFormat };
      if (!regexNumber.test(valeur)) {
        this.setState({ error: true });
        return;
      }
    } else {
      params = { format: valeur, texte: texte };
      /*if (!regexLetter.test(valeur)) {
        //console.log("coucou");
        this.setState({ error: true });
        return;
      }*/
    }

    this.props.client.Patients.completion(
      params,
      patients => {
        //console.log(patients);
        _.forEach(patients, patient => {
          let result = {
            id: patient.id,
            title: patient.completion,
            description: _.isEmpty(patient.naissance)
              ? ""
              : new Date(patient.naissance.split("T")[0]).toLocaleDateString(
                  "fr-FR"
                )
          };
          results.push(result);
        });
        this.setState({ isLoading: false, results: results });
      },
      () => {}
    );
  };

  telephoneSearch = telephone => {
    let params = { format: denominationDefaultFormat, texte: telephone };
    let results = [];

    let regexNumber = /([0-9])+/;

    if (!regexNumber.test(telephone)) {
      this.setState({ error: true });
      return;
    }

    this.props.client.Patients.telephones(
      params,
      patients => {
        //console.log(patients);
        _.forEach(patients, patient => {
          let result = {
            id: patient.id,
            title: patient.completion,
            description: patient.denomination
          };
          results.push(result);
        });
        this.setState({ isLoading: false, results: results });
      },
      () => {}
    );
  };

  readAllSearch = (query, value) => {
    let params = {};
    let results = [];

    let regexNumber = /([0-9])+/;

    if (!regexNumber.test(value)) {
      this.setState({ error: true });
      return;
    }

    if (query === "ipp2") {
      params = {
        q1: "ipp2,Like," + value
      };
    } else {
      // query === nir

      params = {
        q1: "nir,Like," + value + "*"
      };
    }
    this.props.client.Patients.readAll(
      params,
      patients => {
        //console.log(patients.results);
        _.forEach(patients.results, patient => {
          let result = {
            id: patient.id,
            title:
              query === "ipp2"
                ? patient.nom + " " + patient.prenom
                : patient.nir,
            description:
              query === "ipp2"
                ? _.isEmpty(patient.naissance)
                  ? ""
                  : new Date(
                      patient.naissance.split("T")[0]
                    ).toLocaleDateString("fr-FR")
                : patient.nom + " " + patient.prenom
          };
          results.push(result);
        });
        this.setState({ isLoading: false, results: results });
      },
      () => {}
    );
  };

  search = (e, d) => {
    if (d.value === "") {
      this.reload();
      return;
    } else {
      this.setState({ isLoading: true, value: d.value });
    }

    if (_.includes([1, 3, 4], this.state.searchBy)) {
      // recherche par ipp ou nom + prenom ou prenom + nom
      // api Patients.completion
      if (this.state.searchBy === 1) {
        this.completionSearch("ipp", d.value, "");
      } else if (this.state.searchBy === 3) {
        this.completionSearch("format", "NP", d.value);
      } else {
        this.completionSearch("format", "PN", d.value);
      }
    } else if (this.state.searchBy === 5) {
      // api Patients.telephones
      this.telephoneSearch(d.value);
    } else {
      // ipp2 ou num de sécurité sociale
      // api Patients.readAll
      if (this.state.searchBy === 2) {
        this.readAllSearch("ipp2", d.value);
      } else {
        this.readAllSearch("nir", d.value);
      }
    }
  };

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title, patientId: result.id });
  };

  render() {
    //console.log(this.state);
    return (
      <React.Fragment>
        <Modal size="tiny" open={this.state.open}>
          <Modal.Header>Recherche élagie d'un patient</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Dropdown
                fluid={true}
                selection={true}
                options={this.options}
                defaultValue={this.state.searchBy}
                onChange={(e, d) => this.changeSearchBy(e, d)}
              />
              <Form.Input>
                <Search
                  fluid={true}
                  type="number"
                  placeholder="Recherche d'un patient..."
                  value={this.state.value}
                  showNoResults={false}
                  results={this.state.results}
                  onSearchChange={(e, d) => this.search(e, d)}
                  onResultSelect={this.handleResultSelect}
                  style={{ width: this.state.error ? "65%" : "100%" }}
                />
                {this.state.error ? (
                  <span style={{ paddingTop: "8px", paddingLeft: "5px" }}>
                    <strong>
                      <Icon name="warning sign" color="red" />
                      saisie invalide
                    </strong>
                  </span>
                ) : (
                  ""
                )}
              </Form.Input>

              {this.state.patientId !== -1 ? (
                <Form.Input>
                  <span>
                    <strong>
                      Identifiant du patient sélectionné :{" "}
                      {this.state.patientId}
                    </strong>
                  </span>
                </Form.Input>
              ) : (
                ""
              )}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Annuler"
              onClick={() => {
                this.reload();
                this.close();
              }}
            />
            <Button
              primary={true}
              content="Sélectionner"
              onClick={() => {
                if (this.state.patientId !== -1) {
                  this.props.patientChange(this.state.patientId);
                  this.reload();
                  this.close();
                } else {
                  return;
                }
              }}
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
