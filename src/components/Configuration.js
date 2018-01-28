import React from "react";

import _ from "lodash";

import {
  Header,
  Dropdown,
  Accordion,
  Form,
  Segment,
  Button
} from "semantic-ui-react";

import { maxWidth, fsize, hsize, defaultPlanning } from "./Settings";

export default class Configuration extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1 });
    this.reload();
  }

  reload = () => {
    this.props.client.Plannings.readAll(
      {},
      result => {
        this.setState({ plannings: result.results });
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

  onPlanningChange = (e, d) => {
    /*
    console.log(
      "options configurables du planning (mais on peut également en changer le titre, la description, la couleur par défaut...)"
    );
    console.log(this.state.plannings[d.value].optionsJO);
    */
    this.setState({ index: d.value });
  };

  render() {
    let { plannings, index } = this.state;
    let form = "";
    if (this.state.index >= 0) {
      let planning = plannings[index];
      let options = planning.optionsJO;

      const plagesPanels = [
        // javascript : 0=Sunday, 1=Monday, etc
        {
          title: "Dimanche",
          content: "0 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Lundi",
          content: "1 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Mardi",
          content: "2 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Mercredi",
          content: "3 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Jeudi",
          content: "4 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Vendredi",
          content: "5 - à définir avec des champs 'début' 'fin'"
        },
        {
          title: "Samedi",
          content: "6 - à définir avec des champs 'début' 'fin'"
        }
      ];

      const Plages = (
        <React.Fragment>
          <Form.Input
            label="Durée par défaut d'un RDV (en mn)"
            style={{ maxWidth: maxWidth / 4 }}
            placeholder="Durée par défaut"
            value={options.plages.duree}
            onChange={(e, d) => {
              plannings[index].optionsJO.plages.duree = d.value;
              this.setState({ plannings: plannings });
            }}
          />
          <Accordion.Accordion panels={plagesPanels} />
        </React.Fragment>
      );

      const reservationsPanels = [
        {
          title: "Congés",
          content: "Congés prévus (les congés passés pourront être supprimés)"
        },
        { title: "Horaires", content: "Horaires ouverts à la réservation" }
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
        <Segment>
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
            <Button onClick={this.cancel}>Annuler</Button>
            <Button secondary={true} onClick={this.defaults}>
              Valeurs par défaut
            </Button>
            <Button negative={true}>Supprimer</Button>
            <Button primary={true} onClick={this.save}>
              Sauvegarder
            </Button>
          </Form>
        </Segment>
      );
    }

    return (
      <React.Fragment>
        <Header size={hsize}>
          {plannings.length} plannings à configurer...
        </Header>
        <Dropdown
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
        {form}
      </React.Fragment>
    );
  }
}
