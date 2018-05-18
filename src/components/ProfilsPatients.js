import React from "react";

import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Icon,
  Form,
  Button,
  Modal,
  Ref
} from "semantic-ui-react";

import { hsize, denominationDefaultFormat } from "./Settings";

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
      modalDelete: false
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
    //this.setState({ patient: {} });
    this.props.client.Patients.read(
      id,
      {},
      patient => {
        _.set(patient, "passwordConfirm", ""); // champ provisoire
        if (_.isUndefined(patient.gestionRdvJO.reservation)) {
          patient.gestionRdvJO.reservation = {};
        }
        patient.gestionRdvJO.reservation.password = "";
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
      patient: {},
      saved: true
    });
  };

  save = () => {
    let patient = this.state.patient;
    //Les 2 champs de mots de passe doivent avoir les mêmes valeurs
    if (
      this.state.patient.gestionRdvJO.reservation.password ===
      this.state.patient.passwordConfirm
    ) {
      this.setState({
        patient: {
          passwordConfirm: ""
        }
      });
      _.unset(patient, "passwordConfirm");
      this.props.client.Patients.update(
        patient.id,
        patient,
        patient => {
          // success
          patient.gestionRdvJO.reservation.password = "";
          _.set(patient, "passwordConfirm", ""); // Forcer le passwordConfirm à être vide
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
              console.log(data);
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

  create = () => {
    this.props.client.Patients.create(
      {},
      patient => {
        // success
        //console.log(patient);
        _.set(patient, "passwordConfirm", "");
        this.setState({
          patient: patient
        });
        //objet age qui sera passé en props au composant FichePatient
        /*this.props.client.Patients.age(
          patient.id,
          {},
          result => {
            this.setState({ age: result });
          },
          data => {
            console.log("Erreur");
          }
        );*/
        this.reload(); // Je récupère le nombre de patients mis à jour
      },
      () => {
        // error
        console.log("Erreur de création d'un patient");
      }
    );
  };

  destroy = () => {
    this.props.client.Patients.destroy(
      this.state.patient.id,
      () => {
        // success
        this.setState({
          patient: {},
          age: {},
          saved: true,
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
  };

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
            format={denominationDefaultFormat} //TODO récupérer le format en configuration
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
          client={this.props.client}
        />
        <Divider hidden={true} />

        {this.state.patient.id ? (
          <Button
            negative={true}
            onClick={() => {
              this.setState({ modalDelete: true });
            }}
          >
            Supprimer
          </Button>
        ) : (
          ""
        )}
        <Button onClick={this.create}>Nouveau patient</Button>
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
          <Modal.Header>Supprimer la fiche</Modal.Header>
          <Modal.Content>
            <p>Voulez-vous supprimer cette fiche ?</p>
          </Modal.Content>
          <Modal.Actions>
            <Button negative={true} onClick={this.destroy}>
              Oui
            </Button>
            <Ref innerRef={node => node.firstChild.parentElement.focus()}>
              <Button
                primary={true}
                onClick={() => {
                  this.setState({ modalDelete: false });
                }}
              >
                Non
              </Button>
            </Ref>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}
