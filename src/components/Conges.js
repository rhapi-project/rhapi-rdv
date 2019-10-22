import React from "react";

import { Button, Input, List } from "semantic-ui-react";

import _ from "lodash";

import momentPropTypes from "react-moment-proptypes";

import moment from "moment";

import DayPickerInput from "react-day-picker/DayPickerInput";
import "react-day-picker/lib/style.css";

import MomentLocaleUtils, {
  formatDate,
  parseDate
} from "react-day-picker/moment";

// NOTE : reprend la méthode utilisée dans l'exemple du REACT-DAY-PICKER
// http://react-day-picker.js.org/examples/input-from-to

const propTypes = {
  initialStartDate: momentPropTypes.momentObj,
  initialEndDate: momentPropTypes.momentObj
};

const defaultProps = {
  // props for rhapi-rdv Periode
  initialStartDate: undefined,
  initialEndDate: undefined
};

export class Periode extends React.Component {
  // méthode utilisée dans l'exemple du REACT-DAY-PICKER
  // http://react-day-picker.js.org/examples/input-from-to

  state = {
    from: null,
    to: null
  };

  componentDidMount() {
    this.setState({
      from: this.props.initialStartDate,
      to: this.props.initialEndDate
    });
  }

  static getDerivedStateFromProps(props, state) {
    if (
      props.initialStartDate !== state.from ||
      props.initialEndDate !== state.to
    ) {
      return {
        from: props.initialStartDate,
        to: props.initialEndDate
      };
    }
    return null;
  }

  handleFromChange(from) {
    if (!from) {
      return;
    }
    this.setState({ from: moment(from) });
    // moments to ISO Dates (onPeriodeChange accepts ISO Dates Strings only)
    if (from && this.state.to) {
      this.props.onPeriodeChange(
        moment(from).format("YYYY-MM-DD"),
        this.state.to.format("YYYY-MM-DD")
      );
    }
  }

  handleToChange(to) {
    if (!to) {
      return;
    }
    this.setState({ to: moment(to) });
    if (this.state.from && to) {
      this.props.onPeriodeChange(
        this.state.from.format("YYYY-MM-DD"),
        moment(to).format("YYYY-MM-DD")
      );
    }
  }

  render() {
    if (_.isNull(this.state.from) || _.isNull(this.state.to)) {
      return null;
    } else {
      const from = this.state.from.toDate();
      const to = this.state.to.toDate();
      const modifiers = { start: from, end: to };
      return (
        <div className="InputFromTo" style={{ display: "flex" }}>
          <div>
            <DayPickerInput
              dayPickerProps={{
                locale: "fr",
                localeUtils: MomentLocaleUtils,
                selectedDays: [from, { from, to }],
                disabledDays: { after: to },
                toMonth: to,
                modifiers,
                numberOfMonths: 1
              }}
              format="L"
              formatDate={formatDate}
              onDayChange={day => this.handleFromChange(day)}
              parseDate={parseDate}
              placeholder="Date de début"
              value={from}
            />
          </div>
          <div style={{ paddingTop: "10px" }}> &nbsp; - &nbsp; </div>
          <span className="InputFromTo-to">
            <DayPickerInput
              dayPickerProps={{
                locale: "fr",
                localeUtils: MomentLocaleUtils,
                selectedDays: [from, { from, to }],
                disabledDays: { before: from },
                modifiers,
                month: from,
                fromMonth: from,
                numberOfMonths: 1
              }}
              format="L"
              formatDate={formatDate}
              onDayChange={day => this.handleToChange(day)}
              parseDate={parseDate}
              placeholder="Date de fin"
              value={to}
            />
          </span>
        </div>
      );
    }
  }
}

Periode.propTypes = propTypes;
Periode.defaultProps = defaultProps;

export default class Conges extends React.Component {
  state = {
    plagesConges: [],
    clearFocus: false
  };

  componentDidMount() {
    this.setState({ plagesConges: this.props.plagesConges });
  }

  static getDerivedStateFromProps(props, state) {
    if (props.plagesConges !== state.plagesConges) {
      return {
        plagesConges: propTypes.plagesConges,
        clearFocus: false
      };
    }
    return null;
  }

  ajouter = () => {
    let plagesConges = this.state.plagesConges;
    let start = moment(); // Today moment
    if (plagesConges.length) {
      start = moment(plagesConges[plagesConges.length - 1].start).add(
        7,
        "days"
      );
    }
    plagesConges.push({
      // plageConges sont des ISO Dates Strings
      start: start.format("YYYY-MM-DD"),
      end: start.add(7, "days").format("YYYY-MM-DD"),
      titre: ""
    });
    //this.setState({ plagesConges: plagesConges, saved: false });
    this.props.onChange();
  };

  supprimer = index => {
    let plagesConges = this.state.plagesConges;
    plagesConges.splice(index, 1);
    //this.setState({ plagesConges: plagesConges });
    this.props.onChange();
  };

  onPeriodeChange = (index, start, end) => {
    let plagesConges = this.state.plagesConges;
    plagesConges[index].start = start;
    plagesConges[index].end = end;
    //let plagesConges2 = _.sortBy(plagesConges, ["start", "end"]);
    //let clearFocus = !_.isEqual(plagesConges, plagesConges2); // order change ? => clear picker focus
    //this.setState({ plagesConges: plagesConges/*, clearFocus: clearFocus*/ });
    this.props.onChange();
  };

  onTitreChange = (index, titre) => {
    let plagesConges = this.state.plagesConges;
    plagesConges[index].titre = titre;
    //this.setState({ plagesConges: plagesConges });
    this.props.onChange();
  };

  render() {
    return (
      <React.Fragment>
        <List>
          {_.map(this.state.plagesConges, (plageConges, i) => {
            return (
              <List.Item key={i} style={{ display: "flex" }}>
                <Periode
                  initialStartDate={moment(plageConges.start)}
                  initialEndDate={moment(plageConges.end)}
                  key={i}
                  clearFocus={this.state.clearFocus}
                  onPeriodeChange={(start, end) =>
                    this.onPeriodeChange(i, start, end)
                  }
                />
                <div style={{ paddingLeft: "5px" }}>
                  <span>Intitulé : </span>
                  <Input
                    placeholder="Intitulé de la période"
                    value={plageConges.titre}
                    onChange={(e, d) => this.onTitreChange(i, d.value)}
                  />
                </div>
                <div style={{ paddingLeft: "5px", paddingTop: "5px" }}>
                  <Button
                    size="tiny"
                    icon="minus"
                    circular={true}
                    onClick={() => this.supprimer(i)}
                  />
                </div>
              </List.Item>
            );
          })}
        </List>
        <Button size="tiny" icon="add" circular={true} onClick={this.ajouter} />
      </React.Fragment>
    );
  }
}
