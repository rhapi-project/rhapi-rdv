import React from "react";
import { Form } from "semantic-ui-react";
import { Shared } from "rhapi-ui-react";
import _ from "lodash";
import moment from "moment";

export default class SmsPeriodeSelection extends React.Component {
  state = {
    currentValue: null,
    openDateRange: false
  };

  componentDidMount() {
    // par défaut TODAY
    this.setState({ currentValue: "TODAY" });
    this.props.onPeriodeChange(moment().startOf("day"), moment().endOf("day"));
  }

  handleChangePeriode = option => {
    this.setState({ currentValue: option });
    switch (option) {
      case "TODAY":
        this.props.onPeriodeChange(
          moment().startOf("day"),
          moment().endOf("day")
        );
        break;
      case "TOMORROW":
        this.props.onPeriodeChange(
          moment()
            .add(1, "days")
            .startOf("day"),
          moment()
            .add(1, "days")
            .endOf("day")
        );
        break;
      case "NEXTWEEK":
        this.props.onPeriodeChange(
          moment()
            .add(1, "weeks")
            .startOf("week"),
          moment()
            .add(1, "weeks")
            .endOf("week")
        );
        break;
      case "NEXTMONTH":
        this.props.onPeriodeChange(
          moment()
            .add(1, "months")
            .startOf("month"),
          moment()
            .add(1, "months")
            .endOf("month")
        );
        break;
      case "CUSTOMPERIODE":
        this.setState({ openDateRange: true });
        break;
      default:
        break;
    }
  };

  render() {
    let periodeOptions = [
      {
        text: "Rendez-vous d'aujourd'hui",
        value: "TODAY"
      },
      {
        text: "Rendez-vous de demain",
        value: "TOMORROW"
      },
      {
        text: "Rendez-vous de la semaine prochaine",
        value: "NEXTWEEK"
      },
      {
        text: "Rendez-vous du mois prochain",
        value: "NEXTMONTH"
      },
      {
        text: `
          Rendez-vous ${
            this.state.currentValue === "CUSTOMPERIODE" &&
            !_.isEmpty(this.props.periodeFrom) &&
            !_.isEmpty(this.props.periodeTo)
              ? `du ${moment(this.props.periodeFrom).format("DD/MM/YYYY")}
                au ${moment(this.props.periodeTo).format("DD/MM/YYYY")}`
              : "du ../../.... au ../../...."
          }
        `,
        value: "CUSTOMPERIODE"
      }
    ];
    return (
      <React.Fragment>
        <Form.Dropdown
          selection={true}
          fluid={true}
          options={periodeOptions}
          value={this.state.currentValue}
          onChange={(e, d) => this.handleChangePeriode(d.value)}
        />
        <Shared.DateRange
          open={this.state.openDateRange}
          startAt={
            _.isEmpty(this.props.periodeFrom)
              ? undefined
              : this.props.periodeFrom.toISOString(true)
          }
          endAt={
            _.isEmpty(this.props.periodeTo)
              ? undefined
              : this.props.periodeTo.toISOString(true)
          }
          onRangeChange={(startAt, endAt) => {
            if (startAt && endAt) {
              this.props.onPeriodeChange(moment(startAt), moment(endAt));
            }
          }}
          onClose={() => this.setState({ openDateRange: false })}
        />
      </React.Fragment>
    );
  }
}
