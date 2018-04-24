import React from "react";

import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Icon,
  Form,
  Button,
  Modal
} from "semantic-ui-react";

import { hsize } from "./Settings";

import PatientSearch from "./PatientSearch";

import FichePatient from "./FichePatient";


export default class ProfilsPatients extends React.Component {
  componentWillMount() {
    this.setState({
      npatients: 0,
      praticien: "",
      patient: {},
      age: {},
      saved: true,
      errorOnSave: false,
      modalDelete: false,
      modaleSave: false
    });
  }

  componentDidMount() {
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
        _.set(patient, "passwordConfirm", ""); // champ provisoire
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
    if (this.state.patient.gestionRdvJO.reservation.password === this.state.patient.passwordConfirm){
      _.unset(patient, "passwordConfirm");
      this.props.client.Patients.update(
        patient.id,
        patient,
        patient => {
          // success
          this.setState({
            patient: patient,
            saved: true,
            modalSave: true,
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
    } else {
      return;
    }
  };

  onChange = patient => {
    this.setState({ patient: patient, saved: false });
  };

  newPatient = () => {
    this.props.client.Patients.create(
      {},
      patient => {
        // success
        this.setState({
          patient: patient
        });
        //objet age
        this.props.client.Patients.age(
          patient.id,
          {},
          result => {
            this.setState({ age: result });
          },
          data => {
            console.log("Erreur");
          }
        );
        this.reload(); // Je récupère le nombre de patients mis à jour
      },
      () => {
        // error
        console.log("Erreur de création d'un patient");
      }
    );
  };

  deletePatient = () => {
    this.props.client.Patients.destroy(
      this.state.patient.id,
      () => {
        // success
        this.setState({
          patient: {},
          age: {},
          modalDelete: false
        });
      },
      () => {
        // error
        console.log("Erreur lors de la suppression du patient");
      }
    );
    this.reload(); // pour la relecture du nombre de patients
    this.newSearch();
  }

  render() {
    return (
      <div id="profil-patients">
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

        {this.state.patient.id ? <Button negative={true} onClick={() => {this.setState({modalDelete: true})}}>Supprimer</Button> : ""}
        <Button onClick={this.newPatient}>Nouveau patient</Button>
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

        {/*Modal Delete*/}
        <Modal size="tiny" open={this.state.modalDelete}>
          <Modal.Header>
            Supprimer la fiche
          </Modal.Header>
          <Modal.Content>
            <p>Voulez-vous supprimer cette fiche ?</p>
          </Modal.Content>
          <Modal.Actions>
            <Button negative={true} onClick={() => {this.setState({modalDelete: false})}}>
              Non
            </Button>
            <Button positive={true} onClick={this.deletePatient}>
              Oui
            </Button>
          </Modal.Actions>
        </Modal>

        {/*Modal save*/}
        <Modal size="tiny" open={this.state.modalSave}>
          <Modal.Header>
            Sauvegardé
          </Modal.Header>
          <Modal.Content>
            <p>La fiche a été mise à jour !</p>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={() => {this.setState({ modalSave: false })}}>OK</Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}
