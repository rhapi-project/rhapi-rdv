import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // nécessaire pour le clic sur un jour

import frLocale from "@fullcalendar/core/locales/fr";

// must manually import the stylesheets for each plugin
import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";

import moment from "moment";
import _ from "lodash";

import { rdvEtats } from "./Settings";

const calendarDefaultView = "timeGridWeek";
const defaultDate = moment();

export default class CalendarFullCalendarReact extends React.Component {
  fullCalendar = React.createRef();
  rhapiMd5 = "";
  rhapiCache = [];
  state = {
    hiddenDays: [],
    businessHours: [],
    minTime: "08:30",
    maxTime: "20:00",
    //start: null,
    //end: null,
    slotDuration: { minutes: 15 },
    defaultTimedEventDuration: { minutes: 30 }
  };

  componentDidMount() {
    //console.log("did mount");
    this.reload();
    // Mise à jour des événements tous les 15 secondes
    //setInterval(this.fullCalendar.events, 15000);
    this.intervalId = setInterval(() => {
      //let f = this.fullCalendar.current.props.events;
      //console.log(f);
    }, 3000);
  };

  componentDidUpdate(prevProps, prevState) {
    //console.log("did update");
  };

  componentWillUnmount() {
    clearInterval(this.intervalId, 15000);
  }

  reload = () => {
    let hiddenDays = [];
    let businessHours = [];
    let duree = 30;
    let dureeMin = 15;
    let minTime = this.state.minTime;
    let maxTime = this.state.maxTime;
    let plages = this.props.options.plages;
    //console.log(plages);
    if (!_.isUndefined(plages) && !_.isUndefined(plages.horaires) && (plages.horaires.length === 7)) {
      duree = _.isNumber(plages.duree) ? plages.duree : 30;
      dureeMin = _.isNumber(plages.dureeMin) ? plages.dureeMin : 15;
      let minT = "23:59";
      let maxT = "00:00";
      _.forEach(plages.horaires, (horaires, i) => {
        if (_.isEmpty(horaires)) {
          hiddenDays.push(i);
        }
        _.forEach(horaires, (horaire, j) => {
          if (horaire.start < minT) {
            minT = horaire.start;
          }
          if (horaire.end > maxT) {
            maxT = horaire.end;
          }
          businessHours.push({
            daysOfWeek: [i],
            startTime: horaire.start,
            endTime: horaire.end
          });
        });
        // début/fin arrondis à l'heure précédente/suivante
        minTime = moment(minT, "HH:mm")
          .subtract(
            _.isUndefined(plages.margeDebut)
              ? 60
              : plages.margeDebut,
            "minutes"
          )
          .minutes(0)
          .format("HH:mm");
        maxTime = moment(maxT, "HH:mm")
          .add(
            _.isUndefined(plages.margeDebut)
              ? 60
              : plages.margeDebut,
            "minutes"
          )
          .minutes(0)
          .format("HH:mm");
      });
    }

    let duration = { minutes: duree };
    let slotDuration = { minutes: dureeMin };
    let calendarSlotHeight = localStorage.getItem(
      "calendarSlotHeight_" + this.props.planning
    );
    calendarSlotHeight = _.isNull(calendarSlotHeight)
      ? 20
      : 0 + calendarSlotHeight;
    
    if (calendarSlotHeight < 17) {
      calendarSlotHeight = 17;
    }

    this.setState({
      hiddenDays: hiddenDays,
      businessHours: businessHours,
      minTime: minTime,
      maxTime: maxTime,
      slotDuration: slotDuration,
      defaultTimedEventDuration: duration
    });
  };

  fetchEvents = (fetchInfo, success, failure) => {
    //console.log("fetch");
    if (_.isUndefined(this.props.planning) || this.props.planning <= 0) {
      success([]);
    } else {
      let params = {
        from: fetchInfo.startStr,
        to: fetchInfo.endStr,
        /*md5: that.rhapiMd5,*/
        recurrents: "true",
        planning: this.props.planning
      };

      let events = [];
      let options = this.props.options;
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

      this.props.client.RendezVous.actualiser(
        params,
        result => {
          //that.rhapiMd5 = datas.informations.md5;
          //console.log("success");
          //console.log(result);

          // jours fériés légaux affichés comme des congés
          if (
            options.reservation.congesVisibles &&
            options.reservation.congesFeries
          ) {
            _.forEach(result.informations.feries, (jour, i) => {
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
          // https://fullcalendar.io/docs/event-parsing
          //console.log(datas.informations.recurrents);
          _.forEach(result.informations.recurrents, (recurrent, i) => {
            events.push({
              start: recurrent.startAt,
              end: recurrent.endAt,
              color: recurrent.couleur,
              title: recurrent.titre,
              editable: false,
              rendering: recurrent.background ? "background" : "inverse-background"
            });
          });

          for (let i = 0; i < result.results.length; i++) {
            let data = result.results[i];

            let motifIndex = -1;
            if (data.planningJO.motif) {
              motifIndex = Math.abs(data.planningJO.motif) - 1;
            }

            let couleur = _.isEmpty(data.couleur)
              ? motifIndex >= 0
                ? options.reservation.motifs[motifIndex].couleur
                : this.props.color
              : data.couleur;

            if (_.isUndefined(couleur)) {
              couleur = this.props.color;
            }

            let etat = rdvEtats[data.idEtat];
            let couleurBordure = _.isObject(etat)
              ? etat.color
              : rdvEtats[0].color;

            let lightness =
              (parseInt(couleur.substr(1, 2), 16) +
                parseInt(couleur.substr(3, 2), 16) +
                parseInt(couleur.substr(5, 2), 16)) /
              3;

            let textColor = lightness > 110 ? "#000000" : "#ffffff";

            let event = {
              id: data.id,
              title: data.titre + "\n" + data.description,
              start: data.startAt,
              end: data.endAt,
              color: couleur,
              borderColor: couleurBordure,
              textColor: textColor
              //...
            };
            events.push(event);
          }
          //that.rhapiCache = events;
          success(events);
        },
        error => {
          //console.log(error);
          if (error.networkError === 304) {
            //console.log("not modified");
            //callback(that.rhapiCache);
          }
        }
      );
    }
  };

  render() {
    //console.log();
    return(
      <React.Fragment>
        <FullCalendar
          ref={this.fullCalendar}
          defaultView={calendarDefaultView}
          defaultDate={defaultDate.toDate()}
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          header={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
          }}
          locale={frLocale}
          /*events={[
            { 
              title: "Paulin",
              start: "2019-10-23T13:00:00",
              end: "2019-10-23T14:00:00",
              color: "black"
            }
          ]}*/
          //events={this.state.events}
          height="auto"
          //aspectRatio={1.9}
          allDaySlot={true}
          editable={true}
          droppable={true}
          selectable={true}
          hiddenDays={this.state.hiddenDays}
          businessHours={this.state.businessHours}
          minTime={this.state.minTime}
          maxTime={this.state.maxTime}
          nowIndicator={true}
          slotDuration={this.state.slotDuration}
          defaultTimedEventDuration={this.state.defaultTimedEventDuration}
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", omitZeroMinute: false, meridiem: "short" }}
          //dayRender={} // c'est un callback
          events={(fetchInfo, success, failure) => this.fetchEvents(fetchInfo, success, failure)}
        />
      </React.Fragment>
    );
  }
}