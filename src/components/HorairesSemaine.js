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
          active={this.props.activeIndex === this.props.accordeonIndex}
          index={this.props.accordeonIndex}
          onClick={this.props.activeHandle}
        >
          {this.props.day}
        </Accordion.Title>
        <Accordion.Content
          active={this.props.activeIndex === this.props.accordeonIndex}
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
  state = {
    activeIndex: 0,
    horaires: this.props.horaires
  };

  componentWillReceiveProps(next) {
    this.setState({ horaires: next.horaires });
  }

  handleClick = (e, index) => {
    const indexToTest = index.index;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === indexToTest ? -1 : indexToTest;
    this.setState({ activeIndex: newIndex });
  };

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
        <Accordion>
          {_.map(this.state.horaires, (horaireJour, i) => {
            return (
              <HorairesJour
                horaires={this.props.horaires}
                onHorairesChange={this.props.onHorairesChange}
                activeHandle={this.handleClick}
                activeIndex={this.state.activeIndex}
                accordeonIndex={i}
                key={i}
                day={days[i]}
              />
            );
          })}
        </Accordion>
      </React.Fragment>
    );
  }
}
