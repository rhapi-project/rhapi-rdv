import _ from "lodash";

import $ from "jquery";
import draggable from "jquery-ui/ui/widgets/draggable";
import droppable from "jquery-ui/ui/widgets/droppable";

import moment from "moment";

import React from "react";

import { Header, Divider, Button } from "semantic-ui-react";

import { PatientSearch } from "./CalendarModalRdv";

import CalendarModalRdv from "./CalendarModalRdv";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

import { DayPickerSingleDateController } from "react-dates";

export default class CalendarPanel extends React.Component {
  rhapiMd5 = "";

  componentWillMount() {
    this.setState({
      currentDate: moment(),
      currentPatient: { id: 0, title: "" },
      externalEventsDatas: [],
      modalRdvIsOpen: false,
      eventToEdit: {}
    });
  }

  componentWillReceiveProps(next) {
    this.rhapiMd5 = "";
    this.setState({
      externalEventsDatas: []
    });
    this.reloadExternalEvents(next.planning);
  }

  componentDidMount() {
    let dropZone = $("#external-droppable");
    dropZone.each((i, zone) => {
      droppable(
        {
          drop: (event, ui) => {
            let data = ui.draggable.data().event.data;
            let eltHeight = dropZone.innerHeight() / dropZone.children().length;
            let moveToFloat =
              (ui.offset.top - dropZone.offset().top) / eltHeight;

            let atTop = moveToFloat < 0;
            let moveTo = Math.ceil(moveToFloat - 1);

            if (moveTo >= this.state.externalEventsDatas.length) {
              moveTo = this.state.externalEventsDatas.length - 1;
            }
            if (moveTo < 0) {
              moveTo = 0;
            }
            let end = moment(this.state.externalEventsDatas[moveTo].endAt);
            if (atTop) {
              end.add(1, "days");
            } else {
              if (moveTo === this.state.externalEventsDatas.length - 1) {
                end.subtract(1, "days");
              } else if (this.state.externalEventsDatas.length > 1) {
                // entre moveTo et moveTo + 1
                let ms =
                  end.diff(this.state.externalEventsDatas[moveTo + 1].endAt) /
                  2;
                if (ms > 0) {
                  end.subtract(ms, "milliseconds");
                } else {
                  end.add(-ms, "milliseconds");
                }
              }
            }

            this.props.client.RendezVous.update(
              data.id,
              {
                planning: this.props.planning,
                endAt: end.format()
              },
              () => {
                this.reloadExternalEvents(this.props.planning);
              }
            );
          }
        },
        zone
      );
    });

    this.intervalId = setInterval(
      () => {
        this.reloadExternalEvents(this.props.planning);
      },
      15000 // actualiser toutes les 15 secondes (voir md5 et retour 304)
    );

    this.props.handleExternalRefetch(this.reloadExternalEvents);

    this.componentDidUpdate();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  componentDidUpdate() {
    $("#external-events .fc-event").each((i, event) => {
      $(event).data("event", {
        title: $.trim($(event).text()),
        stick: true,
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

  reloadExternalEvents = planning => {
    if (_.isUndefined(planning) || planning <= 0) {
      return;
    }

    var params = {
      from: "1970-01-01",
      to: "1970-01-02",
      md5: this.rhapiMd5,
      planning: planning
    };

    this.props.client.RendezVous.actualiser(
      params,
      (datas, response) => {
        this.rhapiMd5 = datas.informations.md5;
        this.setState({ externalEventsDatas: datas.results });
      },
      (error, response) => {
        //console.log(error);
      }
    );
  };

  clearExternal = () => {
    _.forEach(this.state.externalEventsDatas, (external, i) => {
      this.props.client.RendezVous.destroy(external.id, () => {});
      if (i === this.state.externalEventsDatas.length - 1) {
        this.setState({ externalEventsDatas: [] });
      }
    });
  };

  addExternal = () => {
    // epoch 	date, timestamp 1970-01-01T00:00:00 (Unix system time zero)
    // les rendez-vous en attente ont un startAt à 1970-01-01
    // l'ordre est défini par endAt :
    // 1970-01-01T00:00:00 => premier push
    // 1970-01-02T00:00:00 => 2eme push
    // d&d : on place endAt entre 2 endAt
    // actualiser : ORDER BY start_at ASC, end_at DESC
    let { client, planning } = this.props;
    let externals = this.state.externalEventsDatas;
    let end =
      externals.length === 0
        ? "1970-01-01T00:00:00"
        : moment(externals[externals.length - 1].endAt)
            .subtract(1, "days")
            .format();

    if (!this.state.currentPatient.id) {
      //alert("Aucun patient n'est actuellement défini.");
      this.setState({
        modalRdvIsOpen: true,
        eventToEdit: {
          startAt: "1970-01-01T00:00:00",
          endAt: end
        }
      });
      return;
    }

    var params = {
      startAt: "1970-01-01T00:00:00",
      endAt: end,
      idPlanningsJA: [planning],
      idPatient: this.state.currentPatient.id,
      titre: this.state.currentPatient.title
    };

    client.RendezVous.create(
      params,
      (datas, response) => {
        this.reloadExternalEvents(planning);
      },
      (error, response) => {
        //
      }
    );
  };

  render() {
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
        <Divider fitted={true} hidden={true} />
        <div style={{ textAlign: "right" }}>
          <Button
            icon="ban"
            size="mini"
            onClick={() => this.setState({ currentPatient: {} })}
          />
          <Button icon="step backward" size="mini" onClick={() => {}} />
          <Button icon="step forward" size="mini" onClick={() => {}} />
        </div>
        <Divider />
        <div
          id="external-events"
          //style={{ minHeight: 600 }}
        >
          <Header size="medium">Liste d'attente</Header>
          <div style={{ textAlign: "right" }}>
            <Button icon="eraser" size="mini" onClick={this.clearExternal} />
            <Button icon="add" size="mini" onClick={this.addExternal} />
          </div>
          <div id="external-droppable">
            {_.map(this.state.externalEventsDatas, (data, i) => {
              return (
                <div key={i}>
                  <Divider fitted={true} hidden={true} />
                  <div
                    className="fc-event"
                    onClick={() =>
                      this.setState({
                        modalRdvIsOpen: true,
                        eventToEdit: {
                          title: data.titre,
                          id: data.id
                        }
                      })
                    }
                    style={{
                      minHeight: 30,
                      color: "blue",
                      background: "orange",
                      padding: 3,
                      cursor: "pointer"
                    }}
                  >
                    {data.titre}
                  </div>
                </div>
              );
            })}
          </div>
          <Divider />
        </div>
        <CalendarModalRdv
          isExternal={true}
          open={this.state.modalRdvIsOpen}
          close={() => {
            this.setState({ modalRdvIsOpen: false });
            this.reloadExternalEvents(this.props.planning);
          }}
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
