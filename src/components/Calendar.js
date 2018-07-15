// fullcalendar locale
import "fullcalendar/dist/locale/fr";

import "fullcalendar";

import _ from "lodash";

import $ from "jquery";

import moment from "moment";

import React from "react";

import CalendarModalRdv from "./CalendarModalRdv";

var currentDate = moment();
var currentView = "agendaWeek";

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
      ? 20
      : 0 + calendarSlotHeight;

    if (calendarSlotHeight < 17) {
      calendarSlotHeight = 17;
    }

    let that = this; // that react component

    that.rhapiMd5 = "" + planningId; // force to refetch on planning change

    $("#calendar").fullCalendar("destroy");

    $("#calendar").fullCalendar({
      locale: "fr",
      slotLabelFormat: "H:mm",
      nowIndicator: true,
      defaultDate: currentDate,
      defaultView: currentView, // month,basicWeek,basicDay,agendaWeek,agendaDay,listYear,listMonth,listWeek,listDay
      editable: true,
      droppable: true,
      selectable: true,
      hiddenDays: hiddenDays,
      businessHours: businessHours,
      slotDuration: slotDuration,
      slotLabelInterval: "01:00", //calendarSlotHeight < 17 ? "00:00" : "01:00",
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
          titleFormat: "D MMMM YYYY [(semaine] W[)]"
        },
        day: {
          columnHeaderFormat: " ",
          titleFormat: "dddd D MMMM YYYY"
        }
      },

      dayRender: function(date, cell) {
        $("td.fc-widget-content").css("height", calendarSlotHeight);
      },

      viewRender: function(view) {
        currentView = view.name;
        currentDate = view.calendar.getDate();
      },

      eventRender: function(event, element) {
        let elt = element[0];
        if (elt.className === "fc-bgevent") {
          // met en black si fond clair sur les events "background"
          // note : fc ne prend en compte ni le texte ni textColor sur les "fc-bgevent"
          let color = event.color;
          if (color.substr(0, 1) === "#") {
            let lightness =
              (parseInt(color.substr(1, 2), 16) +
                parseInt(color.substr(3, 2), 16) +
                parseInt(color.substr(5, 2), 16)) /
              3;
            if (lightness > 140) {
              $(elt).css("color", "#000000");
            } else {
              $(elt).css("color", "#FFFFFF");
            }
          } else {
            $(elt).css("color", "#FFFFFF");
          }
          $(elt).css("padding-left", "2px");
          elt.innerText = event.title;
        }
      },

      events: function(start, end, timezone, callback) {
        if (_.isUndefined(planningId) || planningId <= 0) {
          callback([]);
        }

        var params = {
          from: start.toISOString(),
          to: end.toISOString(),
          md5: that.rhapiMd5,
          recurrents: "true",
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
                  editable: false,
                  title: jour.jour
                });
              });
            }

            // évènements récurrents
            // https://fullcalendar.io/docs/event-object
            //console.log(datas.informations.recurrents);
            _.forEach(datas.informations.recurrents, (recurrent, i) => {
              events.push({
                start: recurrent.startAt,
                end: recurrent.endAt,
                color: recurrent.couleur,
                title: recurrent.titre,
                editable: false,
                rendering: recurrent.background ? "background" : ""
              });
            });

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
              //console.log("not modified");
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
                planning: 0, // supprime de toutes les listes de tous les plannings du RDV
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
            planning: 0, // push sur les listes de tous les plannings du RDV
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
    // prev & next buttons padding-top
    // all but Safari ("Safari" is returned as userAgent on Chrome)
    if (
      navigator.userAgent.indexOf("Safari") === -1 ||
      navigator.userAgent.indexOf("Chrome") !== -1
    ) {
      $(".fc-prev-button").css("padding-top", "5px"); // < & >
      $(".fc-next-button").css("padding-top", "5px");
    }
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
