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

const calendarDefaultView = "timeGridWeek";

export default class CalendarFullCalendarReact extends React.Component {

  render() {
    return(
      <React.Fragment>
        <FullCalendar
          defaultView={calendarDefaultView}
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          header={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
          }}
          locale={frLocale}
          events={[
            { 
              title: "Paulin",
              start: "2019-10-23T13:00:00",
              end: "2019-10-23T14:00:00"
            }
          ]}
        />
      </React.Fragment>
    );
  }
}