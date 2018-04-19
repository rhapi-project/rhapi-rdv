import React from "react";
import { Accordion, Button, Checkbox } from "semantic-ui-react";
import _ from "lodash";

import FromToList from "./FromToList";

class HorairesJour extends React.Component {
  componentWillReceiveProps(next) {
    this.setState({ horaires: next.horaires });
  }

  render() {
    if (!this.state) {
      return "";
    }

    let horaires = this.state.horaires;
    let isAllDay = horaires.length > 0 && horaires[0].allday;

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
          <Accordion.Content>
            {_.isUndefined(this.props.allday) ? (
              ""
            ) : (
              <Checkbox
                label="Toute la journée"
                toggle={true}
                checked={isAllDay}
                onChange={(e, d) => {
                  let horaires = this.state.horaires;
                  if (d.checked) {
                    horaires.unshift({ allday: true });
                  } else {
                    if (isAllDay) {
                      horaires.splice(0, 1);
                    }
                  }
                  this.props.onHorairesChange();
                }}
              />
            )}
            {isAllDay ? (
              ""
            ) : (
              <FromToList
                horaires={this.props.horaires}
                onChange={this.props.onHorairesChange}
              />
            )}
          </Accordion.Content>
        </Accordion.Content>
      </React.Fragment>
    );
  }
}

export default class HorairesSemaine extends React.Component {
  componentWillMount() {
    this.setState({ indexHoraires: -1 });
  }

  componentWillReceiveProps(next) {
    this.setState({
      /*horaires: next.horaires*/
    });
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
      <Accordion>
        <Button
          content="Saisir les plages horaires sur l'agenda d'une semaine type"
          icon="calendar"
          onClick={() =>
            alert(
              "En cours de réalisation : affichage des plages sur un fc en mode semaine."
            )
          }
        />
        {_.map(this.props.horaires, (horairesJour, i) => {
          return (
            <HorairesJour
              horaires={horairesJour}
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
              allday={this.props.allday}
            />
          );
        })}
      </Accordion>
    );
  }
}
