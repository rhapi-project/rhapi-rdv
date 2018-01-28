import React from "react";
import { Header, Button, Divider, Modal } from "semantic-ui-react";

import _ from "lodash";

import { hsize } from "./Settings";

import PriseRdv from "./PriseRdv";
import HorairesDisponibles from "./HorairesDisponibles";

// TODO: améliorer ce Component MonRdv
// => afficher le détail de chaque rendez-vous
// => ajouter des boutons "Annulation" "Modification" et gérer ces actions
class MonRdv extends React.Component {
  state = {
    edited: false,
    openSupp: false,
    openModif: false
  };

  close = () => {
    this.setState({ openSupp: false, openModif: false });
  };

  supprimerReservation = () => {
    const params = this.props.patient;
    const id = this.props.rdv.id;
    this.props.client.Reservation.annuler(
      id,
      params,
      () => {
        this.props.updateMesRdv();
        this.close();
      },
      datas => {
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  };

  updateRdv = horaire => {
    console.log(horaire);
    this.close();
  };

  render() {
    return (
      <React.Fragment>
        <Button onClick={() => this.setState({ edited: !this.state.edited })}>
          {new Date(this.props.rdv.startAt).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
          })}
        </Button>
        {this.state.edited ? (
          <React.Fragment>
            <br />
            <Button.Group>
              <Button
                positive={true}
                onClick={() => this.setState({ openModif: true })}
              >
                Je change l'horaire
              </Button>

              <Button.Or text="ou" />
              <Button
                negative={true}
                onClick={() => this.setState({ openSupp: true })}
              >
                J'annule ce RDV
              </Button>

              {/* Modals */}
              <Modal
                size="tiny"
                open={this.state.openModif}
                onClose={this.close}
                dimmer={false}
                closeOnDocumentClick={true}
              >
                <Modal.Content>
                  <HorairesDisponibles
                    patient={this.props.patient}
                    planningId={this.props.rdv.idPlanningsJA[0]}
                    motifId={-this.props.rdv.idObjet}
                    validation={this.updateRdv}
                    client={this.props.client}
                  />
                </Modal.Content>
              </Modal>
              <Modal
                size="tiny"
                open={this.state.openSupp}
                onClose={this.close}
                dimmer={false}
                closeOnDocumentClick={true}
              >
                <Modal.Header icon="archive" content="Annulation" />
                <Modal.Content>
                  Je confirme l'annulation du rendez-vous ?
                </Modal.Content>
                <Modal.Actions>
                  <Button onClick={this.close}>Non</Button>
                  <Button negative={true} onClick={this.supprimerReservation}>
                    Oui
                  </Button>
                </Modal.Actions>
              </Modal>
            </Button.Group>
          </React.Fragment>
        ) : (
          ""
        )}
        <br />
        {this.props.rdv.description}
        <Divider />
      </React.Fragment>
    );
  }
}
export default class MesRdv extends React.Component {
  componentWillMount() {
    this.setState({ nouveauRdv: false, mesRdv: [], edited: false }); // default state
    this.updateMesRdv();
  }

  updateMesRdv = () => {
    this.props.client.Reservation.mesRendezVous(
      {
        ipp: this.props.patient.ipp,
        password: this.props.patient.password
      },
      result => {
        // Attention on récupère ici des rendez-vous sans distinction de planning
        // Il peut donc y avoir des RDV pour lesquels le patient n'a aucune autorisation
        // d'annulation ou de modification
        this.setState({ mesRdv: result.results });
      },
      datas => {
        // ? erreur d'auth
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
        window.history.back();
      }
    );
  };

  render() {
    // Prendre un nouveau RDV ?

    if (this.state.nouveauRdv) {
      return (
        <PriseRdv
          patient={this.props.patient}
          identified={true}
          client={this.props.client}
        />
      );
    }
    // Sinon
    // TODO afficher les rendez-vous et proposer pour chacun 'annuler' ou 'modifier'
    // Attention on récupère ici des rendez-vous sans distinction de planning
    // Il peut donc y avoir des RDV pour lesquels le patient n'a aucune autorisation
    // d'annulation ou de modification
    return (
      <React.Fragment>
        <Header size={hsize}>
          {this.state.mesRdv.length === 0
            ? "Aucun rendez-vous"
            : this.state.mesRdv.length === 1
              ? "Mon prochain rendez-vous"
              : "Mes prochains rendez-vous"}
        </Header>
        <Divider />
        {_.map(this.state.mesRdv, (rdv, i) => {
          return (
            <MonRdv
              rdv={rdv}
              client={this.props.client}
              patient={this.props.patient}
              updateMesRdv={this.updateMesRdv}
              key={i}
            />
          );
        })}
        <Button
          secondary={true}
          fluid={true}
          onClick={() => this.setState({ nouveauRdv: true })}
        >
          Prendre un nouveau RDV
        </Button>
        <Divider fitted={true} />
        <Button
          onClick={() => window.location.reload()}
          fluid={true}
          secondary={true}
        >
          Déconnexion
        </Button>
      </React.Fragment>
    );
  }
}
