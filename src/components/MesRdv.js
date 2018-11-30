import React from "react";
import {
  Header,
  Button,
  Divider,
  Modal,
  Label,
  Icon,
  Message
} from "semantic-ui-react";

import _ from "lodash";

import moment from "moment";

import { hsize, rdvDateTime } from "./Settings";

import PriseRdv from "./PriseRdv";
import HorairesDisponibles from "./HorairesDisponibles";

class MonRdv extends React.Component {
  state = {
    edited: true,
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

  annulerRdv = () => {
    let params = _.assign({}, this.props.patient);
    const id = this.props.rdv.id;

    // Un rendez-vous unique sans patient identifié ?
    if (!params.ipp) {
      params = {
        password: this.props.rdv.patientJO.secret,
        _id: id
      };
    }

    this.props.client.Reservation.annuler(
      id,
      params,
      () => {
        this.props.updateMesRdv();
        this.close();
      },
      datas => {
        console.log(datas);
        //alert(datas.internalMessage + " : " + datas.userMessage);
        this.close();
      }
    );
  };

  updateRdv = () => {
    let params = _.assign({}, this.props.patient);
    const id = this.props.rdv.id;

    // Un rendez-vous unique sans patient identifié ?
    if (!params.ipp) {
      params = {
        password: this.props.rdv.patientJO.secret,
        _id: id
      };
    }

    //
    params.startAt = this.state.nouvelHoraire;

    this.props.client.Reservation.update(
      id,
      params,
      () => {
        this.props.updateMesRdv();
        this.close();
      },
      datas => {
        console.log(datas.internalMessage + " : " + datas.userMessage);
        this.close();
      }
    );
  };

  render() {
    if (
      _.isUndefined(this.props.plannings) ||
      _.isUndefined(this.props.rdv.planningsJA) ||
      !this.props.rdv.planningsJA.length
    ) {
      return "";
    }

    // le premier planning valide venu
    let index = _.findIndex(
      this.props.rdv.planningsJA,
      // this.props.plannings ne comporte que les plannings autorisés pour ce patient
      planning => !_.isUndefined(this.props.plannings[planning.id])
    );

    if (index === -1) {
      //console.log("Inscription sur un planning non géré => ne devrait pas survenir.");
      return "";
    }

    let planning = this.props.rdv.planningsJA[index];

    let unchangeable = false;
    if (planning.motif > 0) {
      // un motif est défini
      //console.log("id motif du RDV " + planning.motif); // le motif dans ce planning
      //console.log(this.props.plannings[planning.id].motifs); // les motifs autorisés pour le patient
      //console.log("Autorisation patient " + this.props.autorisationPatient);

      let indexMotif = _.findIndex(
        this.props.plannings[planning.id].motifs,
        // this.props.plannings comporte les motifs autorisés pour ce patient
        motif => motif.id === planning.motif
      );

      unchangeable = indexMotif === -1;
    }

    let titrePlanning = this.props.plannings[planning.id].titre;

    if (_.isUndefined(titrePlanning)) titrePlanning = "Planning non défini";

    let prevenance = this.props.plannings[planning.id].prevenance;

    if (_.isUndefined(prevenance)) prevenance = 0;

    let revolu =
      moment(this.props.rdv.startAt).subtract(prevenance, "hours") < moment();

    let maxModifs =
      this.props.rdv.lockRevision >= 5 && this.props.rdv.origine === "";

    return (
      <React.Fragment>
        <Header size="small">{titrePlanning}</Header>
        <Button
          onClick={() => this.setState({ edited: !this.state.edited })}
          icon={true}
          labelPosition="left"
          fluid={true}
        >
          <Icon name={this.state.edited ? "angle down" : "angle right"} />
          {rdvDateTime(this.props.rdv.startAt)}
        </Button>
        {this.state.edited ? (
          <React.Fragment>
            <Divider fitted={true} hidden={true} />
            {!revolu && !unchangeable ? ( // RDV pris en ligne (patient non identifié)
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
                      planningId={planning.id}
                      motifId={planning.motif}
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
                  <Modal.Header
                    icon="archive"
                    content={
                      maxModifs ? "Trop de modifications" : "Confirmation"
                    }
                  />
                  <Modal.Content>
                    {maxModifs
                      ? "Le rendez-vous a été trop souvent modifié. " +
                        "Il n'est maintenant plus modifiable en ligne. " +
                        "Il peut néanmoins toujours être annulé."
                      : "Je confirme vouloir déplacer ce RDV du " +
                        rdvDateTime(this.props.rdv.startAt) +
                        " au " +
                        rdvDateTime(this.state.nouvelHoraire) +
                        " ? Un mail de confirmation me sera adressé."}
                  </Modal.Content>
                  <Modal.Actions>
                    {maxModifs ? (
                      <Button primary={true} onClick={this.close}>
                        OK
                      </Button>
                    ) : (
                      <React.Fragment>
                        <Button onClick={this.close}>Non</Button>
                        <Button primary={true} onClick={this.updateRdv}>
                          Oui
                        </Button>
                      </React.Fragment>
                    )}
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
                    {rdvDateTime(this.props.rdv.startAt)} ?
                  </Modal.Content>
                  <Modal.Actions>
                    <Button onClick={this.close}>Non</Button>
                    <Button primary={true} onClick={this.annulerRdv}>
                      Oui
                    </Button>
                  </Modal.Actions>
                </Modal>
              </Button.Group>
            ) : (
              <Label
                content={
                  revolu
                    ? "Ce RDV n'est plus modifiable en ligne"
                    : unchangeable
                    ? "Ce RDV n'est pas modifiable en ligne"
                    : "Ce RDV n'est pas modifiable en ligne..." // autre raison... (?)
                }
                size="large"
                color="orange"
              />
            )}
            <p style={{ textAlign: "left" }}>
              {_.map(this.props.rdv.description.split("\n"), (line, i) => {
                return (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                );
              })}
            </p>
          </React.Fragment>
        ) : (
          <p>{_.truncate(this.props.rdv.description)}</p>
        )}

        <Divider />
      </React.Fragment>
    );
  }
}

export default class MesRdv extends React.Component {
  componentWillMount() {
    this.setState({
      nouveauRdv: false,
      mesRdv: [],
      edited: false,
      totalOnline: 0
    }); // default state

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
            description: planning.description,
            prevenance: planning.prevenance,
            motifs: planning.motifs
          };
        });
        this.setState({ plannings: planningsMap });
      },
      datas => {
        // ? erreur d'auth
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        //alert(datas.internalMessage + " : " + datas.userMessage);
        window.history.back();
      }
    );

    this.updateMesRdv();
  }

  updateMesRdv = () => {
    // Le RDV unique d'un patient non authentifié
    if (!_.isUndefined(this.props.rdv) && this.props.rdv.id) {
      this.props.client.Reservation.mesRendezVous(
        {
          _id: this.props.rdv.id,
          password: this.props.rdv.password
        },
        result => {
          this.setState({ mesRdv: result.results, autorisationPatient: 0 });
        },
        datas => {
          // ? erreur d'auth
          // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
          console.log(datas);
          //alert(datas.internalMessage + " : " + datas.userMessage);
          window.history.back();
        }
      );
    }
    // Tous les RDV d'un patient
    else {
      this.props.client.Reservation.mesRendezVous(
        {
          ipp: this.props.patient.ipp,
          password: this.props.patient.password
        },
        result => {
          this.setState({
            mesRdv: result.results,
            totalOnline: result.informations.totalOnline,
            autorisationPatient: result.informations.autorisation
          });
        },
        datas => {
          // ? erreur d'auth
          // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
          console.log(datas);
          //alert(datas.internalMessage + " : " + datas.userMessage);
          window.history.back();
        }
      );
    }
  };

  render() {
    // Aucun planning ne gère les rendez-vous en ligne
    if (_.isEmpty(this.state.plannings)) {
      return (
        <Message icon>
          <Icon name="calendar" loading />
          <Message.Content>
            <Message.Header>Accès aux rendez-vous impossible</Message.Header>
            La gestion par le patient de ses rendez-vous, n'est activée sur
            aucun planning de ce praticien.
          </Message.Content>
        </Message>
      );
    }

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
            ? this.props.patient && this.props.patient.ipp
              ? this.state.plannings
                ? "Vous n'avez aucun RDV prévu"
                : "Erreur d'identification"
              : !this.props.rdv.id
              ? "Erreur d'identification RDV"
              : "Le RDV a été annulé"
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
              autorisationPatient={this.state.autorisationPatient}
              updateMesRdv={this.updateMesRdv}
              key={i}
            />
          );
        })}
        {this.props.patient &&
        this.props.patient.ipp &&
        this.state.totalOnline < 3 &&
        this.state.plannings ? (
          <Button
            secondary={true}
            fluid={true}
            onClick={() => this.setState({ nouveauRdv: true })}
          >
            Prendre un nouveau RDV
          </Button>
        ) : (
          ""
        )}
        <Divider fitted={true} hidden={true} />
        <Button
          onClick={() => {
            let parts = window.location.hash.split("@");
            window.location =
              "#Patients/" + (parts.length > 1 ? "@" + parts[1] : "");
            window.location.reload();
          }}
          fluid={true}
          secondary={true}
        >
          Déconnexion
        </Button>
        <Divider fitted={true} hidden={true} />
        <Divider fitted={true} hidden={true} />
      </React.Fragment>
    );
  }
}
