import React from "react";
import { Button, List, Input, Label } from "semantic-ui-react";

import { maxWidth } from "./Settings";

import _ from "lodash";

class FromTo extends React.Component {
  componentWillMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  componentWillReceiveProps(next) {
    this.setState({ hfrom: next.hfrom, hto: next.hto });
  }

  convertHourToMinutes = stringToTest => {
    const tableTime = stringToTest.split(/:/);
    var heures = 1 * tableTime[0];
    var minutes = 1 * tableTime[1];
    var heureEnMinutes = 60 * heures;
    return heureEnMinutes + minutes;
  };

  handleChange = (event, d) => {
    let { hfrom, hto } = this.state;

    if (d.name === "hfrom") {
      hfrom = d.value;
      if (this.convertHourToMinutes(hfrom) < this.convertHourToMinutes(hto)) {
        this.setState({ hfrom: hfrom });
        this.props.handleChange(this.props.index, hfrom, hto);
      } else {
        this.forceUpdate();
      }
    }

    if (d.name === "hto") {
      hto = d.value;
      if (this.convertHourToMinutes(hto) > this.convertHourToMinutes(hfrom)) {
        this.setState({ hto: hto });
        this.props.handleChange(this.props.index, hfrom, hto);
      } else {
        this.forceUpdate();
      }
    }
  };

  render() {
    let { hfrom, hto } = this.state;
    return (
      <React.Fragment>
        <Label>De</Label>
        <Input
          size="tiny"
          type="time"
          style={{ maxWidth: maxWidth / 4 }}
          name="hfrom"
          value={hfrom}
          onChange={this.handleChange}
        />
        <Label>à</Label>
        <Input
          size="tiny"
          type="time"
          style={{ maxWidth: maxWidth / 4 }}
          name="hto"
          value={hto}
          onChange={this.handleChange}
        />
        <Button
          size="tiny"
          icon="minus"
          circular={true}
          onClick={() => this.props.supprimer(this.props.index)}
        />
        <br />
      </React.Fragment>
    );
  }
}

export default class FromToList extends React.Component {
  componentWillMount() {
    this.setState({ horaires: this.props.horaires });
  }

  componentWillReceiveProps(next) {
    this.setState({ horaires: next.horaires });
  }

  ajouter = () => {
    let horaires = this.state.horaires;
    let start = horaires.length ? horaires[horaires.length - 1].end : "08:00";
    let table = start.split(/:/);
    //Ajoute +1h au start et +2 au end, si c'est supérieur à 23 on recommence a 00, et si c'est inférieur à 10 on concatene un 0
    start = [
      1 + Number(table[0]) > 23
        ? "00"
        : 1 + Number(table[0]) < 10
          ? "0" + (1 + Number(table[0]))
          : 1 + Number(table[0]),
      table[1]
    ];
    let end = [
      2 + Number(table[0]) > 23
        ? "00"
        : 2 + Number(table[0]) < 10
          ? "0" + (2 + Number(table[0]))
          : 2 + Number(table[0]),
      table[1]
    ];
    horaires.push({ start: start.join(":"), end: end.join(":") });
    this.setState({ horaires: horaires });
    this.props.onChange(horaires);
  };

  supprimer = index => {
    let horaires = this.state.horaires;
    horaires.splice(index, 1);
    this.setState({ horaires: horaires });
    this.props.onChange(horaires);
  };

  handleChange = (index, hfrom, hto) => {
    let horaires = this.state.horaires;
    horaires[index] = { start: hfrom, end: hto };
    horaires = _.sortBy(horaires, "start");
    this.setState({ horaires: horaires });
    this.props.onChange(horaires);
  };

  render() {
    return (
      <React.Fragment>
        <List>
          {_.map(this.state.horaires, (horaire, i) => {
            return (
              <FromTo
                hfrom={horaire.start}
                hto={horaire.end}
                key={i}
                index={i}
                handleChange={this.handleChange}
                supprimer={this.supprimer}
              />
            );
          })}
        </List>
        <Button size="tiny" icon="add" circular={true} onClick={this.ajouter} />
      </React.Fragment>
    );
  }
}
