import _ from "lodash";

import $ from "jquery";
import draggable from "jquery-ui/ui/widgets/draggable";
import droppable from "jquery-ui/ui/widgets/droppable";

import moment from "moment";

import React from "react";

import { Header, Divider, Button } from "semantic-ui-react";

import { PatientSearch } from "./CalendarModalRdv";

import CalendarModalRdv from "./CalendarModalRdv";

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
    this.reactDateStyleHack();

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

            let moveAction = "";
            if (atTop) {
              moveTo = 0;
              moveAction = "moveBefore";
            } else {
              if (moveTo === this.state.externalEventsDatas.length - 1) {
                moveAction = "moveAfter";
              } else if (this.state.externalEventsDatas.length > 1) {
                // entre moveTo et moveTo + 1
                moveAction = "moveAfter";
              } else {
                moveAction = "moveBefore";
              }
            }

            this.props.client.RendezVous.listeAction(
              data.id,
              {
                action: moveAction,
                to: moveTo,
                planning: this.props.planning,
                liste: 1
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
      let datas = this.state.externalEventsDatas[i];
      let jEvent = $(event);

      jEvent.data("event", {
        title: $.trim(jEvent.text()),
        stick: true,
        data: datas
      });

      let motifIndex = -1;
      if (datas.planningJO.motif) {
        motifIndex = Math.abs(datas.planningJO.motif) - 1;
      }

      let couleur = _.isEmpty(datas.couleur)
        ? motifIndex >= 0
          ? this.props.options.reservation.motifs[motifIndex].couleur
          : this.props.couleur
        : datas.couleur;

      jEvent.css("background", couleur);

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

  reactDateStyleHack = () => {
    // Style hack for react-date
    setTimeout(() => {
      _.forEach(
        document.getElementsByClassName("CalendarMonth_caption"),
        elt => {
          elt.style.paddingBottom = "47px";
          elt.style.fontSize = "small";
        }
      );

      _.forEach(
        document.getElementsByClassName("DayPicker_weekHeader_li"),
        elt => {
          elt.style.width = "32px";
          elt.style.height = "32px";
        }
      );

      _.forEach(document.getElementsByClassName("CalendarDay"), elt => {
        elt.style.width = "32px";
        elt.style.height = "32px";
        elt.style.fontSize = "0.8rem";
      });

      _.forEach(document.getElementsByClassName("DayPicker"), elt => {
        elt.style.maxWidth = "250px";
        elt.style.height = "300px";
        elt.style.marginLeft = "1px";
      });

      _.forEach(
        document.getElementsByClassName("DayPicker_transitionContainer"),
        elt => {
          elt.style.maxWidth = "250px";
          elt.style.height = "300px";
        }
      );

      _.forEach(document.getElementsByClassName("CalendarMonth"), elt => {
        elt.style.paddingLeft = "0px";
      });

      _.forEach(
        document.getElementsByClassName("DayPicker_focusRegion"),
        elt => {
          elt.style.maxWidth = "250px";
          elt.style.height = "300px";
        }
      );
    }, 0);
  };

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
          fields: "startAt,planningsJA"
        },
        datas => {
          let today = new Date().toISOString().split("T")[0];
          let liste = [];
          let index = forceReload ? this.state.currentPatient.rdv.index : -1;
          _.forEach(datas.results, (rdv, i) => {
            // uniquement les rdv du planning courant qui ne sont pas sur une liste d'attente
            if (
              !_.some(rdv.planningsJA, {
                id: this.props.planning,
                liste1: 0,
                liste2: 0
              })
            ) {
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
      liste: 1,
      md5: this.rhapiMd5,
      planning: planning
    };

    this.props.client.RendezVous.liste(
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
        // clean the list (remove all... if any)
        this.props.client.RendezVous.listeAction(
          0,
          {
            action: "remove",
            planning: this.props.planning,
            liste: 1
          },
          () => {},
          () => {}
        );
        this.setState({ externalEventsDatas: [] });
      }
    });
  };

  addExternal = () => {
    let client = this.props.client;
    let planning = this.props.planning;

    if (!this.state.currentPatient.id) {
      //alert("Aucun patient n'est actuellement défini.");
      this.setState({
        modalRdvIsOpen: true,
        eventToEdit: {}
      });
      return;
    }

    var params = {
      planningJO: { id: planning },
      idPatient: this.state.currentPatient.id,
      titre: this.state.currentPatient.title
    };

    client.RendezVous.create(
      params,
      (datas, response) => {
        client.RendezVous.listeAction(
          datas.id,
          {
            action: "push",
            planning: planning,
            liste: 1
          },
          (datas, response) => {
            this.reloadExternalEvents(planning);
          },
          (error, response) => {
            //
          }
        );
      },
      (error, response) => {
        //
      }
    );
  };

  render() {
    // RDV du patient
    let rdvPatient = "RDV du patient";
    let patient = this.state.currentPatient;
    if (patient.id > 0) {
      let index = patient.rdv.index;
      rdvPatient =
        index >= 0
          ? "Le " +
            moment(patient.rdv.liste[index].startAt).format("D MMM à HH:mm")
          : "";
    }

    return (
      <React.Fragment>
        <Divider />
        <DayPickerSingleDateController
          hideKeyboardShortcutsPanel={true}
          enableOutsideDays={true}
          onDateChange={this.onDateChange}
          focused={false}
          date={this.state.currentDate}
          onNextMonthClick={this.reactDateStyleHack}
          onPrevMonthClick={this.reactDateStyleHack}
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
        <Header size="small">Liste d'attente</Header>
        <div style={{ textAlign: "right" }}>
          <Button.Group basic={true} size="mini">
            <Button icon="eraser" onClick={this.clearExternal} />
            <Button icon="add" onClick={this.addExternal} />
          </Button.Group>
        </div>

        <div id="external-events">
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
          denominationFormat={
            _.isUndefined(this.props.options.reservation)
              ? "NP"
              : this.props.options.reservation.denominationFormat
          }
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
          options={this.props.options}
        />
      </React.Fragment>
    );
  }
}
