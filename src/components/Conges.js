import React from "react";
import { Button } from "semantic-ui-react";
import _ from "lodash";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";
import { SingleDatePicker, DateRangePicker } from "react-dates";
import moment from "moment";

class Periode extends React.Component {
  componentWillMount() {
    this.setState({ startDate: this.props.start, endDate: this.props.end });
  }

  render() {
    return (
      <React.Fragment>
        <DateRangePicker
          startDate={this.state.startDate}
          startDateId={"start" + this.props.index}
          endDate={this.state.endDate}
          endDateId={"end" + this.props.index}
          onDatesChange={({ startDate, endDate }) => {
            console.log(startDate);
            console.log(endDate);
            this.setState({ startDate, endDate });
          }}
          // PropTypes.func.isRequired,
          //focusedInput={this.START_DATE} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
          onFocusChange={focusedInput => {
            console.log(focusedInput);
            this.setState({ focusedInput });
          }} // PropTypes.func.isRequired,
        />
        <Button
          size="tiny"
          icon="minus"
          circular={true}
          onClick={() => this.props.supprimer()}
        />
        <br />
      </React.Fragment>
    );
  }
}

export default class Conges extends React.Component {
  componentWillMount() {
    this.setState({ plagesConges: this.props.plagesConges });
  }

  ajouter = () => {
    let plagesConges = this.state.plagesConges;
    plagesConges.push({
      start: moment(plagesConges[plagesConges.length - 1].start).add(7, "days"),
      end: moment(plagesConges[plagesConges.length - 1].end).add(14, "days")
    });
    this.setState({ plagesConges: plagesConges });
  };

  supprimer = index => {
    let plagesConges = this.state.plagesConges;
    plagesConges.splice(index - 1, 1);
    this.setState({ plagesConges: plagesConges });
    //this.props.onChange(horaires);
  };

  render() {
    return (
      <React.Fragment>
        Juste pour tester : le SingleDatePicker fonctionne
        <SingleDatePicker
          date={this.state.date} // momentPropTypes.momentObj or null
          onDateChange={date => this.setState({ date })} // PropTypes.func.isRequired
          focused={this.state.focused} // PropTypes.bool
          onFocusChange={({ focused }) => this.setState({ focused })} // PropTypes.func.isRequired
        />
        <br />Par contre avec DateRangePicker les calendriers ne sont pas
        ouverts (à corriger)<br />
        {_.map(this.props.plagesConges, (plageConges, i) => {
          return (
            <Periode
              start={moment(plageConges.start)}
              end={moment(plageConges.end)}
              index={i}
              key={i}
              supprimer={() => this.supprimer(i)}
            />
          );
        })}
        <Button size="tiny" icon="add" circular={true} onClick={this.ajouter} />
      </React.Fragment>
    );
  }
}
