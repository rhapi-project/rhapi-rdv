//CSS
import "../css/fullcalendar.css";
//import from "fullcalendar/dist/fullcalendar.ccs

// fullcalendar locale
import "fullcalendar/dist/locale/fr";

import "fullcalendar";

import _ from "lodash";

import $ from "jquery";
import draggable from "jquery-ui/ui/widgets/draggable";

import moment from "moment";

import React from "react";

import { Header, Divider, Button } from "semantic-ui-react";

import { PatientSearch } from "./CalendarModalRdv";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

import { DayPickerSingleDateController } from "react-dates";

var rhapiMd5 = "";

export default class CalendarPanel extends React.Component {
  componentWillMount() {
    this.setState({
      currentDate: moment(),
      currentPatient: { id: 0, title: "" },
      externalEventsDatas: []
    });
    this.reloadExternalEvents(this.props.planningId);
  }

  componentWillReceiveProps(next) {
    this.setState({
      externalEventsDatas: []
    });
    this.reloadExternalEvents(next.planningId);
  }

  componentDidMount() {
    this.componentDidUpdate();
  }
  componentDidUpdate() {
    $("#external-events .fc-event").each((i, event) => {
      // console.log(i, event);
      // store data so the calendar knows to render an event upon drop
      $(event).data("event", {
        // TODO idPatient etc...
        title: $.trim($(event).text()), // use the element's text as the event title
        stick: true, // maintain when user navigates (see docs on the renderEvent method)
        data: this.state.externalEventsDatas[i]
      });
      // jQuery UI : ui-widget(options, element);
      // make the event draggable using jQuery UI
      draggable(
        {
          zIndex: 999,
          revert: true, // will cause the event to go back to its
          revertDuration: 0 //  original position after the drag
        },
        event
      );
    });
  }

  onDateChange = date => {
    this.setState({ currentDate: date });
    $("#calendar").fullCalendar("gotoDate", date);
  };

  onPatientChange = (id, title) => {
    this.setState({ currentPatient: { id: id, title: title } });
  };

  reloadExternalEvents = planningId => {
    console.log("reloadExternalEvents " + planningId);

    var params = {
      from: "1970-01-01", // start est un 'moment' => voir doc fullCalendar
      to: "1970-01-02", // end est un 'moment' => voir doc fullCalendar
      md5: rhapiMd5,
      planning: planningId
    };

    this.props.client.RendezVous.actualiser(
      params,
      (datas, response) => {
        rhapiMd5 = datas.informations.md5;
        this.setState({ externalEventsDatas: datas.results });
      },
      (error, response) => {
        //console.log(response);
        if (response.statusCode === 304) {
          // no change
          //callback(rhapiEventsCache);
        }
      }
    );
  };

  addExternal = () => {
    // epoch 	date, timestamp 1970-01-01T00:00:00 (Unix system time zero)
    // les rendez-vous en attente ont un startAt à 1970-01-01
    // l'ordre est défini par les secondes :
    // 1970-01-01T00:00:00 => premier push
    // 1970-01-01T00:00:01
    // endAt n'est pas pris en compte (par défaut reprendra startAt);
    if (!this.state.currentPatient.id) {
      alert("Aucun patient n'est actuellement défini.");
      return;
    }
    console.log("add " + this.state.currentPatient.title);
    let { client, planningId } = this.props;
    var params = {
      startAt: "1970-01-01T00:00:01",
      endAt: "1970-01-01T00:00:01",
      idPlanningsJA: [planningId],
      idPatient: this.state.currentPatient.id,
      titre: this.state.currentPatient.title
    };

    client.RendezVous.create(
      params,
      (datas, response) => {
        this.reloadExternalEvents(planningId);
      },
      (error, response) => {
        //
      }
    );
  };

  render() {
    console.log(this.props.planningId);
    return (
      <React.Fragment>
        <Divider />
        <DayPickerSingleDateController
          hideKeyboardShortcutsPanel={true}
          onDateChange={this.onDateChange}
          focused={false}
          date={this.state.currentDate}
        />
        <Divider />
        <PatientSearch
          client={this.props.client}
          patientChange={this.onPatientChange}
        />
        <Divider />
        <div
          id="external-events"
          //style={{ minHeight: 600 }}
        >
          <Header size="medium">Liste d'attente</Header>
          <div style={{ textAlign: "right" }}>
            <Button icon="add" size="mini" onClick={this.addExternal} />
          </div>

          {_.map(this.state.externalEventsDatas, (data, i) => {
            return (
              <div key={i}>
                <Divider fitted={true} hidden={true} />
                <div className="fc-event">{data.titre}</div>
              </div>
            );
          })}
        </div>
      </React.Fragment>
    );
  }
}
