import React from "react";

import { Button, List, Divider } from "semantic-ui-react";

import _ from "lodash";

// Cet Component doit pouvoir être partagé entre MesRdv et PriseRdv => une prop/callback 'validation'
export default class HorairesDisponibles extends React.Component {
  state = {
    jours: [],
    joursIndex: -1,
    maxHoraires: 4
  };

  componentWillMount() {
    if (this.props.planningId > 0) {
      this.loadNext(this.props);
    }
  }

  componentWillReceiveProps(next) {
    if (next.motifId !== this.props.motifId) {
      this.loadNext(next, true);
    }
  }

  loadNext = (next, reset) => {
    let params = { ...next.patient };
    let index = reset ? -1 : this.state.joursIndex;
    if (index >= 0) {
      params.from = this.state.jours[index].informations.next;
    }
    params.planning = next.planningId;
    params.motif = next.motifId;
    next.client.Reservation.readAll(
      params,
      result => {
        let jours = reset ? [] : this.state.jours;
        let maxHoraires = reset ? 4 : this.state.maxHoraires;
        jours.push(result);
        let index = jours.length - 1;
        this.setState({ jours: jours, joursIndex: index, maxHoraires: maxHoraires });
      },
      datas => {
        // erreur
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  };

  first = () => {};

  next = () => {
    let index = this.state.joursIndex;
    if (index < this.state.jours.length - 1) {
      this.setState({ joursIndex: index + 1 });
    } else {
      this.loadNext(this.props);
    }
  };

  prev = () => {
    let index = this.state.joursIndex;
    if (index > 0) {
      this.setState({ joursIndex: index - 1 });
    }
  };

  more = () => {
    this.setState({ maxHoraires: this.state.maxHoraires + 4 });
  };

  validation = (e, d) => {
    // TODO modal de confirmation ?
    this.props.validation(d.value);
  };

  render() {
    if (this.state.joursIndex < 0) {
      return "";
    }
    const horaires = _.slice(
      this.state.jours[this.state.joursIndex].results,
      0,
      this.state.maxHoraires
    );
    const messageDuJour = this.state.jours[this.state.joursIndex].informations
      .message;
    return (
      <React.Fragment>
        <Button.Group fluid={true}>
          <Button
            icon="left chevron"
            onClick={this.prev}
            style={{ maxWidth: "40px" }}
          />
          <Button content={messageDuJour} />
          <Button
            icon="right chevron"
            onClick={this.next}
            style={{ maxWidth: "40px" }}
          />
        </Button.Group>
        <List
          divided={true}
          selection={true}
          items={_.map(horaires, (horaire, i) => {
            return {
              key: i,
              header: horaire.split("T")[1].substr(0, 5),
              value: horaire
            };
          })}
          onItemClick={(e, d) => this.validation(e, d)}
        />
        <Button onClick={() => this.more()} fluid={true} secondary={true}>
          Plus d'horaires
        </Button>
        <Divider fitted={true} />
      </React.Fragment>
    );
  }
}
