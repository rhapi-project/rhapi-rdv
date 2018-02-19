import React from "react";
import { Button } from "semantic-ui-react";
import _ from "lodash";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

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
  withPortal: false,
  withFullScreenPortal: false,
  initialVisibleMonth: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDates: false,
  isRTL: false,

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
      end: start.add(7, "days").format("YYYY-MM-DD")
    });
    this.setState({ plagesConges: plagesConges });
    this.props.onChange(plagesConges);
  };

  supprimer = index => {
    let plagesConges = this.state.plagesConges;
    plagesConges.splice(index, 1);
    this.setState({ plagesConges: plagesConges });
    this.props.onChange(plagesConges);
  };

  onPeriodeChange = (index, start, end) => {
    let plagesConges = this.state.plagesConges;
    plagesConges[index] = { start: start, end: end };
    let plagesConges2 = _.sortBy(plagesConges, ["start", "end"]);
    let clearFocus = !_.isEqual(plagesConges, plagesConges2); // order change ? => clear picker focus
    this.setState({ plagesConges: plagesConges2, clearFocus: clearFocus });
    this.props.onChange(plagesConges);
  };

  render() {
    return (
      <React.Fragment>
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
              <Button
                size="tiny"
                icon="minus"
                circular={true}
                onClick={() => this.supprimer(i)}
              />
              <br />
            </React.Fragment>
          );
        })}
        <Button size="tiny" icon="add" circular={true} onClick={this.ajouter} />
      </React.Fragment>
    );
  }
}
