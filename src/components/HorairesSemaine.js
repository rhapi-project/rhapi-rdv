import React from "react";
import { Accordion } from "semantic-ui-react";
import _ from "lodash";

import FromToList from "./FromToList";

class HorairesJour extends React.Component {
  componentWillReceiveProps(next) {
    this.setState({ horaires: next.horaires });
  }

  render() {
    return (
      <React.Fragment>
        <Accordion.Title
          active={this.props.indexHoraires === this.props.accordeonIndex}
          index={this.props.accordeonIndex}
          onClick={this.props.activeHandle}
        >
          {this.props.day}
        </Accordion.Title>
        <Accordion.Content
          active={this.props.indexHoraires === this.props.accordeonIndex}
        >
          <FromToList
            horaires={this.props.horaires[this.props.accordeonIndex]}
            onChange={this.props.onHorairesChange}
          />
        </Accordion.Content>
      </React.Fragment>
    );
  }
}

export default class HorairesSemaine extends React.Component {
  componentWillMount() {
    this.setState({ indexHoraires: -1 });
  }

  render() {
    const days = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi"
    ];
    return (
      <React.Fragment>
        <Accordion.Accordion>
          {_.map(this.props.horaires, (horaireJour, i) => {
            return (
              <HorairesJour
                horaires={this.props.horaires}
                onHorairesChange={this.props.onHorairesChange}
                activeHandle={(e, d) =>
                  this.setState({
                    indexHoraires:
                      d.index === this.state.indexHoraires ? -1 : d.index
                  })
                }
                indexHoraires={this.state.indexHoraires}
                accordeonIndex={i}
                key={i}
                day={days[i]}
              />
            );
          })}
        </Accordion.Accordion>
      </React.Fragment>
    );
  }
}
