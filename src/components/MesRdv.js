import React from "react";
import { Header, Button, Divider, Modal } from "semantic-ui-react";

import _ from "lodash";

import { hsize, longDateTime } from "./Settings";

import PriseRdv from "./PriseRdv";
import HorairesDisponibles from "./HorairesDisponibles";

class MonRdv extends React.Component {
  state = {
    edited: false,
    openSupp: false,
    openModif: false,
    openConfirmModif: false,
    nouvelHoraire: ""
  };

  close = () => {
    this.setState({
      openSupp: false,
      openModif: false,
      openConfirmModif: false,
      nouvelHoraire: ""
    });
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
        this.close();
      }
    );
  };

  updateRdv = () => {
    const params = this.props.patient;
    params.startAt = this.state.nouvelHoraire;
    const id = this.props.rdv.id;
    this.props.client.Reservation.update(
      id,
      params,
      () => {
        this.props.updateMesRdv();
        this.close();
      },
      datas => {
        alert(datas.internalMessage + " : " + datas.userMessage);
        this.close();
      }
    );
  };

  render() {
    let titrePlanning = "";
    if (
      !_.isUndefined(this.props.plannings) &&
      !_.isUndefined(this.props.rdv.planningsJA)
    ) {
      titrePlanning = this.props.plannings[this.props.rdv.planningsJA[0].id]
        .titre;
      if (_.isUndefined(titrePlanning)) titrePlanning = "Planning non défini";
    }

    console.log(this.props.rdv);
    return (
      <React.Fragment>
        <Header>{titrePlanning}</Header>
        <Button onClick={() => this.setState({ edited: !this.state.edited })}>
          {longDateTime(this.props.rdv.startAt)}
        </Button>
        {this.state.edited ? (
          <React.Fragment>
            <Divider fitted={true} hidden={true} />
            <Button.Group>
              <Button
                positive={true}
                onClick={() => this.setState({ openModif: true })}
              >
                Je modifie ce RDV
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
                <Modal.Content scrolling={true}>
                  <HorairesDisponibles
                    patient={this.props.patient}
                    planningId={this.props.rdv.planningsJA[0].id}
                    motifId={-this.props.rdv.planningsJA[0].motif}
                    validation={horaire =>
                      this.setState({
                        openModif: false,
                        openConfirmModif: true,
                        nouvelHoraire: horaire
                      })
                    }
                    client={this.props.client}
                  />
                </Modal.Content>
              </Modal>
              <Modal
                size="tiny"
                open={this.state.openConfirmModif}
                onClose={this.close}
                dimmer={false}
                closeOnDocumentClick={true}
              >
                <Modal.Header icon="archive" content="Confirmation" />
                <Modal.Content>
                  Je confirme vouloir déplacer ce RDV du{" "}
                  {longDateTime(this.props.rdv.startAt)} au{" "}
                  {longDateTime(this.state.nouvelHoraire)} ?
                </Modal.Content>
                <Modal.Actions>
                  <Button onClick={this.close}>Non</Button>
                  <Button negative={true} onClick={this.updateRdv}>
                    Oui
                  </Button>
                </Modal.Actions>
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
                  Je confirme vouloir annuler ce RDV du{" "}
                  {longDateTime(this.props.rdv.startAt)} ?
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
        <p>{this.props.rdv.description}</p>
        <Divider />
      </React.Fragment>
    );
  }
}
export default class MesRdv extends React.Component {
  componentWillMount() {
    this.setState({ nouveauRdv: false, mesRdv: [], edited: false }); // default state
  }

  componentDidMount() {
    this.props.client.Reservation.mesPlannings(
      {
        ipp: this.props.patient.ipp,
        password: this.props.patient.password
      },
      result => {
        let planningsMap = {};
        _.forEach(result.results, planning => {
          planningsMap[planning.id] = {
            titre: planning.titre,
            description: planning.description
          };
        });
        this.setState({ plannings: planningsMap });
      },
      datas => {
        // ? erreur d'auth
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
        window.history.back();
      }
    );
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
        <Divider hidden={true} />
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
              plannings={this.state.plannings}
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
        <Divider fitted={true} hidden={true} />
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
