import React from "react";

import _ from "lodash";

import {
  Header,
  Dropdown,
  Accordion,
  Form,
  Button,
  Divider,
  Icon
} from "semantic-ui-react";

import { maxWidth, fsize, hsize, defaultPlanning } from "./Settings";

import HorairesSemaine from "./HorairesSemaine";
import Conges from "./Conges";

export default class Configuration extends React.Component {
  componentWillMount() {
    this.setState({
      plannings: [],
      index: -1,
      indexHoraire: 1,
      activeIndex: 0
    });
    this.reload();
  }

  reload = () => {
    this.props.client.Plannings.mesPlannings(
      { admin: true },
      result => {
        this.setState({
          plannings: result.results,
          index: result.results.length > 0 ? 0 : -1
        });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  cancel = () => {
    this.reload();
  };

  defaults = () => {
    let plannings = this.state.plannings;
    let planning = plannings[this.state.index];
    _.assign(planning, defaultPlanning);
    plannings[this.state.index] = planning;
    this.setState({ plannings: plannings });
  };

  save = () => {
    _.forEach(this.state.plannings, (planning, i) => {
      this.props.client.Plannings.update(
        planning.id,
        planning,
        result => {
          if (i === this.state.plannings.length - 1) {
            this.reload();
          }
        },
        datas => {
          console.log("erreur sur save() :");
          console.log(datas);
          if (datas.networkError === 409) {
            // lock version control
            this.reload();
          }
        }
      );
    });
  };

  supprimer = () => {
    const id = this.state.plannings[this.state.index].id;
    this.props.client.Plannings.destroy(
      id,
      () => {
        this.props.client.Plannings.mesPlannings(
          { admin: true },
          result => {
            let index = this.state.index;
            if (index >= result.results.length) {
              index = result.results.length - 1;
            }
            this.setState({ plannings: result.results, index: index });
          },
          datas => {
            console.log(datas);
          }
        );
      },
      datas => {
        console.log("erreur sur supprimer() :");
        console.log(datas);
      }
    );
  };

  ajouter = () => {
    this.props.client.Plannings.create(
      defaultPlanning,
      () => {
        this.props.client.Plannings.mesPlannings(
          { admin: true },
          result => {
            this.setState({
              plannings: result.results,
              index: result.results.length - 1
            });
          },
          datas => {
            console.log(datas);
          }
        );
      },
      datas => {
        console.log("erreur sur ajouter() :");
        console.log(datas);
      }
    );
  };

  onHorairesChange = horaires => {
    let plannings = this.state.plannings;
    //let planning = plannings[this.state.index];
    //index à modifier dynamiquement
    //let horairesState =
    //  planning.optionsJO.plages.horaires[this.state.indexHoraire];
    //horairesState = horaires;
    this.setState({ plannings: plannings });
  };

  onHorairesReservationChange = horaires => {
    let plannings = this.state.plannings;
    //let planning = plannings[this.state.index];
    //let horairesReservationState = planning.optionsJO.reservation.horaires;
    //horairesReservationState = horaires;
    this.setState({ plannings: plannings });
  };

  onPlanningChange = (e, d) => {
    /*
    console.log(
      "options configurables du planning (mais on peut également en changer le titre, la description, la couleur par défaut...)"
    );
    console.log(this.state.plannings[d.value].optionsJO);
    */
    this.setState({ index: d.value });
  };

  handleClickAccordion = (e, index) => {
    const indexToTest = index.index;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === indexToTest ? -1 : indexToTest;
    this.setState({ activeIndex: newIndex });
  };

  render() {
    let { plannings, index } = this.state;
    let form = "";
    if (index >= 0) {
      let planning = plannings[index];
      let options = planning.optionsJO;
      let horaires = options.plages.horaires;
      let horairesReservation = options.reservation.horaires;
      let congesPrevus = options.reservation.conges;

      const Plages = (
        <React.Fragment>
          <Form.Input
            label="Durée par défaut d'un RDV (en mn)"
            style={{ maxWidth: maxWidth / 5 }}
            placeholder="Durée par défaut"
            value={options.plages.duree}
            type="number"
            onChange={(e, d) => {
              plannings[index].optionsJO.plages.duree = _.toNumber(d.value);
              this.setState({ plannings: plannings });
            }}
          />

          <HorairesSemaine
            horaires={horaires}
            index={this.state.index}
            onHorairesChange={this.onHorairesChange}
          />
        </React.Fragment>
      );

      const HorairesReserves = (
        <React.Fragment>
          <Accordion>
            {_.map(horairesReservation, (horaireReservation, i) => {
              return (
                <React.Fragment key={i}>
                  <Accordion.Title
                    active={this.state.activeIndex === i}
                    index={i}
                    onClick={this.handleClickAccordion}
                  >
                    <Icon name="dropdown" />
                    Niveau d'autorisation {i}
                  </Accordion.Title>
                  <Accordion.Content active={this.state.activeIndex === i}>
                    <HorairesSemaine
                      horaires={horaireReservation}
                      index={this.state.index}
                      onHorairesChange={this.onHorairesReservationChange}
                    />
                  </Accordion.Content>
                </React.Fragment>
              );
            })}
          </Accordion>
        </React.Fragment>
      );

      const reservationsPanels = [
        {
          title:
            "Congés (TODO: il faudrait masquer le contenu de cet accordéon lorsqu'il est fermé)",
          content: (
            <Conges
              plagesConges={congesPrevus}
              key="0"
              onChange={conges => {
                console.log(
                  "TODO: prise en compte des modifications sur les congés"
                );
                console.log(conges);
              }}
            />
          )
        },
        { title: "Horaires", content: { content: HorairesReserves, key: "1" } }
      ];

      const Reservations = (
        <React.Fragment>
          Paramètrages des réservations (plages autorisées, niveaux
          d'autorisations, périodes de congés...)
          <Accordion.Accordion panels={reservationsPanels} />
        </React.Fragment>
      );

      const rootPanels = [
        {
          title: "Plages horaires d'ouverture",
          content: { content: Plages, key: "1" }
        },
        {
          title: "Réservations",
          content: { content: Reservations, key: "2" }
        }
      ];

      form = (
        <React.Fragment>
          <Divider hidden={true} />
          <Form size={fsize}>
            <Form.Group widths={2}>
              <Form.Input
                label="Titre"
                placeholder="Titre du planning / Nom du praticien / Nom de la ressource"
                value={planning.titre}
                onChange={(e, d) => {
                  plannings[index].titre = d.value;
                  this.setState({ plannings: plannings });
                }}
              />
              <Form.Input
                label="Description"
                placeholder="Description du planning"
                value={planning.description}
                onChange={(e, d) => {
                  plannings[index].description = d.value;
                  this.setState({ plannings: plannings });
                }}
              />
            </Form.Group>
            <Accordion
              defaultActiveIndex={0}
              panels={rootPanels}
              styled={true}
              fluid={true}
            />
            <Divider hidden={true} />
            <Button onClick={this.cancel}>Annuler</Button>
            <Button onClick={this.defaults}>Valeurs par défaut</Button>
            <Button negative={true} onClick={this.supprimer}>
              Supprimer
            </Button>
            <Button primary={true} onClick={this.save}>
              Sauvegarder
            </Button>
          </Form>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <Header size={hsize}>
          {plannings.length} planning{plannings.length > 1 ? "s" : ""} à
          configurer...
        </Header>
        <Dropdown
          value={index}
          onChange={this.onPlanningChange}
          placeholder="Choisir le planning à configurer"
          fluid={false}
          selection={true}
          options={_.map(plannings, (planning, i) => {
            return {
              text: planning.titre,
              value: i
            };
          })}
        />
        <b>
          {this.state.index >= 0
            ? " #" + this.state.plannings[this.state.index].id
            : ""}
        </b>
        {form}
        <Divider fitted={true} hidden={true} />
        <Button onClick={this.ajouter}>Nouveau planning</Button>
      </React.Fragment>
    );
  }
}
