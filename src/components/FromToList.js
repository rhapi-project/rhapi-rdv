import React from "react";

import { Button, List } from "semantic-ui-react";

import TimeField from "react-simple-timefield";

import { maxWidth } from "./Settings";

import _ from "lodash";

class FromTo extends React.Component {
  state = {
    hfrom: null,
    hto: null
  };

  componentDidMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hfrom !== state.hfrom || props.hto !== state.hto) {
      return {
        hfrom: props.hfrom,
        hto: props.hto
      };
    }
    return null;
  }

  handleChange = (value, name) => {
    let { hfrom, hto } = this.state;

    if (name === "hfrom") {
      hfrom = value;
    }

    if (name === "hto") {
      hto = value;
    }
    this.props.handleChange(this.props.index, hfrom, hto);
  };

  render() {
    let { hfrom, hto } = this.state;
    if (_.isNull(hfrom) || _.isNull(hto)) {
      return null;
    } else {
      return (
        <div>
          De&nbsp;
          <TimeField
            value={hfrom} // {String}   required, format '00:00' or '00:00:00'
            onChange={(e, value) => this.handleChange(value, "hfrom")}
            input={<input type="text" />}
            //colon=":" // {String}   default: ":"
            //showSeconds={false} // {Boolean}  default: false
            style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
          />
          &nbsp;à&nbsp;
          <TimeField
            value={hto} // {String}   required, format '00:00' or '00:00:00'
            onChange={(e, value) => this.handleChange(value, "hto")}
            //input={<input type="text" />}
            //colon=":" // {String}   default: ":"
            //showSeconds={false} // {Boolean}  default: false
            style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
          />
          &nbsp;
          <Button
            style={{ marginTop: 7 }}
            size="tiny"
            icon="minus"
            circular={true}
            onClick={() => this.props.supprimer(this.props.index)}
          />
        </div>
      );
    }
  }
}

export default class FromToList extends React.Component {
  state = {
    horaires: []
  };

  componentDidMount() {
    this.setState({ horaires: this.props.horaires });
  }

  static getDerivedStateFromProps(props, state) {
    if (props.horaires !== state.horaires) {
      return { horaires: props.horaires };
    }
    return null;
  }

  ajouter = () => {
    let horaires = this.state.horaires;
    let start = horaires.length ? horaires[horaires.length - 1].end : "08:00";
    horaires.push({ start: start, end: start });
    //this.setState({ horaires: horaires });
    this.props.onChange();
  };

  supprimer = index => {
    let horaires = this.state.horaires;
    horaires.splice(index, 1);
    //this.setState({ horaires: horaires });
    this.props.onChange();
  };

  handleChange = (index, hfrom, hto) => {
    let horaires = this.state.horaires;
    horaires[index] = { start: hfrom, end: hto };
    //let horaires2 = _.sortBy(horaires, "start");
    //_.forEach(horaires2, (horaire, i) => horaires[i] = horaire);
    //this.setState({ horaires: horaires });
    this.props.onChange();
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
