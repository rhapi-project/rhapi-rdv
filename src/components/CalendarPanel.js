import _ from "lodash";

import $ from "jquery";
import draggable from "jquery-ui/ui/widgets/draggable";
import droppable from "jquery-ui/ui/widgets/droppable";

import { Draggable } from "@fullcalendar/interaction";

import moment from "moment";

import React from "react";

import { Divider, Button, Form, Icon, Modal, Popup } from "semantic-ui-react";

import PatientSearch from "./PatientSearch";

import PatientSearchModal from "./PatientSearchModal";

import CalendarModalRdv from "./CalendarModalRdv";

import RdvPassCard from "./RdvPassCard";

import DayPicker from "react-day-picker";
import MomentLocaleUtils from "react-day-picker/moment";
import "react-day-picker/lib/style.css";

import { helpPopup } from "./Settings";

export default class CalendarPanel extends React.Component {
  rhapiMd5 = "";

  state = {
    currentPatient: { id: 0, title: "", rdv: { liste: [], index: -1 } },
    externalEventsDatas: [],
    modalClearExternal: false,
    modalRdvIsOpen: false,
    eventToEdit: {},
    patient: {},
    rdvPassCard: false,
    patientSearchModal: false
  };

  componentDidUpdate(prevProps, prevState) {
    this.reloadExternalEvents(this.props.planning);

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
        for (let j = 0; j < this.props.options.reservation.motifs.length; j++) {
          if (
            !_.isUndefined(this.props.options.reservation.motifs[j].id) &&
            this.props.options.reservation.motifs[j].id ===
              datas.planningJO.motif
          ) {
            motifIndex = j;
            break;
          }
        }
        // motifs : id = index si id n'est pas défini (ancienne version)
        if (motifIndex === -1) {
          motifIndex = Math.abs(datas.planningJO.motif) - 1;
        }
      }

      let couleur = _.isEmpty(datas.couleur)
        ? motifIndex >= 0 &&
          motifIndex < this.props.options.reservation.motifs.length
          ? this.props.options.reservation.motifs[motifIndex].couleur
          : this.props.couleur
        : datas.couleur;

      let r = parseInt(couleur.substr(1, 2), 16);
      let g = parseInt(couleur.substr(3, 2), 16);
      let b = parseInt(couleur.substr(5, 2), 16);

      let lightness = (r + g + b) / 3;

      let textColor = lightness > 110 ? "#000000" : "#ffffff";

      jEvent.css("color", textColor);

      jEvent.css("background", "rgba(" + r + "," + g + "," + b + ",0.75)"); // add transparency

      // jQuery UI : ui-widget(options, element);
      // make the event draggable (on external zone) using jQuery UI
      draggable(
        {
          zIndex: 999,
          revert: true, // will cause the event to go back to its
          revertDuration: 0 //  original position after the drag
        },
        event
      );
    });

    if (this.props.todayClicked) {
      document.getElementsByClassName("DayPicker-TodayButton")[0].click();
    }
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

    //  Make event draggable to React FullCalendar (Calendar eventReceive handlEventReceive)
    // https://codesandbox.io/s/vm45zwmo07?from-embed
    let draggableEl = document.getElementById("external-events");
    new Draggable(draggableEl, {
      itemSelector: ".fc-event",
      eventData: eventEl => {
        let datas = this.state.externalEventsDatas[
          _.toNumber(eventEl.getAttribute("datas"))
        ];
        return {
          title: datas.titre,
          datas: datas
        };
      }
    });

    this.intervalId = setInterval(
      () => {
        this.reloadExternalEvents(this.props.planning);
      },
      20000 // actualiser toutes les 20 secondes (voir md5 et retour 304)
    );

    this.props.handleExternalRefetch(this.reloadExternalEvents);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  getPatient = (id, title) => {
    this.props.client.Patients.completion(
      {
        ipp: id,
        format: this.props.options.reservation.denominationFormat
      },
      results => {
        if (results.length) {
          let current = this.state.currentPatient;
          current.id = results[0].id;
          current.titre = results[0].completion;
          this.setState({ currentPatient: current });
          this.onPatientChange(current.id, current.titre);
        }
      },
      data => {
        // error
        console.log("Erreur completion sur ipp");
        console.log(data);
      }
    );
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
          fields: "startAt,idEtat,planningsJA"
        },
        datas => {
          let today = new Date().toISOString().split("T")[0];
          let liste = [];
          let index = forceReload ? this.state.currentPatient.rdv.index : -1;
          _.forEach(datas.results, (rdv, i) => {
            // uniquement les rdv du planning courant qui sont
            // non confirmés, annulés ou sur une liste d'attente
            if (
              rdv.idEtat < 1 ||
              rdv.idEtat > 6 ||
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

          if (!forceReload && !index && liste.length) {
            // aucun futur rendez-vous => se placer sur le dernier en date
            index = liste.length - 1;
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
    /*
    let destroy = idRdv => {
      this.props.client.RendezVous.destroy(
        idRdv,
        () => {
          // success
          //console.log("id du rdv supprimé : " + idRdv);
        },
        () => {
          // success
          //console.log("Le rdv d'id " + idRdv + " n'a pas été supprimé");
        }
      );
    };

    _.forEach(this.state.externalEventsDatas, external => {
      // external est du type : { title: "LANGLOIS Frank", id: 305 }
      destroy(external.id);
    });
    */

    this.props.client.RendezVous.listeAction(
      0, // 0 => remove all
      {
        action: "remove",
        planning: this.props.planning,
        liste: 1
      },
      () => {},
      () => {}
    );

    this.setState({ externalEventsDatas: [] });
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
      titre: this.state.currentPatient.title,
      rappelsJO: { sms: {} }
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

  patientReload = () => {
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

  modalClearExternalOpen = () => {
    if (!_.isEmpty(this.state.externalEventsDatas)) {
      this.setState({ modalClearExternal: true });
    } else {
      // ne fait rien
      return;
    }
  };

  patientSearchModalOpen = bool => {
    this.setState({ patientSearchModal: bool });
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
        <Divider style={{ marginBottom: "0px" }} />
        <DayPicker
          locale="fr"
          localeUtils={MomentLocaleUtils}
          fixedWeeks={true}
          showOutsideDays={true}
          selectedDays={this.props.currentDate.toDate()}
          todayButton="Aujourd'hui" // click sur ce bouton au click sur 'Aujourd'hui' de fullcalendar
          onDayClick={day => this.props.onDateChange(day)}
        />
        <Divider style={{ marginTop: "0px" }} />
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
            value={patient && patient.titre ? patient.titre : ""}
          />
          {window.qWebChannel ? (
            <React.Fragment>
              <Popup
                trigger={
                  <Icon
                    name="user"
                    style={{
                      cursor: "pointer",
                      marginTop: 8,
                      marginLeft: 4
                    }}
                    onClick={() => {
                      window.qWebChannel.currentPatientId(id => {
                        this.props.client.Patients.completion(
                          {
                            ipp2: id,
                            format: this.props.options.reservation
                              .denominationFormat
                          },
                          results => {
                            if (results.length) {
                              let current = this.state.currentPatient;
                              current.id = results[0].id;
                              current.titre = results[0].completion;
                              this.setState({ currentPatient: current });
                              this.onPatientChange(current.id, current.titre);
                            }
                          },
                          data => {
                            // error
                            console.log("Erreur completion sur ipp2");
                            console.log(data);
                          }
                        );
                      });
                    }}
                  />
                }
                content="Sélectionner le patient courant"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />
              <Popup
                trigger={
                  <Icon
                    name="user add"
                    style={{
                      cursor: "pointer",
                      marginTop: 8
                    }}
                    onClick={() => {
                      window.qWebChannel.patientCreate2(result => {
                        this.props.client.Patients.completion(
                          {
                            ipp2: result.id,
                            format: this.props.options.reservation
                              .denominationFormat
                          },
                          results => {
                            if (results.length) {
                              let current = this.state.currentPatient;
                              current.id = results[0].id;
                              current.titre = results[0].completion;
                              this.setState({ currentPatient: current });
                              this.onPatientChange(current.id, current.titre);
                            }
                          },
                          data => {
                            // error
                            console.log("Erreur completion sur ipp2");
                            console.log(data);
                          }
                        );
                      });
                    }}
                  />
                }
                content="Créer un nouveau dossier patient"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />
              <Popup
                trigger={
                  <Icon
                    name="folder open"
                    disabled={this.state.currentPatient.id === 0}
                    style={{
                      cursor: "pointer",
                      marginTop: 8
                    }}
                    onClick={() => {
                      this.props.client.Patients.read(
                        this.state.currentPatient.id,
                        {},
                        result => {
                          window.qWebChannel.patientSelect(
                            result.ipp2,
                            () => {}
                          );
                          // this.handleOk();
                        },
                        data => {
                          // error
                          console.log("Erreur read patient");
                          console.log(data);
                        }
                      );
                    }}
                  />
                }
                content="Ouvrir le dossier du patient"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Popup
                trigger={
                  <Icon
                    style={{
                      cursor: "pointer",
                      marginTop: 8,
                      marginLeft: 5
                    }}
                    onClick={() => {
                      this.setState({
                        clearSearch: true,
                        currentPatient: {
                          id: 0,
                          title: "",
                          rdv: { liste: [], index: -1 }
                        }
                      });
                      setTimeout(() => {
                        this.setState({
                          clearSearch: false
                        });
                      }, 0);
                    }}
                    name="remove user"
                    disabled={this.state.currentPatient.id === 0}
                  />
                }
                content="Nouvelle recherche"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />

              {/* Recherche élargie d'un patient */}
              <Popup
                trigger={
                  <Icon
                    name="search"
                    disabled={this.state.patientSearchModal}
                    style={{
                      cursor: "pointer",
                      marginTop: 8
                    }}
                    onClick={() => this.patientSearchModalOpen(true)}
                  />
                }
                content="Recherche élargie"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />

              <PatientSearchModal
                open={this.state.patientSearchModal}
                client={this.props.client}
                patientChange={this.getPatient}
                patientSearchModalOpen={this.patientSearchModalOpen}
              />
            </React.Fragment>
          )}
          <Popup
            trigger={
              <Icon
                style={{
                  cursor: "pointer",
                  marginTop: 8,
                  marginLeft: window.qWebChannel ? 0 : 2
                }}
                onClick={() => {
                  if (this.state.currentPatient.id === 0) {
                    return;
                  } else {
                    this.props.client.Patients.read(
                      this.state.currentPatient.id,
                      {},
                      patient => {
                        this.setState({
                          patient: patient,
                          rdvPassCard: true
                        });
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
            }
            content="Prochains rendez-vous du patient"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />

          {!_.isEmpty(this.state.patient) ? (
            <RdvPassCard
              open={this.state.rdvPassCard}
              client={this.props.client}
              rdvPassCardOpen={this.rdvPassCardOpen}
              patient={this.state.patient}
              denomination={this.state.currentPatient.title}
              patientReload={this.patientReload}
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
          <Popup
            trigger={
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
            }
            content="Rendez-vous précédent"
            position="bottom left"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />

          <Popup
            trigger={
              <Button
                onClick={() => {
                  this.onPatientChange(-1);
                  let index = patient.rdv.index;
                  if (index >= 0) {
                    this.props.onDateChange(patient.rdv.liste[index].startAt);
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
            }
            content="Afficher la date de ce rendez-vous"
            position="bottom center"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />

          <Popup
            trigger={
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
            }
            content="Rendez-vous suivant"
            position="bottom right"
            on={helpPopup.on}
            size={helpPopup.size}
            inverted={helpPopup.inverted}
          />
        </div>
        <Divider />
        <div style={{ textAlign: "right" }}>
          <Button.Group basic={true} size="mini">
            {/*<Button icon="eraser" onClick={this.clearExternal} />*/}
            <Popup
              trigger={
                <Button icon="eraser" onClick={this.modalClearExternalOpen} />
              }
              content="Effacer la liste d'attente"
              on={helpPopup.on}
              size={helpPopup.size}
              inverted={helpPopup.inverted}
            />
            <Popup
              trigger={<Button icon="add" onClick={this.addExternal} />}
              content="Ajouter un rendez-vous à la liste d'attente"
              on={helpPopup.on}
              size={helpPopup.size}
              inverted={helpPopup.inverted}
            />
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
                    datas={i}
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

        {/* Modal suppression des rendez-vous en attente */}
        <Modal size="small" open={this.state.modalClearExternal}>
          <Modal.Header>Vider la liste d'attente</Modal.Header>
          <Modal.Content>
            {_.size(this.state.externalEventsDatas) === 1
              ? "Souhaitez-vous supprimer le rendez-vous en attente ?"
              : "Souhaitez-vous supprimer les " +
                _.size(this.state.externalEventsDatas) +
                " rendez-vous en attente ?"}
            <br />
            {_.size(this.state.externalEventsDatas) === 1 ? (
              <span>
                Cette action supprimera ce rendez-vous de{" "}
                <strong>tous les plannings</strong> !
              </span>
            ) : (
              <span>
                Cette action supprimera ces rendez-vous de{" "}
                <strong>tous les plannings</strong> !
              </span>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Non"
              onClick={() => this.setState({ modalClearExternal: false })}
            />
            <Button
              content="Oui"
              negative={true}
              onClick={() => {
                this.clearExternal();
                this.setState({ modalClearExternal: false });
              }}
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
