// fullcalendar locale
import "fullcalendar/dist/locale/fr";

import "fullcalendar";

import _ from "lodash";

import $ from "jquery";

import moment from "moment";

import React from "react";

import CalendarModalRdv from "./CalendarModalRdv";

export default class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.rhapiMd5 = "";
    this.rhapiCache = [];
    this.state = {
      modalRdvIsOpen: false,
      eventToEdit: {},
      start: null,
      end: null
    };
  }

  componentDidMount() {
    this.intervalId = setInterval(
      function() {
        $("#calendar").fullCalendar("refetchEvents");
      },
      15000 // actualiser toutes les 15 secondes (voir md5 et retour 304)
    );

    this.componentDidUpdate();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !_.isUndefined(prevState) &&
      prevState.modalRdvIsOpen !== this.state.modalRdvIsOpen
    ) {
      // CalendarModalRdv open/close
      if (prevState.modalRdvIsOpen) {
        $("#calendar").fullCalendar("refetchEvents");
      }
      return;
    }

    const planningId = this.props.planning;
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
    let that = this; // that react component
    // anything that the moment.duration constructor accepts
    let duration = { minutes: duree };

    $("#calendar").fullCalendar("destroy");
    $("#calendar").fullCalendar({
      locale: "fr",
      defaultView: "agendaWeek", // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,
      droppable: true,
      selectable: true,
      hiddenDays: hiddenDays,
      businessHours: businessHours,
      slotDuration: duration,
      defaultDuration: duration,
      defaultTimedEventDuration: duration,
      minTime: minTime,
      maxTime: maxTime,

      header: {
        left: "prev,next today",
        center: "title",
        right: "month,agendaWeek,agendaDay"
      },

      events: function(start, end, timezone, callback) {
        if (_.isUndefined(planningId) || planningId <= 0) {
          callback([]);
        }
        //console.log(that.rhapiMd5);
        var params = {
          from: start.toISOString(), // start est un 'moment' => voir doc fullCalendar
          to: end.toISOString(), // end est un 'moment' => voir doc fullCalendar
          md5: that.rhapiMd5,
          planning: planningId
        };

        var events = [];

        client.RendezVous.actualiser(
          params,
          (datas, response) => {
            that.rhapiMd5 = datas.informations.md5;
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
            that.rhapiCache = events;
            callback(events);
          },
          (error, response) => {
            //console.log(error);
            if (error.networkError === 304) {
              // not modified
              callback(that.rhapiCache);
            }
          }
        );
      },

      eventClick: function(event) {
        that.setState({ modalRdvIsOpen: true, eventToEdit: event });
      },

      dayClick: function(date) {
        // that is this React Component
        that.setState({
          modalRdvIsOpen: true,
          eventToEdit: {},
          selectStart: date,
          selectEnd: date.add(duration, "minutes")
        });
      },

      eventDrop: function(event) {
        var params = {
          startAt: event.start.toISOString(),
          endAt: event.end.toISOString()
        };
        client.RendezVous.update(
          event.id,
          params,
          (d, r) => {
            $("#calendar").fullCalendar("refetchEvents");
          },
          (e, r) => {}
        );
      },

      dropAccept: ".fc-event",
      eventReceive: function(event) {
        let end = moment(event.start);
        end.add(30, "minutes");
        var params = {
          startAt: event.start.toISOString(),
          endAt: end.toISOString()
        };
        client.RendezVous.update(
          event.data.id,
          params,
          (d, r) => {
            $("#calendar").fullCalendar("removeEvents", [event._id]);
            $("#calendar").fullCalendar("refetchEvents");
            that.props.externalRefetch(that.props.planning);
          },
          (e, r) => {}
        );
      },

      select: function(start, end) {
        // sélection d'une zone
        that.setState({
          modalRdvIsOpen: true,
          eventToEdit: {},
          selectStart: start,
          selectEnd: end
        });
      },

      eventResize: function(event) {
        var params = {
          startAt: event.start.toISOString(),
          endAt: event.end.toISOString()
        };
        client.RendezVous.update(
          event.id,
          params,
          (d, r) => {
            $("#calendar").fullCalendar("refetchEvents");
          },
          (e, r) => {}
        );
      }
    });
  }

  render() {
    return (
      <React.Fragment>
        <div id="calendar" />
        <CalendarModalRdv
          open={this.state.modalRdvIsOpen}
          close={() => this.setState({ modalRdvIsOpen: false })}
          event={this.state.eventToEdit}
          selectStart={this.state.selectStart}
          selectEnd={this.state.selectEnd}
          client={this.props.client}
          planning={this.props.planning}
        />
      </React.Fragment>
    );
  }
}
