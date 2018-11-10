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
  Popup,
  Ref
} from "semantic-ui-react";

import {
  hsize,
  codePostalRegex,
  helpPopup,
  denominationDefaultFormat,
  emailRegex,
  telRegex
} from "./Settings";

import PatientSearch from "./PatientSearch";

import PatientSearchModal from "./PatientSearchModal";

import FichePatient from "./FichePatient";

import site from "./SiteSettings";

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
      patientSearchModal: false
    });
  }

  componentDidMount() {
    this.reload();

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
  };

  onPatientChange = (id, denomPatient) => {
    // denomPatient ne sera pas utilisé ici

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

  telephoneValide = numero => {
    for (let i = 0; i < telRegex.length; i++) {
      if (telRegex[i].test(numero)) {
        return true;
      }
    }
    return false;
  };

  verification = () => {
    if (
      this.state.patient.nom !== "" &&
      this.state.patient.prenom !== "" &&
      (this.state.patient.codePostal === "" ||
        codePostalRegex.test(this.state.patient.codePostal)) &&
      (this.state.patient.telBureau === "" ||
        this.telephoneValide(this.state.patient.telBureau)) &&
      (this.state.patient.telMobile === "" ||
        this.telephoneValide(this.state.patient.telMobile)) &&
      (this.state.patient.telDomicile === "" ||
        this.telephoneValide(this.state.patient.telDomicile)) &&
      (this.state.patient.email === "" ||
        emailRegex.test(this.state.patient.email))
    ) {
      return true;
    } else {
      return false;
    }
  };

  save = () => {
    let patient = this.state.patient;
    console.log(patient);

    if (this.verification()) {
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
      console.log(
        "Impossible de faire une sauvegarde - les champs obligatoires ne sont pas renseignés ou certains champs ne sont pas valides !"
      );
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
        this.setState({
          patient: patient,
          clearSearch: true
        });
        this.reload(); // récupère le nombre de patients mis à jour
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

  patientSearchModalOpen = bool => {
    this.setState({ patientSearchModal: bool });
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
              Les données ont probablement été modifiées depuis un autre poste.
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

          <Popup
            trigger={
              <Icon
                style={{ cursor: "pointer", marginTop: 10, marginLeft: 10 }}
                onClick={this.newSearch}
                size="large"
                name="remove user"
              />
            }
            content="Nouvelle recherche"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />
          {/*<Icon
            style={{ cursor: "pointer", marginTop: 10, marginLeft: 10 }}
            onClick={this.newSearch}
            size="large"
            name="remove user"
          />*/}

          <Popup
            trigger={
              <Icon
                style={{ cursor: "pointer", marginTop: 10, marginLeft: 10 }}
                disabled={this.state.patientSearchModal}
                onClick={() => this.patientSearchModalOpen(true)}
                size="large"
                name="search"
              />
            }
            content="Recherche élargie d'un patient"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />
        </Form.Input>
        <Divider hidden={true} />

        <FichePatient
          patient={this.state.patient}
          age={this.state.age}
          onChange={this.onChange}
          client={this.props.client}
          saved={this.state.saved} // new
          save={this.save} // new
          onPatientChange={this.onPatientChange} // new
        />

        <Divider hidden={true} />

        {/* Recherche élargie d'un patient */}
        <PatientSearchModal
          open={this.state.patientSearchModal}
          client={this.props.client}
          patientChange={this.onPatientChange}
          patientSearchModalOpen={this.patientSearchModalOpen}
        />

        {this.state.patient.id && !site.hideDeletePatientButton ? (
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
        {site.hideCreatePatientButton ? (
          ""
        ) : (
          <Button onClick={this.create}>Nouveau patient</Button>
        )}
        {this.state.patient.id ? (
          <React.Fragment>
            <Button
              onClick={() => this.onPatientChange(this.state.patient.id, "")}
            >
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
