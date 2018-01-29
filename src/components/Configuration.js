import React from "react";

import _ from "lodash";

import {
  Header,
  Dropdown,
  Accordion,
  Form,
  Segment,
  Button,
  Divider,
  Input,
  Label
} from "semantic-ui-react";

import { maxWidth, fsize, hsize, defaultPlanning } from "./Settings";

// props : hfrom, hto, onChange(hfrom, hto), remove(e, d);

class FromTo extends React.Component {
  componentWillMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  render() {
    let { hfrom, hto } = this.state;
    return (
      <React.Fragment>
        <Label>De</Label>
        <Input size="tiny" style={{ maxWidth: maxWidth / 5 }} value={hfrom} />
        <Label>à</Label>
        <Input size="tiny" style={{ maxWidth: maxWidth / 5 }} value={hto} />
        <Button size="tiny" icon="minus" circular={true} />
        <Button size="tiny" icon="add" circular={true} />
      </React.Fragment>
    );
  }
}

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

      const Plages = (
        <React.Fragment>
          <Form.Input
            label="Durée par défaut d'un RDV (en mn)"
            style={{ maxWidth: maxWidth / 5 }}
            placeholder="Durée par défaut"
            value={options.plages.duree}
            onChange={(e, d) => {
              plannings[index].optionsJO.plages.duree = d.value;
              this.setState({ plannings: plannings });
            }}
          />
          <Accordion>
            <Accordion.Title>Dimanche</Accordion.Title>
            <Accordion.Content />
          </Accordion>
          <Accordion>
            <Accordion.Title>Lundi</Accordion.Title>
            <Accordion.Content active={true}>
              <FromTo hfrom="09:00" hto="12:00" />
              <br />
              <FromTo hfrom="14:00" hto="19:00" />
            </Accordion.Content>
          </Accordion>
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
            <Button secondary={true} onClick={this.defaults}>
              Valeurs par défaut
            </Button>
            <Button negative={true}>Supprimer</Button>
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
