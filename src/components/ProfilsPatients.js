import React from "react";

//import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Icon,
  Form,
  Button
} from "semantic-ui-react";

import { hsize } from "./Settings";

import PatientSearch from "./PatientSearch";

import FichePatient from "./FichePatient";

/**
 * Bouton "Nouvelle recherche"
 * Il faut que ça puisse vider le Search
 */

export default class ProfilsPatients extends React.Component {
  componentWillMount() {
    this.setState({
      npatients: 0,
      praticien: "",
      patient: {},
      age: {},
      saved: true,
      errorOnSave: false
    });
    this.reload();
  }

  reload = () => {
    //Pour récupérer le nombre de patients et le nom du praticien
    this.props.client.Patients.readAll(
      { limit: 1 },
      result => {
        this.setState({
          npatients: result.informations.totalSize
        });
      },
      data => {
        console.log("Erreur lecture des patients");
        console.log(data);
      }
    );

    this.props.client.MonCompte.read(
      monProfil => {
        this.setState({
          praticien: monProfil.currentName
        });
      },
      data => {
        console.log("Erreur lecture des informations sur le praticien");
        console.log(data);
      }
    );
  };

  onPatientChange = id => {
    this.props.client.Patients.read(
      id,
      {},
      patient => {
        this.setState({ patient: patient, saved: true, errorOnSave: false });
      },
      data => {
        //Error
        console.log("Erreur");
        console.log(data);
      }
    );

    this.props.client.Patients.age(
      id,
      {},
      result => {
        this.setState({ age: result });
      },
      data => {
        // error
        console.log("Erreur");
      }
    );
    this.setState({ clearSearch: false });
  };

  newSearch = () => {
    this.setState({
      clearSearch: true,
      patient: {}
    });
  };

  onChange = patient => {
    this.setState({
      patient
    });
  };

  save = () => {
    let patient = this.state.patient;
    this.props.client.Patients.update(
      patient.id,
      patient,
      patient => {
        // success
        this.setState({
          patient: patient,
          saved: true,
          errorOnSave: false
        });
        // la date de naissance peut avoir été modifiée
        // => l'âge est mis à jour
        this.props.client.Patients.age(
          patient.id,
          {},
          result => {
            this.setState({ age: result });
          },
          data => {
            // error
            console.log("Erreur");
          }
        );
      },
      () => {
        // error
        this.setState({
          errorOnSave: true
        });
        console.log("Erreur de sauvegarde");
      }
    );
  };

  onChange = patient => {
    this.setState({ patient: patient, saved: false });
  };

  render() {
    return (
      <React.Fragment>
        <Header size={hsize}>Patients</Header>
        {this.state.errorOnSave ? (
          <Message negative={true} icon={true}>
            <Icon name="warning" size="small" />
            <Message.Content>
              <Message.Header>Erreur les sauvegarde</Message.Header>
              Le données ont probablement été modifiées depuis un autre poste.
              Merci de bien vouloir annuler pour actualiser la fiche.
            </Message.Content>
          </Message>
        ) : this.state.saved ? (
          <Message icon={true}>
            <Icon name="doctor" size="small" />
            <Message.Content>
              <Message.Header>{this.state.praticien}</Message.Header>
              Nombre de patients : {this.state.npatients}
            </Message.Content>
          </Message>
        ) : (
          <Message negative={true} icon={true}>
            <Icon name="info" size="small" />
            <Message.Content>
              <Message.Header>
                Les données du patient ont été modifiées
              </Message.Header>
              Vous pouvez sauvegarder ou annuler ces modifications.
            </Message.Content>
          </Message>
        )}

        <Form.Input>
          <PatientSearch
            client={this.props.client}
            patientChange={this.onPatientChange}
            format="NP" //TODO récupérer le format en configuration
            clear={this.state.clearSearch}
          />

          <Icon
            style={{ cursor: "pointer", marginTop: 10, marginLeft: 10 }}
            onClick={this.newSearch}
            size="large"
            name="remove user"
          />
        </Form.Input>
        <Divider hidden={true} />

        <FichePatient
          patient={this.state.patient}
          age={this.state.age}
          onChange={this.onChange}
        />
        <Divider hidden={true} />

        {this.state.patient.id ? <Button negative>Supprimer</Button> : ""}
        <Button>Nouveau patient</Button>
        {this.state.patient.id ? (
          <React.Fragment>
            <Button onClick={() => this.onPatientChange(this.state.patient.id)}>
              Annuler / Actualiser
            </Button>
            <Button primary={!this.state.saved} onClick={this.save}>
              Sauvegarder
            </Button>
          </React.Fragment>
        ) : (
          <div style={{ minHeight: "400px" }} />
        )}
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
