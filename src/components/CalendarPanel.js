import _ from "lodash";

import $ from "jquery";
import draggable from "jquery-ui/ui/widgets/draggable";
import droppable from "jquery-ui/ui/widgets/droppable";

import moment from "moment";

import React from "react";

import { Divider, Button, Form, Icon } from "semantic-ui-react";

import PatientSearch from "./PatientSearch";

import CalendarModalRdv from "./CalendarModalRdv";

import RdvPassCard from "./RdvPassCard";

import { DayPickerSingleDateController } from "react-dates";

export default class CalendarPanel extends React.Component {
  rhapiMd5 = "";

  componentWillMount() {
    this.setState({
      currentDate: moment(),
      currentPatient: { id: 0, title: "", rdv: { liste: [], index: -1 } },
      externalEventsDatas: [],
      modalRdvIsOpen: false,
      eventToEdit: {},
      patient: {},
      rdvPassCard: false
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
        currentPatient: {
          id: 0,
          title: "",
          rdv: { liste: [], index: -1 },
          clearSearch: false
        }
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
            },
            clearSearch: false
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
    //_.forEach(this.state.externalEventsDatas, (external, i) => {
    //  this.props.client.RendezVous.destroy(external.id, () => {});
    //  if (i === this.state.externalEventsDatas.length - 1) {
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
    //  }
    //});
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

  rdvPassCardOpen = bool => {
    this.setState({
      rdvPassCard: bool
    });
  };

  patientReload = idPatient => {
    this.props.client.Patients.read(
      this.state.currentPatient.id,
      {},
      patient => {
        // success
        this.setState({
          patient: patient
        });
      },
      data => {
        // error
        console.log(data);
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
            moment(patient.rdv.liste[index].startAt).format("D MMMM à HH:mm")
          : "";
    }
    return (
      <React.Fragment>
        <Divider />
        <div style={{ marginLeft: -22, marginBottom: -14, marginTop: -14 }}>
          <DayPickerSingleDateController
            noBorder={true}
            hideKeyboardShortcutsPanel={true}
            enableOutsideDays={true}
            onDateChange={this.onDateChange}
            focused={false}
            date={this.state.currentDate}
          />
        </div>
        <Divider />
        <Form.Input>
          <PatientSearch
            client={this.props.client}
            patientChange={this.onPatientChange}
            format={
              _.isUndefined(this.props.options.reservation)
                ? "NP"
                : this.props.options.reservation.denominationFormat
            }
            clear={this.state.clearSearch}
          />
          <Icon
            style={{ cursor: "pointer", marginTop: 8, marginLeft: 8 }}
            onClick={() => {
              this.setState({
                clearSearch: true,
                currentPatient: {
                  id: 0,
                  title: "",
                  rdv: { liste: [], index: -1 }
                }
              });
            }}
            name="remove user"
            disabled={this.state.currentPatient.id === 0}
          />
          <Icon
            style={{ cursor: "pointer", marginTop: 8, marginLeft: 8 }}
            onClick={() => {
              if (this.state.currentPatient.id === 0) {
                return;
              } else {
                this.props.client.Patients.read(
                  this.state.currentPatient.id,
                  {},
                  patient => {
                    //console.log(patient);
                    this.setState({
                      patient: patient
                      //rdvPassCard: true
                    });
                    this.rdvPassCardOpen(true);
                  },
                  data => {
                    //Error
                    console.log("Erreur");
                    console.log(data);
                  }
                );
              }
            }}
            name="list layout"
            disabled={this.state.currentPatient.id === 0}
          />
          {!_.isEmpty(this.state.patient) ? (
            <RdvPassCard
              open={this.state.rdvPassCard}
              client={this.props.client}
              rdvPassCardOpen={this.rdvPassCardOpen}
              patient={this.state.patient}
              denomination={
                this.state.patient.nom + " " + this.state.patient.prenom
              }
              // TODO : Revoir la dénomination
              patientReload={this.patientReload}
              // saved
              // save
            />
          ) : (
            ""
          )}
        </Form.Input>

        <br />
        <div
          style={{
            textAlign: "center",
            marginLeft: -15,
            marginRight: -15
          }}
        >
          <Button
            icon="left chevron"
            style={{ fontSize: "0.7rem" }}
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
            style={{ width: "70%", fontSize: "0.7rem" }}
            icon={_.isEmpty(rdvPatient) ? "refresh" : ""}
            content={
              _.isEmpty(rdvPatient)
                ? ""
                : rdvPatient + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"
            }
          />
          <Button
            icon="right chevron"
            style={{ fontSize: "0.7rem" }}
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
