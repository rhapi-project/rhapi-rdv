import React from "react";
import { Button, Input, List, Label } from "semantic-ui-react";
import _ from "lodash";

import PropTypes from "prop-types";

import momentPropTypes from "react-moment-proptypes";

import moment from "moment";

import {
  DateRangePicker,
  DateRangePickerPhrases,
  DateRangePickerShape
} from "react-dates";

import {
  START_DATE,
  END_DATE,
  HORIZONTAL_ORIENTATION,
  ANCHOR_LEFT
} from "react-dates/constants";

import isInclusivelyAfterDay from "react-dates/src/utils/isInclusivelyAfterDay";

// Note importante :
// rhapi-rdv Periode reprend le fonctionnement du airbnb DateRangePickerWrapper
// https://github.com/airbnb/react-dates/blob/master/examples/DateRangePickerWrapper.jsx

const propTypes = {
  //  props for rhapi-rdv Periode
  autoFocus: PropTypes.bool,
  autoFocusEndDate: PropTypes.bool,
  initialStartDate: momentPropTypes.momentObj,
  initialEndDate: momentPropTypes.momentObj,

  ..._.omit(DateRangePickerShape, [
    "startDate",
    "endDate",
    "onDatesChange",
    "focusedInput",
    "onFocusChange"
  ])
};

const defaultProps = {
  // props for rhapi-rdv Periode
  autoFocus: false,
  autoFocusEndDate: false,
  initialStartDate: null,
  initialEndDate: null,

  // input related props
  startDateId: START_DATE,
  startDatePlaceholderText: "Date de début",
  endDateId: END_DATE,
  endDatePlaceholderText: "Date de fin",
  disabled: false,
  required: false,
  screenReaderInputMessage: "",
  showClearDates: false,
  showDefaultInputIcon: false,
  customInputIcon: null,
  customArrowIcon: null,
  customCloseIcon: null,
  block: false,
  small: false,
  regular: false,

  // calendar presentation and interaction related props
  renderMonth: null,
  orientation: HORIZONTAL_ORIENTATION,
  anchorDirection: ANCHOR_LEFT,
  horizontalMargin: 0,
  daySize: 70,
  withPortal: true,
  withFullScreenPortal: false,
  initialVisibleMonth: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDates: false,
  isRTL: false,
  hideKeyboardShortcutsPanel: true,

  // navigation related props
  navPrev: null,
  navNext: null,
  onPrevMonthClick() {},
  onNextMonthClick() {},
  onClose() {},

  // day presentation and interaction related props
  renderCalendarDay: undefined,
  renderDayContents: null,
  minimumNights: 1,
  enableOutsideDays: false,
  isDayBlocked: () => false,
  isOutsideRange: day => !isInclusivelyAfterDay(day, moment()),
  isDayHighlighted: () => false,

  // internationalization
  displayFormat: () => moment.localeData().longDateFormat("L"),
  monthFormat: "MMMM YYYY",
  phrases: DateRangePickerPhrases
};

class Periode extends React.Component {
  constructor(props) {
    super(props);

    let focusedInput = null;
    if (props.autoFocus) {
      focusedInput = START_DATE;
    } else if (props.autoFocusEndDate) {
      focusedInput = END_DATE;
    }

    this.state = {
      focusedInput,
      startDate: props.initialStartDate,
      endDate: props.initialEndDate
    };
  }

  componentWillReceiveProps(next) {
    this.setState({});
    if (next.clearFocus) {
      this.setState({
        startDate: next.initialStartDate,
        endDate: next.initialEndDate,
        focusedInput: null // after plages sort if order change
      });
    } else {
      this.setState({
        startDate: next.initialStartDate,
        endDate: next.initialEndDate
      });
    }
  }

  componentDidUpdate() {
    this.reactDateStyleHack();
  }

  reactDateStyleHack = () => {
    // Style hack for react-date
    setTimeout(() => {
      _.forEach(
        document.getElementsByClassName("CalendarMonth_caption"),
        elt => (elt.style.paddingBottom = "47px")
      );
    }, 0);
  };

  onDatesChange = ({ startDate, endDate }) => {
    // may be null on range error (endDate < startDate)
    if (_.isNull(startDate) || _.isNull(endDate)) {
      return;
    }
    this.setState({ startDate, endDate });
    // moments to ISO Dates (onPeriodeChange accepts ISO Dates Strings only)
    if (!_.isNull(startDate) && !_.isNull(endDate)) {
      this.props.onPeriodeChange(
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD")
      );
    }
  };

  onFocusChange = focusedInput => {
    this.setState({ focusedInput });
  };

  render() {
    const { focusedInput, startDate, endDate } = this.state;

    // autoFocus, autoFocusEndDate, initialStartDate and initialEndDate are helper props for the
    // example wrapper but are not props on the SingleDatePicker itself and
    // thus, have to be omitted.
    const props = _.omit(this.props, [
      "autoFocus",
      "autoFocusEndDate",
      "initialStartDate",
      "initialEndDate",
      "onPeriodeChange", // onPeriodeChange is a rhapi-rdv defined prop
      "clearFocus" // clearFocus is a rhapi-rdv defined prop
    ]);

    return (
      <DateRangePicker
        {...props}
        onDatesChange={this.onDatesChange}
        onFocusChange={this.onFocusChange}
        onNextMonthClick={this.reactDateStyleHack}
        onPrevMonthClick={this.reactDateStyleHack}
        focusedInput={focusedInput}
        startDate={startDate}
        endDate={endDate}
      />
    );
  }
}

Periode.propTypes = propTypes;
Periode.defaultProps = defaultProps;

export default class Conges extends React.Component {
  componentWillMount() {
    this.setState({ plagesConges: this.props.plagesConges, clearFocus: false });
  }

  componentWillReceiveProps(next) {
    this.setState({ plagesConges: next.plagesConges, clearFocus: false });
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
              <React.Fragment key={i}>
                <Periode
                  initialStartDate={moment(plageConges.start)}
                  initialEndDate={moment(plageConges.end)}
                  key={i}
                  clearFocus={this.state.clearFocus}
                  onPeriodeChange={(start, end) =>
                    this.onPeriodeChange(i, start, end)
                  }
                />
                <Label size="large" style={{ verticalAlign: "bottom" }}>
                  Intitulé :{" "}
                </Label>
                <Input
                  type="text"
                  placeholder="Intitulé de la période"
                  value={plageConges.titre}
                  onChange={(e, d) => this.onTitreChange(i, d.value)}
                />
                <Button
                  style={{ verticalAlign: "bottom" }}
                  size="tiny"
                  icon="minus"
                  circular={true}
                  onClick={() => this.supprimer(i)}
                />
                <br />
              </React.Fragment>
            );
          })}
        </List>
        <Button size="tiny" icon="add" circular={true} onClick={this.ajouter} />
      </React.Fragment>
    );
  }
}
