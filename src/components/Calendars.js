//CSS
import "../css/fullcalendar.css";
//import from "fullcalendar/dist/fullcalendar.ccs

// fullcalendar locale
import "fullcalendar/dist/locale/fr";

//import _ from 'lodash'
import React from "react";

import _ from "lodash";

import {
  Button,
  Form,
  Grid,
  Header,
  Message,
  Segment,
  Divider,
  Card,
  Icon,
  Dropdown
} from "semantic-ui-react";

import CalendarModalRdv from "./CalendarModalRdv";

import { maxWidth, hsize, fsize } from "./Settings";

import fullCalendar from "fullcalendar";

import $ from "jquery";

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
        this.setState({ plannings: result.results });
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
        <Dropdown
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
        <External client={this.props.client} />
        <Calendar
          client={this.props.client}
          planning={
            this.state.index < 0
              ? "0"
              : this.state.plannings[this.state.index].id
          }
        />
      </React.Fragment>
    );
  }
}

class Calendar extends React.Component {
  state = { modalRdvIsOpen: false, eventToEdit: {}, dateClicked: "" };

  componentDidMount() {
    const client = this.props.client;
    $("#calendar").fullCalendar({
      locale: "fr",
      defaultView: "agendaWeek", // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,

      events: (start, end, timezone, callback) => {
        console.log(planningId);
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
    /*
    $("#calendar").fullCalendar({
      locale: "fr",
      defaultView: "agendaWeek", // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,
      header: {
        left: "prev,next today",
        center: "title",
        right: "month,agendaWeek,agendaDay"
      },
      editable: true,
      droppable: true, // this allows things to be dropped onto the calendar
      drop: function() {
        // is the "remove after drop" checkbox checked?
        if ($("#drop-remove").is(":checked")) {
          // if so, remove the element from the "Draggable Events" list
          $(this).remove();
        }
      }
    });
    */
  }

  componentWillReceiveProps(props) {
    planningId = props.planning;
    $("#calendar").fullCalendar("refetchEvents");
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

class External extends React.Component {
  render() {
    return "";

    return (
      <div id="external-events">
        <h4>Draggable Events</h4>
        <div className="fc-event">My Event 1</div>
        <div className="fc-event">My Event 2</div>
        <div className="fc-event">My Event 3</div>
        <div className="fc-event">My Event 4</div>
        <div className="fc-event">My Event 5</div>
        <p>
          <input type="checkbox" id="drop-remove" />
          <label for="drop-remove">remove after drop</label>
        </p>
      </div>
    );
  }
  componentDidMount() {
    $("#external-events .fc-event").each(function() {
      // store data so the calendar knows to render an event upon drop
      $(this).data("event", {
        title: $.trim($(this).text()), // use the element's text as the event title
        stick: true // maintain when user navigates (see docs on the renderEvent method)
      });

      // make the event draggable using jQuery UI
      $(this).draggable({
        zIndex: 999,
        revert: true, // will cause the event to go back to its
        revertDuration: 0 //  original position after the drag
      });
    });
  }
}
