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
    let defaultColor = this.props.couleur;

    let duree = 30;
    let dureeMin = 15;
    const plages = options.plages;
    if (
      !_.isUndefined(plages) &&
      !_.isUndefined(plages.horaires) &&
      plages.horaires.length === 7
    ) {
      duree = _.isNumber(plages.duree) ? plages.duree : 30;

      dureeMin = _.isNumber(plages.dureeMin) ? plages.dureeMin : 15;

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
        // début/fin arrondis à l'heure précédente/suivante
        minTime = moment(minT, "HH:mm")
          .subtract(60, "minutes")
          .minutes(0)
          .format("HH:mm");
        maxTime = moment(maxT, "HH:mm")
          .add(60, "minutes")
          .minutes(0)
          .format("HH:mm");
      });
    }

    let duration = { minutes: duree };
    let slotDuration = { minutes: dureeMin };

    let calendarSlotHeight = localStorage.getItem(
      "calendarSlotHeight_" + planningId
    );
    calendarSlotHeight = _.isNull(calendarSlotHeight)
      ? "20px"
      : calendarSlotHeight + "px";

    let that = this; // that react component

    $("#calendar").fullCalendar("destroy");

    $("#calendar").fullCalendar({
      locale: "fr",
      slotLabelFormat: "H:mm",
      nowIndicator: true,
      defaultView: "agendaWeek", // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,
      droppable: true,
      selectable: true,
      hiddenDays: hiddenDays,
      businessHours: businessHours,
      slotDuration: slotDuration,
      slotLabelInterval: "01:00",
      defaultDuration: duration,
      defaultTimedEventDuration: duration,
      minTime: minTime,
      maxTime: maxTime,
      //
      // defaults colors
      eventColor: defaultColor,
      //eventBackgroundColor
      //eventBorderColor :"",
      //eventTextColor: "",
      //
      // dimensions
      //aspectRatio:,
      height: "auto",
      //contentHeight: "auto",
      header: {
        left: "prev,next today",
        center: "title",
        right: "month,agendaWeek,agendaDay"
      },
      views: {
        month: {
          columnHeaderFormat: "dddd D/MM"
        },
        week: {
          columnHeaderFormat: "dddd D/MM",
          titleFormat: "D MMMM YYYY"
        },
        day: {
          columnHeaderFormat: " ",
          titleFormat: "dddd D MMMM YYYY"
        }
      },

      dayRender: function(date, cell) {
        $("td.fc-widget-content").css("height", calendarSlotHeight);
      },

      events: function(start, end, timezone, callback) {
        if (_.isUndefined(planningId) || planningId <= 0) {
          callback([]);
        }

        var params = {
          from: start.toISOString(),
          to: end.toISOString(),
          md5: that.rhapiMd5,
          planning: planningId
        };

        let events = [];
        if (options.reservation.congesVisibles) {
          if (options.reservation.congesFeries) {
            params.feries = "true";
          }
          events = _.map(options.reservation.conges, (periode, i) => {
            return {
              start: periode.start,
              end: periode.end,
              color: options.reservation.congesCouleur,
              title: periode.titre
            };
          });
        }

        // autres plages réservées / récurrentes => même format que businessHours
        /*
        events.push({
          // days of week. an array of zero-based day of week integers (0=Sunday)
          dow: [1, 2, 3, 4], // Monday - Thursday
          start: "10:00", // a start time (10am in this example)
          end: "18:00", // an end time (6pm in this example)
          rendering: "background",
          color: "blue"
        });
        */

        client.RendezVous.actualiser(
          params,
          (datas, response) => {
            that.rhapiMd5 = datas.informations.md5;

            // jours fériés légaux affichés comme des congés
            if (
              options.reservation.congesVisibles &&
              options.reservation.congesFeries
            ) {
              _.forEach(datas.informations.feries, (jour, i) => {
                events.push({
                  start: jour.date,
                  end: jour.date,
                  color: options.reservation.congesCouleur,
                  title: jour.jour
                });
              });
            }

            for (let i = 0; i < datas.results.length; i++) {
              var result = datas.results[i];

              let motifIndex = -1;
              if (result.planningJO.motif) {
                motifIndex = Math.abs(result.planningJO.motif) - 1;
              }

              let couleur = _.isEmpty(result.couleur)
                ? motifIndex >= 0
                  ? options.reservation.motifs[motifIndex].couleur
                  : defaultColor
                : result.couleur;

              var event = {
                id: result.id,
                title: result.titre,
                start: result.startAt,
                end: result.endAt,
                color: couleur
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

      // drop from external
      dropAccept: ".fc-event",
      eventReceive: function(event) {
        let start = event.start;
        let end = moment(start);
        let start0 = moment(event.data.startAt);
        let end0 = moment(event.data.endAt);
        if (!start0.isValid() || !end0.isValid()) {
          end.add(duration, "minutes");
        } else {
          // rétablit la durée initiale
          let laps = end0.diff(start0, "minutes");
          if (laps < 0) {
            laps = duration;
          }
          end.add(laps, "minutes");
        }
        var params = {
          startAt: start.toISOString(),
          endAt: end.toISOString()
        };

        client.RendezVous.update(
          event.data.id,
          params,
          () => {
            client.RendezVous.listeAction(
              event.data.id,
              {
                action: "remove",
                planning: planningId,
                liste: 1
              },
              () => {
                that.props.externalRefetch(planningId);
                $("#calendar").fullCalendar("removeEvents", [event._id]);
                $("#calendar").fullCalendar("refetchEvents");
              },
              () => {}
            );
          },
          () => {}
        );
      },

      // drag to external
      // https://codepen.io/subodhghulaxe/pen/qEXLLr
      dragRevertDuration: 0,
      eventDragStop: function(event, jsEvent, ui, view) {
        if (_.isUndefined(jsEvent)) {
          return;
        }
        let externalEvents = $("#external-events");
        let offset = externalEvents.offset();
        let x = jsEvent.clientX;
        let y = jsEvent.clientY;
        offset.right = externalEvents.width() + offset.left;
        offset.bottom = externalEvents.height() + offset.top;
        if (
          !(
            x >= offset.left &&
            y >= offset.top - 100 &&
            x <= offset.right &&
            y <= offset.bottom + 100
          )
        ) {
          // out the external div
          return;
        }

        client.RendezVous.listeAction(
          event.id,
          {
            action: "push",
            planning: planningId,
            liste: 1
          },
          () => {
            that.props.externalRefetch(planningId);
            $("#calendar").fullCalendar("removeEvents", event._id);
          }
        );
      },

      // sélection d'une zone
      select: function(start, end) {
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

    // ajustement CSS fullcalendar
    $(".fc-button").css("background", "white");
  } // componentDidUpdate ends here

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
          options={this.props.options}
          denominationFormat={this.props.options.reservation.denominationFormat}
        />
      </React.Fragment>
    );
  }
}