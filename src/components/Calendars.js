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

import { Dropdown, Grid, Header, Divider } from "semantic-ui-react";

import CalendarModalRdv from "./CalendarModalRdv";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

import { DayPickerSingleDateController } from "react-dates";

var rhapiMd5 = "";
var rhapiEventsCache = [];
var planningId = 0;

export default class Calendars extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1 });
    this.reload();
  }

  reload = () => {
    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        let index = result.results.length > 0 ? 0 : -1;
        this.setState({ plannings: result.results, index: index });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  onPlanningChange = (e, d) => {
    rhapiMd5 = "";
    rhapiEventsCache = [];
    this.setState({ index: d.value });
  };

  render() {
    return (
      <React.Fragment>
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={3}>
              <Dropdown
                value={this.state.index}
                onChange={this.onPlanningChange}
                placeholder="Choisir le(s) planning(s) à afficher"
                fluid={false}
                selection={true}
                multiple={false}
                options={_.map(this.state.plannings, (planning, i) => {
                  return {
                    text: planning.titre,
                    value: i
                  };
                })}
              />
              <CalendarLeftPanel client={this.props.client} />
            </Grid.Column>
            <Grid.Column width={13}>
              {this.state.index < 0 ? (
                ""
              ) : (
                <Calendar
                  client={this.props.client}
                  options={
                    this.state.index < 0
                      ? {}
                      : this.state.plannings[this.state.index].optionsJO
                  }
                  planning={
                    this.state.index < 0
                      ? "0"
                      : this.state.plannings[this.state.index].id
                  }
                />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  }
}

class Calendar extends React.Component {
  state = { modalRdvIsOpen: false, eventToEdit: {}, dateClicked: "" };

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    planningId = this.props.planning;
    const client = this.props.client;
    const options = this.props.options;

    let hiddenDays = [];
    let businessHours = [];
    let minTime = "08:30";
    let maxTime = "20:00";

    let duree = 30;
    const plages = options.plages;
    if (
      !_.isUndefined(plages) &&
      !_.isUndefined(plages.horaires) &&
      plages.horaires.length === 7
    ) {
      duree = _.isNumber(plages.duree) ? plages.duree : 30;

      let minT = "23:59";
      let maxT = "00:00";
      _.forEach(plages.horaires, (horaires, i) => {
        if (horaires.length === 0) {
          hiddenDays.push(i);
        }
        _.forEach(horaires, (horaire, j) => {
          if (horaire.start < minT) minT = horaire.start;
          if (horaire.end > maxT) maxT = horaire.end;
          businessHours.push({
            dow: [i],
            start: horaire.start,
            end: horaire.end
          });
        });
        // on affiche 2 * la durée d'un rdv avant et après
        minTime = moment(minT, "HH:mm")
          .subtract(2 * duree, "minutes")
          .format("HH:mm");
        maxTime = moment(maxT, "HH:mm")
          .add(2 * duree, "minutes")
          .format("HH:mm");
      });
    }
    // anything that the moment.duration constructor accepts
    let duration = { minutes: duree };

    $("#calendar").fullCalendar("destroy");
    $("#calendar").fullCalendar({
      locale: "fr",
      defaultView: "agendaWeek", // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,
      droppable: true,
      hiddenDays: hiddenDays,
      businessHours: businessHours,
      slotDuration: duration,
      minTime: minTime,
      maxTime: maxTime,

      header: {
        left: "prev,next today",
        center: "title",
        right: "month,agendaWeek,agendaDay"
      },

      events: (start, end, timezone, callback) => {
        var params = {
          from: start.toISOString(), // start est un 'moment' => voir doc fullCalendar
          to: end.toISOString(), // end est un 'moment' => voir doc fullCalendar
          md5: rhapiMd5,
          planning: planningId
        };

        var events = [];

        client.RendezVous.actualiser(
          params,
          (datas, response) => {
            rhapiMd5 = datas.informations.md5;
            for (var i = 0; i < datas.results.length; i++) {
              var result = datas.results[i];
              var event = {
                id: result.id,
                title: result.titre,
                start: result.startAt,
                end: result.endAt,
                color: result.couleur
                //...
              };
              events.push(event);
            }
            rhapiEventsCache = events;
            callback(events);
          },
          (error, response) => {
            //console.log(response);
            if (response.statusCode === 304) {
              callback(rhapiEventsCache);
            }
          }
        );
      },

      eventClick: (event, element) => {
        /*
        alert("click on " + event.title + "\ncolor is '" + event.color + "'");
        // TODO: edit and update :
        event.title += " (clicked)";

        var color = event.color;
        if (color === "red") {
          event.color = "";
        } else if (color === "") {
          event.color = "green";
        } else if (color === "green") {
          event.color = "orange";
        } else if (color === "orange") {
          event.color = "red";
        }

        client.RendezVous.update(
          event.id,
          { titre: event.title, couleur: event.color },
          (d, r) => {},
          (e, r) => {}
        );
        $("#calendar").fullCalendar("updateEvent", event);
         */
        this.setState({ modalRdvIsOpen: true, eventToEdit: event });
      },

      dayClick: (date, jsEvent, view) => {
        //alert('Clicked on: ' + date.format());
        this.setState({
          modalRdvIsOpen: true,
          eventToEdit: {},
          dateClicked: date.format()
        });

        //alert('Coordinates: ' + jsEvent.pageX + ',' + jsEvent.pageY);

        //alert('Current view: ' + view.name);
      },

      eventDrop: (event, delta, revertFunc, jsEvent, ui, view) => {
        var params = {
          startAt: event.start.toISOString(),
          endAt: event.end.toISOString()
        };
        client.RendezVous.update(event.id, params, (d, r) => {}, (e, r) => {});
      },

      drop: function(/*event*/) {
        //console.log(event);
        console.log($(this).data("event"));
        // remove the element from the "Draggable Events" list
        $(this).remove();
      },

      eventResize: (event, delta, revertFunc, jsEvent, ui, view) => {
        var params = {
          startAt: event.start.toISOString(),
          endAt: event.end.toISOString()
        };
        client.RendezVous.update(event.id, params, (d, r) => {}, (e, r) => {});
      }
    });

    setInterval(
      function() {
        $("#calendar").fullCalendar("refetchEvents");
      },
      30000 // actualiser toutes les 30 secondes (voir md5 et retour 304 / mise en cache avec rhapiEventsCache)
    );
  }

  render() {
    return (
      <React.Fragment>
        <div id="calendar" />
        <CalendarModalRdv
          open={this.state.modalRdvIsOpen}
          close={() => this.setState({ modalRdvIsOpen: false })}
          event={this.state.eventToEdit}
          date={this.state.dateClicked}
          client={this.props.client}
          planning={planningId}
        />
      </React.Fragment>
    );
  }
}

class CalendarLeftPanel extends React.Component {
  onDateChange = date => {
    $("#calendar").fullCalendar("gotoDate", date);
  };

  render() {
    return (
      <React.Fragment>
        <Divider />
        <div
          id="external-events"
          style={{ minHeight: $(window).height() - 450 }}
        >
          <Header size="medium">Liste d'attente</Header>
          <div className="fc-event">Patient 1</div>
          <Divider fitted={true} />
          <div className="fc-event">Patient 2</div>
          <Divider fitted={true} />
          <div className="fc-event">Patient 3</div>
          <Divider fitted={true} />
          <div className="fc-event">Patient 4</div>
          <Divider fitted={true} />
          <div className="fc-event">Patient 5</div>
          {/*
          <p>
            <input type="checkbox" id="drop-remove" />
            <label htmlFor="drop-remove">remove after drop</label>
          </p>
          */}
        </div>
        <DayPickerSingleDateController
          hideKeyboardShortcutsPanel={true}
          onDateChange={this.onDateChange}
          focused={false}
        />
      </React.Fragment>
    );
  }

  componentDidMount() {
    $("#external-events .fc-event").each((i, event) => {
      // console.log(i, event);
      // store data so the calendar knows to render an event upon drop

      $(event).data("event", {
        title: $.trim($(event).text()), // use the element's text as the event title
        stick: true // maintain when user navigates (see docs on the renderEvent method)
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
}
