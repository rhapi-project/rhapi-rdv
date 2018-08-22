import React from "react";

import {
  Button,
  Icon,
  Step,
  Divider,
  Dropdown,
  Header,
  Input
} from "semantic-ui-react";

import _ from "lodash";

import { hsize, rdvDateTime } from "./Settings";

import MesRdv from "./MesRdv";

import HorairesDisponibles from "./HorairesDisponibles";

export default class PriseRdv extends React.Component {
  componentWillMount() {
    let patient = {};
    if (this.props.identified) {
      patient.ipp = this.props.patient.ipp;
      patient.password = this.props.patient.password;
    } else {
      if (!_.isUndefined(this.props.patient.nom))
        patient.nom = this.props.patient.nom;
      if (!_.isUndefined(this.props.patient.prenom))
        patient.prenom = this.props.patient.prenom;
      if (!_.isUndefined(this.props.patient.email))
        patient.email = this.props.patient.email;
      if (!_.isUndefined(this.props.patient.telMobile))
        patient.telMobile = this.props.patient.telMobile;
    }

    this.setState({
      // default state
      patient: patient,
      rdvId: 0, // new created rdv id
      code: "", // secret validation code
      plannings: [],
      motifs: [],
      currentPlanningId: 0,
      currentMotifId: 0,
      currentMotifIndex: null,
      currentMotifText: "",
      horairesDisponibles: [],
      horaireDisponibleNext: "",
      horaire: "",
      completed: false,
      voirMesRdv: false
    });

    this.props.client.Reservation.mesPlannings(
      patient,
      result => {
        this.setState({ plannings: result.results });
      },
      datas => {
        // erreur
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  }

  onPlanningChange = (e, d) => {
    const planning = this.state.plannings[d.value];
    if (planning.id !== this.state.currentPlanningId) {
      this.setState({
        motifs: planning.motifs,
        currentMotifId: 0,
        currentMotifIndex: null,
        currentPlanningId: planning.id,
        horairesDisponibles: [],
        horaireDisponibleNext: ""
      });
    }
  };

  onMotifChange = (e, d) => {
    let index = d.value;
    if (_.isNull(index)) {
      return;
    }
    let motif = this.state.motifs[index];
    let motifId = motif.id;
    this.setState({ currentMotifId: motifId, currentMotifIndex: index });
  };

  onCodeChange = (e, d) => {
    this.setState({ code: d.value, codeError: false });
  };

  onCodeClick = () => {
    let link = this.state.rdvId + "_" + this.state.code + "_json";
    this.props.client.Reservation.confirmation(
      link,
      result => {
        this.setState({ codeValide: true, codeError: false });
      },
      datas => {
        this.setState({ codeError: true }); // à voir : erreur code de confirmation
        // erreur
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        //alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  };

  createRdv = horaire => {
    let params = this.state.patient;
    params.planning = this.state.currentPlanningId;
    params.motif = this.state.currentMotifId;
    params.startAt = horaire;

    this.props.client.Reservation.create(
      params,
      result => {
        this.setState({ completed: true, horaire: horaire, rdvId: result.id });
      },
      datas => {
        // erreur
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  };

  render() {
    if (this.state.voirMesRdv) {
      return (
        <MesRdv
          patient={this.state.patient}
          identified={true}
          client={this.props.client}
        />
      );
    }

    return (
      <React.Fragment>
        <Divider hidden={true} />
        <Header size={hsize}>Prendre un rendez-vous</Header>
        <Step.Group vertical={true} fluid={true} unstackable={true}>
          <Step completed={this.state.currentPlanningId !== 0}>
            <Icon name="calendar" />
            <Step.Content>
              <Step.Title>Planning</Step.Title>
              <Step.Description>
                Je choisis le planning d'un praticien
              </Step.Description>
              <Divider hidden={true} />
            </Step.Content>
            <Dropdown
              onChange={this.onPlanningChange}
              placeholder="Je choisis le planning d'un praticien"
              fluid={true}
              selection={true}
              options={_.map(this.state.plannings, (planning, i) => {
                return {
                  text: planning.titre,
                  value: i //,
                  //image: {
                  //  avatar: true,
                  //  src: "./images/praticien.png"
                  //}
                };
              })}
            />
          </Step>
          {this.state.motifs.length === 0 ? (
            ""
          ) : (
            <Step completed={this.state.currentMotifId !== 0}>
              <Icon name="info" />
              <Step.Content>
                <Step.Title>Motif du rendez-vous</Step.Title>
                <Step.Description>Je précise le motif du RDV</Step.Description>
                <Divider hidden={true} />
              </Step.Content>
              <Dropdown
                onChange={this.onMotifChange}
                placeholder="Je précise le motif du RDV"
                fluid={true}
                selection={true}
                value={this.state.currentMotifIndex}
                options={_.map(this.state.motifs, (motif, i) => {
                  return {
                    text: motif.motif,
                    value: i
                  };
                })}
              />
            </Step>
          )}
          {this.state.currentMotifId === 0 ||
          this.state.currentPlanningId === 0 ? (
            ""
          ) : (
            <Step
              completed={
                this.state.completed &&
                (this.props.identified || this.state.codeValide)
              }
            >
              <Icon
                name={
                  this.state.completed && !this.props.identified
                    ? "mobile"
                    : "add to calendar"
                }
              />
              <Step.Content>
                <Step.Title>
                  {this.state.completed
                    ? "RDV le " + rdvDateTime(this.state.horaire)
                    : "Je choisis un horaire"}
                </Step.Title>
                <Step.Description>
                  {this.state.completed
                    ? this.props.identified || this.state.codeValide
                      ? "Mon nouveau RDV a bien été enregistré. Un mail de confirmation vient de m'être envoyé."
                      : "Un code vient de m'être envoyé par SMS. " +
                        "Je saisis ce code " +
                        "pour valider définivement le RDV."
                    : "Je choisis un horaire parmi ceux qui me sont proposés"}
                </Step.Description>
                <Divider fitted={true} hidden={true} />
                {this.state.completed ? (
                  this.props.identified || this.state.codeValide ? (
                    ""
                  ) : (
                    <span>
                      <Input
                        icon="key"
                        iconPosition="left"
                        placeholder="code"
                        value={this.state.code}
                        onChange={this.onCodeChange}
                        error={this.state.codeError}
                      />
                      &nbsp;
                      <Button
                        size="mini"
                        primary={true}
                        onClick={this.onCodeClick}
                      >
                        Valider
                      </Button>
                    </span>
                  )
                ) : (
                  ""
                )}
              </Step.Content>
            </Step>
          )}
        </Step.Group>
        {this.state.completed ? (
          <React.Fragment>
            {this.props.identified ? (
              <React.Fragment>
                <Button
                  onClick={() => this.setState({ voirMesRdv: true })}
                  fluid={true}
                  secondary={true}
                >
                  Voir mes rendez-vous
                </Button>
                <Divider fitted={true} hidden={true} />
              </React.Fragment>
            ) : (
              ""
            )}
          </React.Fragment>
        ) : this.state.currentMotifId ? (
          <HorairesDisponibles
            patient={this.state.patient}
            planningId={this.state.currentPlanningId}
            motifId={this.state.currentMotifId}
            validation={this.createRdv}
            client={this.props.client}
          />
        ) : (
          ""
        )}
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
          {this.state.completed ? "Déconnexion" : "Annuler cette prise de RDV"}
        </Button>
      </React.Fragment>
    );
  }
}
