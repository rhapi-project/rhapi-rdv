import React from "react";

import _ from "lodash";

import {
  Header,
  Dropdown,
  Accordion,
  Form,
  Button,
  Divider,
  Popup,
  Icon,
  Checkbox
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
      activeIndex: -1
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
          <p>
            Les plages horaires ouvertes à la prise de rendez-vous en ligne sont
            définies pour chacun des 4 premiers niveaux d'autorisation (niveaux
            de 0 à 3).
          </p>
          <p>
            Le cinquième niveau (niveau 4 non configurable) dispose de
            l'intégralité des plages horaires, mais reste reservé à une prise de
            rendez-vous directement depuis l'interface du praticien.
          </p>
          <Accordion.Accordion>
            {_.map(horairesReservation, (horaireReservation, i) => {
              return (
                <React.Fragment key={i}>
                  <Accordion.Title
                    active={this.state.activeIndex === i}
                    index={i}
                    onClick={(e, d) =>
                      this.setState({
                        activeIndex:
                          this.state.activeIndex === d.index ? -1 : d.index
                      })
                    }
                    icon="dropdown"
                    content={"Niveau d'autorisation " + i}
                  />

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
          </Accordion.Accordion>
        </React.Fragment>
      );

      const reservationsPanels = [
        {
          title: "Congés",
          content: {
            content: (
              <React.Fragment>
                <Form.Input
                  label="Les jours fériés légaux sont pris en compte automatiquement"
                  style={{ maxWidth: maxWidth / 10 }}
                >
                  <Checkbox
                    checked={options.reservation.congesFeries}
                    onChange={(e, d) => {
                      options.reservation.congesFeries = d.checked;
                      plannings[index].optionsJO = options;
                      this.setState({ plannings: plannings });
                    }}
                  />
                </Form.Input>
                <Form.Group>
                  <Form.Input
                    label="Les périodes de congés sont affichées sur l'agenda"
                    style={{ maxWidth: maxWidth / 10 }}
                  >
                    <Checkbox
                      checked={options.reservation.congesVisibles}
                      onChange={(e, d) => {
                        options.reservation.congesVisibles = d.checked;
                        plannings[index].optionsJO = options;
                        this.setState({ plannings: plannings });
                      }}
                    />
                  </Form.Input>
                  <Form.Input
                    disabled={!options.reservation.congesVisibles}
                    label="avec la couleur"
                    style={{ maxWidth: maxWidth / 10 }}
                    transparent={true}
                    value={options.reservation.congesCouleur}
                    type="color"
                    onChange={(e, d) => {
                      options.reservation.congesCouleur = d.value;
                      plannings[index].optionsJO = options;
                      this.setState({ plannings: plannings });
                    }}
                  />
                </Form.Group>
                <Popup
                  trigger={
                    <Form.Group>
                      <Header size="tiny">Liste des congés&nbsp;</Header>
                      <Icon name="help circle" />
                    </Form.Group>
                  }
                  inverted={true}
                >
                  Chaque période est définie par des dates de début et de fin
                  (de manière inclusive).<br />
                  L'intitulé de la période sera repris sur l'agenda, si l'option
                  d'affichage ci-dessus est cochée.<br />
                  Les périodes ainsi définies seront exclues lors d'une prise de
                  rendez-vous en ligne.<br />
                  Les jours fériés légaux, peuvent être pris en compte
                  automatiquement (cocher ci-dessus l'option correspondante).<br />
                  Les périodes passées les plus anciennes pourront être
                  supprimées.
                </Popup>

                <Conges
                  plagesConges={congesPrevus}
                  onChange={conges => {
                    // prise en compte directement depuis Conges
                  }}
                />
              </React.Fragment>
            ),
            key: "0"
          }
        },
        {
          title: "Plages horaires ouvertes selon le niveau d'autorisation",
          content: { content: HorairesReserves, key: "1" }
        }
      ];

      const Reservations = (
        <React.Fragment>
          Paramètres pour la prise de rendez-vous
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
              <Form.Input
                label="Couleur"
                style={{ maxWidth: maxWidth / 10 }}
                transparent={true}
                value={planning.couleur}
                type="color"
                onChange={(e, d) => {
                  plannings[index].couleur = d.value;
                  this.setState({ plannings: plannings });
                }}
              />
            </Form.Group>
            <Accordion
              defaultActiveIndex={-1}
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
          onChange={(e, d) => this.setState({ index: d.value })}
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
