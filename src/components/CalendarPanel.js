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
      currentPatient: { id: 0, title: "", rdv: { liste: [], index: -1 } },
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
    this.onPatientChange(-1, ""); // force reload rdv patient
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
                endAt: end.toISOString()
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
    // if id === -1 => unchanged => only force reload
    let forceReload = id === -1;
    if (forceReload) {
      id = this.state.currentPatient.id;
      title = this.state.currentPatient.title;
    }
    if (id === 0) {
      this.setState({
        currentPatient: { id: 0, title: "", rdv: { liste: [], index: -1 } }
      });
    } else {
      // rdv du patient
      this.props.client.RendezVous.readAll(
        {
          _idPatient: id,
          q1: "startAt,GreaterThan,1980-01-01",
          limit: "1000",
          sort: "startAt",
          fields: "startAt,idPlanningsJA"
        },
        datas => {
          let today = new Date().toISOString().split("T")[0];
          let liste = [];
          let index = forceReload ? this.state.currentPatient.rdv.index : -1;
          _.forEach(datas.results, (rdv, i) => {
            if (_.indexOf(rdv.idPlanningsJA, this.props.planning) === -1) {
              return;
            }

            if (!forceReload) {
              // un nouvel index par défaut
              if (index === -1) {
                index = 0;
              }
              if (!index && rdv.startAt >= today) {
                index = liste.length;
              }
            }
            liste.push(rdv);
          });

          if (index > -1 && index > liste.length - 1) {
            index = liste.length - 1;
          }

          if (forceReload && index === -1 && liste.length) {
            index = 0;
          }

          this.setState({
            currentPatient: {
              id: id,
              title: title,
              rdv: { liste: liste, index: index }
            }
          });
        },
        () => {}
      );
    }
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
            .toISOString();

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
    // RDV du patient
    let rdvPatient = "Rendez-vous du patient";
    let patient = this.state.currentPatient;
    if (patient.id > 0) {
      let index = patient.rdv.index;
      rdvPatient =
        index >= 0
          ? "Le " +
            moment(patient.rdv.liste[index].startAt).format("LL à HH:mm")
          : "";
    }

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
          format={
            _.isUndefined(this.props.options.reservation)
              ? "NP"
              : this.props.options.reservation.denominationFormat
          }
        />
        <br />
        <div style={{ textAlign: "center" }}>
          <Button
            icon="left chevron"
            size="mini"
            onClick={() => {
              this.onPatientChange(-1);
              let index = patient.rdv.index - 1;
              if (index >= 0) {
                patient.rdv.index = index;
                this.setState({ currentPatient: patient });
              }
            }}
          />

          <Button
            size="mini"
            onClick={() => {
              this.onPatientChange(-1);
              let index = patient.rdv.index;
              if (index >= 0) {
                $("#calendar").fullCalendar(
                  "gotoDate",
                  patient.rdv.liste[index].startAt
                );
              }
            }}
            style={{ width: "70%" }}
            icon={_.isEmpty(rdvPatient) ? "refresh" : ""}
            content={
              _.isEmpty(rdvPatient)
                ? ""
                : rdvPatient + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"
            }
          />
          <Button
            icon="right chevron"
            size="mini"
            onClick={() => {
              this.onPatientChange(-1);
              let index = patient.rdv.index + 1;
              if (index < patient.rdv.liste.length) {
                patient.rdv.index = index;
                this.setState({ currentPatient: patient });
              }
            }}
          />
        </div>
        <Divider />
        <div id="external-events">
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
                    onClick={() => {
                      this.setState({
                        modalRdvIsOpen: true,
                        eventToEdit: {
                          title: data.titre,
                          id: data.id
                        }
                      });
                    }}
                    style={{
                      minHeight: 30,
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
