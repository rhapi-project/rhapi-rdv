import React from "react";

import _ from "lodash";

import {
  Button,
  Header,
  Divider,
  Modal,
  Message,
  Icon,
  Image,
  Segment,
  Form,
  Label,
  Dropdown,
  Grid,
  List,
  Checkbox,
  Ref,
  Accordion,
  Popup
} from "semantic-ui-react";

import TimeField from "react-simple-timefield";

import moment from "moment";

import { maxWidth, rdvEtats, telFormat, helpPopup } from "./Settings";

import PatientSearch from "./PatientSearch";

import PatientSearchModal from "./PatientSearchModal";

import ColorPicker from "./ColorPicker";

import RdvPassCard from "./RdvPassCard";

import DayPickerInput from "react-day-picker/DayPickerInput";
import MomentLocaleUtils, {
  formatDate,
  parseDate
} from "react-day-picker/moment";
import "react-day-picker/lib/style.css";

class FromTo extends React.Component {
  state = {
    hfrom: "00:00:00",
    hto: "00:00:00"
  };

  componentDidMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.hfrom || !props.hto) {
      return null;
    }
    if (props.hfrom !== state.hfrom || props.hto !== state.hto) {
      return {
        hfrom: props.hfrom,
        hto: props.hto
      };
    }
    return null; // nothing to change in the state
  }

  handleChange = (value, name) => {
    let { hfrom, hto } = this.state;

    if (name === "hfrom") {
      hfrom = value;
    }

    if (name === "hto") {
      hto = value;
    }
    this.props.handleChange(hfrom, hto);
  };

  render() {
    let { hfrom, hto } = this.state;
    return (
      <div>
        <Label size="large" style={{ marginTop: 5 }} content="De" />
        <TimeField
          value={hfrom} // {String}   required, format '00:00' or '00:00:00'
          onChange={(e, value) => this.handleChange(value, "hfrom")}
          input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
        <Label size="large" style={{ marginTop: 5 }} content="à" />
        <TimeField
          value={hto} // {String}   required, format '00:00' or '00:00:00'
          onChange={(e, value) => this.handleChange(value, "hto")}
          //input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
      </div>
    );
  }
}

const rappelsNames = [
  {
    rappelName: "rappel72",
    rappelDoneName: "rappel72Done",
    label: "Rappel à 72 h"
  },
  {
    rappelName: "rappel48",
    rappelDoneName: "rappel48Done",
    label: "Rappel à 48 h"
  },
  {
    rappelName: "rappel24",
    rappelDoneName: "rappel24Done",
    label: "Rappel à 24 h"
  },
  {
    rappelName: "rappel1",
    rappelDoneName: "rappel1Done",
    label: "Rappel à 1 h"
  }
];

export default class CalendarModalRdv extends React.Component {
  //plannings = [];

  state = {
    image: "",
    accordionIndex: -1,
    accordionIndex2: -1,
    rdvPassCard: false,
    deleteRdv: false,
    dateRdvFocused: false,
    patientSearchModal: false,
    dureeDefaut: false,
    patient: {},
    rdv: {},
    descriptionSaisie: ""
  };

  idCopiedRdv = null;

  componentDidMount() {
    this.reload(this.props);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.planning !== this.props.planning) {
      this.idCopiedRdv = null;
    }
    if (this.props.open && this.props.open !== prevProps.open) {
      let d = _.get(this.props, "options.plages.dureeMin", 0);
      let s = !this.props.selectStart
        ? moment(this.props.event.start)
        : moment(this.props.selectStart);
      let e = !this.props.selectEnd
        ? moment(this.props.event.end)
        : moment(this.props.selectEnd);
      let d2 = e.diff(s) / 60000;
      let dureeDefaut = d === d2;
      this.setState({
        image: "",
        accordionIndex: -1,
        accordionIndex2: -1,
        dureeDefaut: dureeDefaut
      });
      this.reload(this.props);
    }
  }

  patientTodos = (idPatient, rdv) => {
    if (!window.qWebChannel || !this.state.isNewOne) {
      return;
    }
    let querySQL =
      "SELECT description, localisation FROM actes WHERE lettre = '#TODO' AND idpatient = :id ORDER BY id;";
    querySQL = querySQL.replace(":id", idPatient);
    window.qWebChannel.sqlExecResults(2, querySQL, results => {
      let description = "";
      let localisation, todo;
      _.each(results, (result, i) => {
        if (i % 2 === 0) {
          todo = result;
        } else {
          localisation = _.isEmpty(result) ? "" : result + " - ";
          description += _.isEmpty(description)
            ? localisation + todo
            : "\n" + localisation + todo;
        }
      });
      if (_.isEmpty(this.state.descriptionSaisie)) {
        rdv.description = description;
      } else {
        rdv.description = _.isEmpty(description)
          ? this.state.descriptionSaisie
          : this.state.descriptionSaisie + "\n" + description;
      }
      this.setState({ rdv: rdv });
    });
  };

  patientLoad = (idPatient, rdv0) => {
    let rdv = _.isUndefined(rdv0) ? this.state.rdv : rdv0;

    if (!idPatient) {
      // patient non encore défini (RDV pris en ligne ou RDV saisi sans identification)
      // rappelsJO déjà en rdv

      if (_.isUndefined(rdv.rappelsJO)) {
        rdv.rappelsJO = {};
      }
      if (_.isUndefined(rdv.rappelsJO.sms)) {
        rdv.rappelsJO.sms = {};
      }
      rdv.rappelsJO.modified = true;

      this.setState({
        rdv: rdv,
        patient: Object.assign(
          {
            gestionRdvJO: {
              autoriseSMS: true
            }
          },
          rdv.patientJO
        )
      });
      return;
    }

    this.props.client.Patients.read(
      idPatient,
      {},
      patient => {
        this.patientTodos(patient.ipp2, rdv);
        // success
        let iniState =
          this.state.isNewOne ||
          (this.state.isExternal &&
            (!rdv.rappelsJO || !rdv.rappelsJO.modified));

        if (patient.gestionRdvJO.autoriseSMS) {
          // prendre les rappels qui sont définis dans les plannings
          // s'il n'y a pas encore eu de modifications sur le rdv
          // par rapport aux rappels SMS

          _.findIndex(this.state.plannings, planning => {
            if (
              _.findIndex(rdv.planningsJA, pl => {
                return pl.id === planning.value;
              }) === -1
            ) {
              return false;
            }

            if (
              planning.sms &&
              planning.sms.confirmationTexte &&
              planning.sms.confirmationTexte !== "" &&
              (planning.sms.rappel1 ||
                planning.sms.rappel24 ||
                planning.sms.rappel48 ||
                planning.sms.rappel72)
            ) {
              /*if (_.isUndefined(this.state)) {
                return false;
              }*/

              let sms = {};
              sms.rappel1 = iniState
                ? planning.sms.rappel1
                : rdv.rappelsJO.sms.rappel1;
              sms.rappel24 = iniState
                ? planning.sms.rappel24
                : rdv.rappelsJO.sms.rappel24;
              sms.rappel48 = iniState
                ? planning.sms.rappel48
                : rdv.rappelsJO.sms.rappel48;
              sms.rappel72 = iniState
                ? planning.sms.rappel72
                : rdv.rappelsJO.sms.rappel72;
              sms.rappel1Done = iniState ? "" : rdv.rappelsJO.sms.rappel1Done;
              sms.rappel24Done = iniState ? "" : rdv.rappelsJO.sms.rappel24Done;
              sms.rappel48Done = iniState ? "" : rdv.rappelsJO.sms.rappel48Done;
              sms.rappel72Done = iniState ? "" : rdv.rappelsJO.sms.rappel72Done;

              if (_.isEmpty(rdv.rappelsJO)) {
                let rappelsJO = {};
                rappelsJO.sms = sms;
                rappelsJO.modified = iniState ? false : rdv.rappelsJO.modified;
                rdv.rappelsJO = rappelsJO;
              } else {
                rdv.rappelsJO.sms = sms;
                rdv.rappelsJO.modified = iniState
                  ? false
                  : rdv.rappelsJO.modified; // à revoir
              }
              this.setState({ rdv: rdv });
              return true;
            } else {
              /*if (_.isUndefined(this.state)) {
                return false;
              }*/
              let sms = {};

              sms.rappel1 = iniState ? false : rdv.rappelsJO.sms.rappel1;
              sms.rappel24 = iniState ? false : rdv.rappelsJO.sms.rappel24;
              sms.rappel48 = iniState ? false : rdv.rappelsJO.sms.rappel48;
              sms.rappel72 = iniState ? false : rdv.rappelsJO.sms.rappel72;
              sms.rappel1Done = iniState ? "" : rdv.rappelsJO.sms.rappel1Done;
              sms.rappel24Done = iniState ? "" : rdv.rappelsJO.sms.rappel24Done;
              sms.rappel48Done = iniState ? "" : rdv.rappelsJO.sms.rappel48Done;
              sms.rappel72Done = iniState ? "" : rdv.rappelsJO.sms.rappel72Done;

              if (_.isEmpty(rdv.rappelsJO)) {
                let rappelsJO = {};
                rappelsJO.sms = sms;
                rappelsJO.modified = iniState ? false : rdv.rappelsJO.modified;
                rdv.rappelsJO = rappelsJO;
              } else {
                rdv.rappelsJO.sms = sms;
                rdv.rappelsJO.modified = iniState
                  ? false
                  : rdv.rappelsJO.modified; // à revoir
              }
              this.setState({ rdv: rdv });
              return false;
            }
          });
        } else {
          // l'envoi SMS n'est pas autorisé chez ce patient,
          // s'il c'est un nouveau rendez-vous, mettre tous les rappels à false
          /*if (_.isUndefined(this.state)) {
            return false;
          }*/
          let sms = {};
          sms.rappel1 = iniState ? false : rdv.rappelsJO.sms.rappel1;
          sms.rappel24 = iniState ? false : rdv.rappelsJO.sms.rappel24;
          sms.rappel48 = iniState ? false : rdv.rappelsJO.sms.rappel48;
          sms.rappel72 = iniState ? false : rdv.rappelsJO.sms.rappel72;
          sms.rappel1Done = iniState ? "" : rdv.rappelsJO.sms.rappel1Done;
          sms.rappel24Done = iniState ? "" : rdv.rappelsJO.sms.rappel24Done;
          sms.rappel48Done = iniState ? "" : rdv.rappelsJO.sms.rappel48Done;
          sms.rappel72Done = iniState ? "" : rdv.rappelsJO.sms.rappel72Done;

          if (_.isEmpty(rdv.rappelsJO)) {
            let rappelsJO = {};
            rappelsJO.sms = sms;
            rappelsJO.modified = iniState ? false : rdv.rappelsJO.modified;
            rdv.rappelsJO = rappelsJO;
          } else {
            rdv.rappelsJO.sms = sms;
            rdv.rappelsJO.modified = iniState ? false : rdv.rappelsJO.modified; // à revoir
          }
          this.setState({ rdv: rdv });
        }
        this.setState({ patient: patient });
        this.setState({ image: patient.profilJO.base64 });
      },
      data => {
        // error
        console.log(this.state.rdv.patientJO);
        this.setState({ image: "" });
      }
    );
  };

  reload = next => {
    //console.log(next);
    const event = next.event;

    const isNewOne = _.isUndefined(event.title);

    let rdv = {};
    if (isNewOne) {
      rdv = {
        planningJO: { id: this.props.planning },
        planningsJA: [],
        idEtat: 1
      };
      rdv.planningsJA.push({
        id: this.props.planning,
        liste1: 0,
        liste2: 0,
        motif: 0
      });
      //
      // planning associé sur tout motif (-1)
      if (!_.isUndefined(this.props.options.reservation)) {
        let planningsAssocies = this.props.options.reservation
          .planningsAssocies;
        let associe = _.find(planningsAssocies, p => {
          return p.motif === -1;
        });

        if (!_.isUndefined(associe)) {
          // il existe un planning associé

          let i = _.findIndex(rdv.planningsJA, pl => {
            return pl.id === associe.planning2;
          });
          if (i === -1) {
            // associé non défini
            // console.log(associe);
            //
            // supprime tous les associés
            _.remove(rdv.planningsJA, pl => {
              return (
                _.findIndex(planningsAssocies, p => {
                  return p.planning2 === pl.id;
                }) !== -1
              );
            });
            //
            // ajoute l'associé défini pour le motif courant
            rdv.planningsJA.push({
              id: associe.planning2,
              liste1: 0,
              liste2: 0,
              motif: associe.motif2 + 1
            });
          }
        }
      }

      if (next.isExternal) {
        rdv.startAt = event.startAt;
        rdv.endAt = event.endAt;
      } else {
        rdv.startAt = !next.selectStart
          ? ""
          : next.selectStart.toISOString(true); // true : maintain the local timezone
        rdv.endAt = !next.selectEnd
          ? rdv.startAt
          : next.selectEnd.toISOString(true);
      }
    } else {
      // (re)lire le rdv depuis le client
      this.props.client.RendezVous.read(
        event.id,
        { planning: this.props.planning },
        rdv => {
          //console.log(rdv);
          this.patientLoad(rdv.idPatient, rdv);
          this.setState({ rdv: rdv });
        },
        () => {}
      );
    }

    this.planningsSelect();
    this.setState({ isNewOne: isNewOne, rdv: rdv });
    if (next.isExternal && event.id) {
      this.props.client.RendezVous.read(
        event.id,
        { planning: this.props.planning },
        rdv => {
          //console.log(rdv);
          this.patientLoad(rdv.idPatient, rdv);
          this.setState({ rdv: rdv, isExternal: true });
        },
        () => {}
      );
    }
  };

  close = () => {
    this.setState({ patient: {}, rdv: {}, descriptionSaisie: "" });
    this.props.close();
  };

  handleOk = () => {
    let pushToExternal = id => {
      let plannings = this.state.rdv.planningsJA;
      let n = plannings.length;

      let pushForPlanning = index => {
        if (index === n) return this.close();
        let planning = plannings[index];
        if (planning.liste1 === 0) {
          this.props.client.RendezVous.listeAction(
            id,
            {
              action: "push",
              planning: planning.id,
              liste: 1
            },
            () => {
              pushForPlanning(++index);
            },
            () => {
              pushForPlanning(++index);
            }
          );
        } else {
          pushForPlanning(++index);
        }
      };
      pushForPlanning(0);
    };

    let rdv = this.state.rdv;

    // ipp2 est renseigné si defini pour le patient
    if (
      !_.isUndefined(this.state.patient) &&
      !_.isUndefined(this.state.patient.ipp2)
    ) {
      rdv.ipp2 = this.state.patient.ipp2;
    }

    if (
      _.isUndefined(rdv.titre) ||
      _.isUndefined(this.state.patient) ||
      _.isUndefined(this.state.patient.id)
    ) {
      _.unset(rdv, "ipp2");
    }

    if (this.state.isNewOne) {
      this.props.client.RendezVous.create(
        rdv,
        result => {
          if (this.props.isExternal) {
            pushToExternal(result.id);
          } else {
            this.close();
          }
        },
        () => this.close()
      );
    } else {
      _.unset(rdv, "planningJO");
      this.props.client.RendezVous.update(
        rdv.id,
        rdv,
        () => {
          if (this.props.isExternal) {
            pushToExternal(rdv.id);
          } else {
            this.close();
          }
        },
        () => this.close()
      );
    }
  };

  handleRemove = () => {
    if (this.state.isNewOne) {
      this.close();
      return;
    }

    let destroy = () => {
      this.props.client.RendezVous.destroy(
        this.props.event.id,
        () => this.close(),
        () => this.close()
      );
    };

    if (this.props.isExternal) {
      this.props.client.RendezVous.listeAction(
        this.props.event.id,
        {
          action: "remove",
          planning: this.props.planning,
          liste: 1
        },
        () => destroy(),
        () => destroy()
      );
    } else {
      destroy();
    }
  };

  patientChange = (id, title) => {
    if (id <= 0) {
      return;
    }
    let rdv = this.state.rdv;
    rdv.idPatient = id;
    rdv.titre = title;
    this.setState({ rdv: rdv });
    this.patientLoad(rdv.idPatient);
  };

  planningsSelect = () => {
    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        //console.log(result.results);
        // Attention, on a planning.optionsJO.sms.rappel12 au lieu de rappel1

        // success
        let plannings = [];
        _.forEach(result.results, planning => {
          let pl = {};
          pl.text = planning.titre;
          pl.value = planning.id;
          pl.motifs = _.isUndefined(planning.optionsJO.reservation)
            ? []
            : planning.optionsJO.reservation.motifs;
          pl.autorisationMinAgenda = _.isUndefined(
            planning.optionsJO.reservation
          )
            ? []
            : planning.optionsJO.reservation.autorisationMinAgenda;

          pl.sms = _.isUndefined(planning.optionsJO.sms)
            ? {}
            : planning.optionsJO.sms;
          if (planning.id === this.props.planning) {
            plannings.unshift(pl); // place en premier le planning courant
          } else {
            plannings.push(pl);
          }
        });
        this.setState({
          plannings: plannings
        });
      },
      data => {
        // error
        console.log("Erreur chargement mesPlannings");
        console.log(data);
        this.setState({
          plannings: []
        });
      }
    );
  };

  planningCheckboxChange = d => {
    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningsJA)) {
      rdv.planningsJA = [];
    }

    if (d.checked) {
      rdv.planningsJA.push({
        id: d.value,
        liste1: 0,
        liste2: 0,
        motif: 0
      });
    } else {
      _.remove(rdv.planningsJA, pl => {
        return pl.id === d.value;
      });
    }

    this.setState({ rdv: rdv });
    if ((this.state.isNewOne || this.state.isExternal) && this.state.patient) {
      // place les cb SMS par défaut
      this.patientLoad(this.state.patient.id);
    }
  };

  planningMotifChange = d => {
    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningsJA)) {
      rdv.planningsJA = [];
    }

    // Recherche d'un planning associé

    _.find(rdv.planningsJA, pl => {
      if (pl.id === d.planning) {
        if (d.planning === this.props.planning) {
          rdv.planningJO.motif = d.value;
        }
        pl.motif = d.value;
        let pc = _.find(this.state.plannings, p => {
          return p.value === pl.id;
        });
        if (this.state.dureeDefaut && pc && pc.motifs) {
          _.find(pc.motifs, motif => {
            if (motif.id === pl.motif) {
              rdv.endAt = moment(this.state.rdv.startAt)
                .add(motif.duree, "minutes")
                .format("YYYY-MM-DDTHH:mm:ss");
              return true;
            }
            return false;
          });
        }
        return true;
      }
      return false;
    });

    if (d.firstplanning) {
      //
      // planning associé à ce motif ?
      let planningsAssocies = this.props.options.reservation.planningsAssocies;

      let associes = _.filter(planningsAssocies, p => {
        return p.motif === Math.abs(d.value) || p.motif === -1;
      });

      if (associes.length > 1) {
        // si plusieurs possibilités on ne conserve que l'association définie pour un motif précis
        associes = _.filter(associes, p => {
          return p.motif === Math.abs(d.value);
        });
      }

      // supprime tous les associés (ils seront redéfinis ensuite)
      _.remove(rdv.planningsJA, pl => {
        return (
          _.findIndex(planningsAssocies, p => {
            return p.planning2 === pl.id;
          }) !== -1
        );
      });

      _.forEach(associes, associe => {
        // il existe un planning associé (et à priori
        // associes ne doit comporter qu'un seul item)

        let i = _.findIndex(rdv.planningsJA, (pl, index) => {
          return pl.id === associe.planning2;
        });
        if (i === -1) {
          //
          // ajoute l'associé défini pour le motif courant
          rdv.planningsJA.push({
            id: associe.planning2,
            liste1: 0,
            liste2: 0,
            motif: associe.motif2 + 1
          });
          if (
            (this.state.isNewOne || this.state.isExternal) &&
            this.state.patient
          ) {
            // place les cb SMS par défaut
            this.patientLoad(this.state.patient.id);
          }
        }
      });
    }

    this.setState({ rdv: rdv });
  };

  rdvPassCardOpen = bool => {
    this.setState({ rdvPassCard: bool });
  };

  patientSearchModalOpen = bool => {
    this.setState({ patientSearchModal: bool });
  };

  rdvEtatsChange = idEtat => {
    let rdv = this.state.rdv;
    rdv.idEtat = idEtat;
    this.setState({ rdv: rdv });
  };

  rappelSMSChange = (e, d) => {
    let rdv = this.state.rdv;
    // non modifiable si déjà envoyé !
    if (!_.isEmpty(rdv.rappelsJO.sms[d.name + "Done"])) {
      return;
    }
    rdv.rappelsJO.modified = true;
    rdv.rappelsJO.sms[d.name] = !rdv.rappelsJO.sms[d.name];
    this.setState({ rdv: rdv });
  };

  // jours bloqués sur le datePicker
  isDayBlocked = day => {
    // day is a moment

    // les jours de fermeture
    if (_.isEmpty(this.props.options.plages.horaires[day.isoWeekday()])) {
      return true;
    }

    // les congés ne sont pas pris en compte (utilisés pour marquer les vacances scolaires)
    /* ne 
    if (
      _.findIndex(this.props.options.reservation.conges, conge => {
        return day.isBetween(conge.start, conge.end);
      }) >= 0
    ) {
      return true;
    }
    */
    /*
      Les jours fériés légaux ne sont pas pris en compte pour l'instant.
      Si cela doit être fait :
      la requête actualiser (voir ci-dessous) devra être lancée
      une seule fois depuis componentWillMount afin
      d'initialiser par un setState un arrray joursFeries
      à tester ensuite ici avec un _.findIndex
    */
    /*
    let params = {
      from: "2017-01-01",
      to: "2020-01-01",
      feries: "true"
    };
    this.props.client.RendezVous.actualiser(
      params,
      (datas, response) => {
        console.log(datas.informations.feries);
      },
      (error, response) => {
      
      }
    );
    */

    return false;
  };

  render() {
    if (!this.props.open) {
      return null;
    }

    let accordionIndex = this.state.accordionIndex;
    let accordionIndex2 = this.state.accordionIndex2;

    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningJO)) {
      return null;
    }

    /*
    let motifIndex = Math.abs(rdv.planningJO.motif) - 1;
    // TODO gérer les rendez-vous pris en ligne (motif < 0) => juste afficher ?

    let motifs = this.props.options.reservation.motifs;

    let couleur = "";

    if (motifIndex >= 0 && motifIndex < motifs.length) {
      couleur = motifs[motifIndex].couleur;
    }
    */

    if (!this.props.isExternal && _.isUndefined(rdv.startAt)) {
      return null;
    }

    // plannings et motifs
    let plannings = this.state.plannings;
    let planning = _.head(plannings);

    plannings = _.drop(plannings);

    let checked = false;
    let motif = 0;
    let pl = _.find(rdv.planningsJA, p => {
      return p.id === planning.value;
    });

    if (!_.isUndefined(pl)) {
      checked = true;
      motif = pl.motif;
    }

    let motifsOptions = [{ value: 0, text: "Aucun motif défini" }];

    let m1 = {};
    for (let i = 0; i < planning.motifs.length; i++) {
      // motifs : id = index si id n'est pas défini (ancienne version)
      if (_.isUndefined(planning.motifs[i].id)) {
        planning.motifs[i].id = i + 1;
      }
      if (planning.motifs[i].id === motif) {
        m1 = planning.motifs[i];
      }
    }

    _.forEach(planning.motifs, (m, i) => {
      if (
        !m.hidden &&
        (rdv.origine === "" || // pour un RDV pris en ligne on reprend tous les motifs
          // /!\ rdv.origine isUndefined (&& isEmpty) si nouveau RDV
          m.autorisationMin >= planning.autorisationMinAgenda)
      ) {
        motifsOptions.push({ value: m.id, text: m.motif });
      }
    });

    let motifColor = m1 ? m1.couleur : "";

    // Rappels SMS
    let showRappels =
      !_.isUndefined(this.state.rdv.idPatient) &&
      !_.isUndefined(this.state.rdv.rappelsJO) &&
      !_.isEmpty(this.state.patient) &&
      !_.isEmpty(this.state.patient.telMobile);

    // téléphones
    let tels = [];
    let firstIsMobile = false;
    if (this.state.rdv.idPatient > 0) {
      if (!_.isEmpty(this.state.patient)) {
        if (!_.isEmpty(this.state.patient.telMobile)) {
          tels.push(telFormat(this.state.patient.telMobile));
          firstIsMobile = true;
        }
        if (!_.isEmpty(this.state.patient.telDomicile)) {
          tels.push(telFormat(this.state.patient.telDomicile));
        }
        if (!_.isEmpty(this.state.patient.telBureau)) {
          tels.push(telFormat(this.state.patient.telBureau));
        }
      } else if (
        !_.isUndefined(this.state.rdv.patientJO) &&
        !_.isEmpty(this.state.rdv.patientJO.telMobile)
      ) {
        tels.push(telFormat(this.state.rdv.patientJO.telMobile));
        firstIsMobile = true;
      }
    } else if (
      !_.isUndefined(this.state.rdv.patientJO) &&
      !_.isEmpty(this.state.rdv.patientJO.telMobile)
    ) {
      tels.push(telFormat(this.state.rdv.patientJO.telMobile));
      firstIsMobile = true;
    }

    return (
      <React.Fragment>
        <Modal open={this.props.open}>
          <Segment clearing={true}>
            <Header size="small" floated="left">
              <Form.Input>
                {this.state.isNewOne || !this.state.rdv.idPatient ? (
                  <React.Fragment>
                    <Ref
                      innerRef={node => {
                        //console.log(node.firstChild.parentElement);
                        //node.firstChild.parentElement.focus();
                      }}
                    >
                      <PatientSearch
                        client={this.props.client}
                        patientChange={this.patientChange}
                        onTextChange={text => {
                          if (text.length === 1) {
                            text = "";
                          }
                          let rdv = this.state.rdv;
                          rdv.idPatient = 0;
                          rdv.description = _.isUndefined(
                            this.state.descriptionSaisie
                          )
                            ? ""
                            : this.state.descriptionSaisie;
                          rdv.titre = text;
                          this.setState({ rdv: rdv });
                        }}
                        format={this.props.denominationFormat}
                        value={
                          this.state.rdv && this.state.rdv.titre
                            ? this.state.rdv.titre
                            : ""
                        }
                        minWidth={215}
                      />
                    </Ref>

                    {window.qWebChannel ? (
                      <React.Fragment>
                        <Popup
                          trigger={
                            <Icon
                              name="user"
                              style={{
                                cursor: "pointer",
                                marginTop: 10
                              }}
                              onClick={() => {
                                window.qWebChannel.currentPatientId(id => {
                                  this.props.client.Patients.completion(
                                    {
                                      ipp2: id,
                                      format: this.props.denominationFormat
                                    },
                                    results => {
                                      if (results.length) {
                                        this.patientChange(
                                          results[0].id,
                                          results[0].completion
                                        );
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
                          position="bottom left"
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
                                marginTop: 10
                              }}
                              onClick={() => {
                                window.qWebChannel.patientCreate2(result => {
                                  this.props.client.Patients.completion(
                                    {
                                      ipp2: result.id,
                                      format: this.props.denominationFormat
                                    },
                                    results => {
                                      if (results.length) {
                                        this.patientChange(
                                          results[0].id,
                                          results[0].completion
                                        );
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
                          position="bottom left"
                          on={helpPopup.on}
                          size={helpPopup.size}
                          inverted={helpPopup.inverted}
                        />
                      </React.Fragment>
                    ) : (
                      ""
                    )}
                    {/* Recherche élargie d'un patient */}
                    <Popup
                      trigger={
                        <Icon
                          name="search"
                          disabled={this.state.patientSearchModal}
                          style={{
                            cursor: "pointer",
                            marginTop: 10
                          }}
                          onClick={() => this.patientSearchModalOpen(true)}
                        />
                      }
                      content="Recherche élargie"
                      position="bottom left"
                      on={helpPopup.on}
                      size={helpPopup.size}
                      inverted={helpPopup.inverted}
                    />
                    <PatientSearchModal
                      open={this.state.patientSearchModal}
                      client={this.props.client}
                      patientChange={this.patientChange}
                      patientSearchModalOpen={this.patientSearchModalOpen}
                    />
                  </React.Fragment>
                ) : (
                  <h3>{this.state.rdv.titre}</h3>
                )}
                {this.state.rdv.idPatient && window.qWebChannel ? (
                  <Popup
                    trigger={
                      <Icon
                        name="folder open"
                        style={{
                          cursor: "pointer",
                          marginTop: this.state.isNewOne ? 11 : 1,
                          marginLeft: this.state.isNewOne ? 3 : 10
                        }}
                        onClick={() => {
                          this.props.client.Patients.read(
                            this.state.rdv.idPatient,
                            {},
                            result => {
                              window.qWebChannel.patientSelect(
                                result.ipp2,
                                () => {
                                  this.handleOk();
                                }
                              );
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
                    position="bottom left"
                    on={helpPopup.on}
                    size={helpPopup.size}
                    inverted={helpPopup.inverted}
                  />
                ) : (
                  ""
                )}
              </Form.Input>
              <Divider hidden={true} fitted={true} />
              <Divider hidden={true} fitted={true} />
              {tels.length ? (
                <span>
                  {_.map(tels, (tel, i) => {
                    return (
                      <React.Fragment key={i}>
                        <Icon
                          name={i === 0 && firstIsMobile ? "mobile" : "phone"}
                        />
                        {tel}
                        &nbsp;&nbsp;
                      </React.Fragment>
                    );
                  })}
                </span>
              ) : (
                <span>&nbsp;</span>
              )}
            </Header>
            <Header
              size="medium"
              floated="right"
              style={{ textAlign: "right" }}
            >
              {this.props.isExternal ? (
                <div>
                  Rendez-vous en attente
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <Icon name="circle" style={{ color: "blue" }} />
                  &nbsp;&nbsp;
                </div>
              ) : (
                <div>
                  <Dropdown
                    text={rdvEtats[this.state.rdv.idEtat].text}
                    style={{ minWidth: 200, textAlign: "right" }}
                  >
                    <Dropdown.Menu scrolling={false}>
                      {_.map(rdvEtats, (etat, i) => {
                        if (i === 0 || i === rdvEtats.length - 1) {
                          return "";
                        } else {
                          return (
                            <Dropdown.Item
                              key={i}
                              onClick={() => this.rdvEtatsChange(i)}
                            >
                              <Icon
                                name="circle"
                                style={{ color: etat.color }}
                              />
                              {etat.text}
                            </Dropdown.Item>
                          );
                        }
                      })}
                    </Dropdown.Menu>
                  </Dropdown>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <Icon
                    name="circle"
                    style={{ color: rdvEtats[this.state.rdv.idEtat].color }}
                  />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                </div>
              )}

              <div>
                Couleur associée au motif&nbsp;&nbsp;&nbsp;
                <Icon
                  name={
                    _.isEmpty(this.state.rdv.couleur)
                      ? "checkmark"
                      : "paint brush"
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    let rdv = this.state.rdv;
                    rdv.couleur = "";
                    this.setState({ rdv: rdv });
                  }}
                />
                <ColorPicker
                  color={
                    _.isEmpty(this.state.rdv.couleur)
                      ? motifColor
                      : this.state.rdv.couleur
                  }
                  onChange={color => {
                    let rdv = this.state.rdv;
                    rdv.couleur = color;
                    this.setState({ rdv: rdv });
                  }}
                />
              </div>
            </Header>
          </Segment>
          <Modal.Content>
            <Grid>
              <Grid.Column width={3} textAlign="center">
                {_.isEmpty(this.state.image) ? (
                  <Icon name="user" size="massive" />
                ) : (
                  <Image
                    /*style={{ height: 150, width: "auto" }}*/
                    src={this.state.image}
                    alt="photo de profil"
                    centered={true}
                  />
                )}
              </Grid.Column>
              <Grid.Column width={13}>
                <Form>
                  {this.props.isExternal ? (
                    ""
                  ) : (
                    <Form.Group widths="equal">
                      <Form.Input label="Horaire">
                        <FromTo
                          hfrom={rdv.startAt.split("T")[1]}
                          hto={rdv.endAt.split("T")[1]}
                          handleChange={(hfrom, hto) => {
                            rdv.startAt =
                              rdv.startAt.split("T")[0] + "T" + hfrom;
                            rdv.endAt = rdv.endAt.split("T")[0] + "T" + hto;
                            this.setState({ rdv: rdv });
                          }}
                        />
                      </Form.Input>
                      <Form.Input label="Jour">
                        <DayPickerInput
                          dayPickerProps={{
                            locale: "fr",
                            localeUtils: MomentLocaleUtils,
                            //disabledDays: [{ daysOfWeek: [0, 6] }],
                            showOutsideDays: true
                          }}
                          format="L"
                          formatDate={formatDate}
                          parseDate={parseDate}
                          placeholder="JJ/MM/AAAA"
                          value={moment(this.state.rdv.startAt).toDate()}
                          onDayChange={day => {
                            let rdv = this.state.rdv;
                            if (day) {
                              let startAt =
                                _.split(moment(day).toISOString(true), "T")[0] +
                                "T" +
                                _.split(rdv.startAt, "T")[1];
                              let endAt =
                                _.split(moment(day).toISOString(true), "T")[0] +
                                "T" +
                                _.split(rdv.endAt, "T")[1];
                              rdv.startAt = startAt;
                              rdv.endAt = endAt;
                              this.setState({ rdv: rdv });
                            }
                          }}
                        />
                      </Form.Input>
                    </Form.Group>
                  )}
                  {/* plannings et motifs */}
                  <Form.Group widths="equal">
                    <Form.Input label="Planning">
                      <Checkbox
                        toggle={true}
                        label={planning.text}
                        value={planning.value}
                        checked={checked}
                        onChange={(e, d) => this.planningCheckboxChange(d)}
                      />
                    </Form.Input>
                    <Form.Input label="Motif">
                      <Dropdown
                        disabled={!checked}
                        fluid={true}
                        value={motif}
                        planning={planning.value}
                        firstplanning="true"
                        selection={true}
                        options={motifsOptions}
                        onChange={(e, d) => this.planningMotifChange(d)}
                      />
                    </Form.Input>
                  </Form.Group>

                  <Accordion>
                    <Accordion.Title
                      content="Autres plannings"
                      active={accordionIndex === 0}
                      index={0}
                      onClick={() => {
                        this.setState({
                          accordionIndex: accordionIndex === 0 ? -1 : 0
                        });
                      }}
                    />
                    <Accordion.Content active={accordionIndex === 0}>
                      <List>
                        {_.map(plannings, (planning2, i) => {
                          let motifsOptions = [
                            { value: 0, text: "Aucun motif défini" }
                          ];
                          _.forEach(planning2.motifs, (m, i) => {
                            if (
                              !m.hidden &&
                              (rdv.origine === "" || // pour un RDV pris en ligne on reprend tous les motifs
                                // /!\ rdv.origine isUndefined (&& isEmpty) si nouveau RDV
                                m.autorisationMin >=
                                  planning.autorisationMinAgenda)
                            ) {
                              motifsOptions.push({
                                value: i + 1,
                                text: m.motif
                              });
                            }
                          });

                          let checked2 = false;
                          let motif2 = 0;
                          let pl2 = _.find(rdv.planningsJA, p => {
                            return p.id === planning2.value;
                          });

                          if (!_.isUndefined(pl2)) {
                            checked2 = true;
                            motif2 = pl2.motif;
                          } else {
                            // plannings associés ?
                            /*
                          let associe = _.find(planningsAssocies, p => {
                            return (
                              p.planning2 === planning2.value &&
                              p.motif === Math.abs(motif) - 1
                            );
                          });
                          if (!_.isUndefined(associe)) {
                            checked2 = true;
                            motif2 = associe.motif2;
                          }
                          */
                          }

                          return (
                            <List.Item key={planning2.value}>
                              <Form.Group widths="equal">
                                <Form.Input>
                                  <Checkbox
                                    toggle={true}
                                    label={planning2.text}
                                    value={planning2.value}
                                    checked={checked2}
                                    onChange={(e, d) =>
                                      this.planningCheckboxChange(d)
                                    }
                                  />
                                </Form.Input>
                                <Form.Input>
                                  <Dropdown
                                    disabled={!checked2}
                                    fluid={true}
                                    value={motif2}
                                    planning={planning2.value}
                                    selection={true}
                                    options={motifsOptions}
                                    onChange={(e, d) =>
                                      this.planningMotifChange(d)
                                    }
                                  />
                                </Form.Input>
                              </Form.Group>
                            </List.Item>
                          );
                        })}
                      </List>
                    </Accordion.Content>
                  </Accordion>
                  {/* plannings et motifs - fin */}
                </Form>
              </Grid.Column>
            </Grid>
            <Form>
              <Form.Group widths="equal">
                <Form.TextArea
                  style={{ resize: "none" }}
                  label="Description"
                  placeholder="Description du rendez-vous"
                  value={rdv.description}
                  onChange={(e, d) => {
                    rdv.description = e.target.value;
                    this.setState({
                      rdv: rdv,
                      descriptionSaisie: e.target.value
                    });
                  }}
                />
                <Form.TextArea
                  style={{ resize: "none" }}
                  label="Commentaire"
                  placeholder="Ajouter un commentaire"
                  value={rdv.commentaire}
                  onChange={(e, d) => {
                    rdv.commentaire = e.target.value;
                    this.setState({ rdv: rdv });
                  }}
                />
              </Form.Group>
            </Form>
            <Accordion>
              <Accordion.Title
                content="Plus de détails"
                active={accordionIndex2 === 0}
                index={0}
                onClick={() => {
                  this.setState({
                    accordionIndex2: accordionIndex2 === 0 ? -1 : 0
                  });
                }}
              />
              <Accordion.Content active={accordionIndex2 === 0}>
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input label="Créateur" floated="right">
                      <span>
                        <Icon name="doctor" size="large" />
                        &nbsp;
                        {rdv.origine === ""
                          ? // /!\ rdv.origine isUndefined (&& isEmpty) si nouveau RDV
                            "RDV pris en ligne"
                          : rdv.origine}
                      </span>
                    </Form.Input>
                    <Form.Input label="Création" floated="right">
                      {moment(rdv.createdAt).format("LLLL")}
                    </Form.Input>
                    <Form.Input label="Dernière modification" floated="right">
                      {moment(rdv.modifiedAt).format("LLLL")}
                    </Form.Input>
                  </Form.Group>
                </Form>

                {showRappels ? (
                  <div>
                    <Divider hidden={true} />
                    <div style={{ marginBottom: "7px" }}>
                      <strong>Rappel du rendez-vous par SMS</strong>
                    </div>
                    <Form>
                      {_.map(rappelsNames, (rappel, index) => (
                        <Form.Group widths="equal" key={index}>
                          <Form.Input label={rappel.label}>
                            <Checkbox
                              name={rappel.rappelName}
                              toggle={true}
                              checked={
                                this.state.rdv.rappelsJO.sms[rappel.rappelName]
                              }
                              onChange={(e, d) => this.rappelSMSChange(e, d)}
                            />
                          </Form.Input>

                          <Form.Input
                            label="Statut"
                            disabled={
                              !this.state.rdv.rappelsJO.sms[rappel.rappelName]
                            }
                          >
                            {this.state.rdv.rappelsJO.sms[rappel.rappelName] ? (
                              _.isEmpty(
                                this.state.rdv.rappelsJO.sms[
                                  rappel.rappelDoneName
                                ]
                              ) ? (
                                <Icon name="checkmark" color="green" />
                              ) : (
                                <Icon name="minus" color="grey" />
                              )
                            ) : (
                              ""
                            )}
                          </Form.Input>

                          <Form.Input
                            label="Date d'envoi"
                            disabled={
                              !this.state.rdv.rappelsJO.sms[rappel.rappelName]
                            }
                          >
                            {this.state.rdv.rappelsJO.sms[rappel.rappelName] ? (
                              !_.isEmpty(
                                this.state.rdv.rappelsJO.sms[
                                  rappel.rappelDoneName
                                ]
                              ) ? (
                                moment(
                                  this.state.rdv.rappelsJO.sms[
                                    rappel.rappelDoneName
                                  ]
                                ).format("LLLL")
                              ) : (
                                <Icon name="minus" color="grey" />
                              )
                            ) : (
                              ""
                            )}
                          </Form.Input>
                        </Form.Group>
                      ))}
                    </Form>

                    {this.state.rdv.rappelsJO.modified &&
                    !_.isUndefined(this.state.patient) &&
                    !this.state.patient.gestionRdvJO.autoriseSMS ? (
                      <Message info={true}>
                        <Message.Content>
                          <Message.Header>
                            L'envoi de SMS n'est pas autorisé par ce patient
                          </Message.Header>
                          Les rappels SMS activés seront néanmoins effectués
                          ponctuellement, uniquement pour ce RDV.
                        </Message.Content>
                      </Message>
                    ) : (
                      ""
                    )}
                  </div>
                ) : (
                  ""
                )}
              </Accordion.Content>
            </Accordion>
            {/*
              Il n'y a pas besoin des props "saved" et "save (fonction)" dans le composant RdvPassCard.
              Elles ne sont utiles que dans le cadre de la fiche du patient.
          */}
            {!this.state.isNewOne &&
            !_.isEmpty(this.state.patient) &&
            !_.isUndefined(this.state.patient.id) ? (
              <RdvPassCard
                open={this.state.rdvPassCard}
                client={this.props.client}
                patient={this.state.patient}
                denomination={this.state.rdv.titre}
                rdvPassCardOpen={this.rdvPassCardOpen}
                patientReload={this.patientLoad}
                //saved
                //save
              />
            ) : null}
          </Modal.Content>
          <Modal.Actions>
            {this.state.isNewOne &&
            !_.isNull(this.idCopiedRdv) &&
            rdv.id !== this.idCopiedRdv ? (
              <Button
                style={{ float: "left" }}
                content="Coller un RDV"
                onClick={() => {
                  this.props.client.RendezVous.read(
                    this.idCopiedRdv,
                    { planning: this.props.planning },
                    myRdv => {
                      let s = moment(myRdv.startAt);
                      let e = moment(myRdv.endAt);
                      let duration = moment.duration(e.diff(s));
                      myRdv.startAt = rdv.startAt;
                      myRdv.endAt = moment(rdv.startAt)
                        .add(duration)
                        .toISOString(true);
                      this.patientLoad(myRdv.idPatient, myRdv);
                    },
                    () => {}
                  );
                }}
              />
            ) : null}

            {!this.state.isNewOne &&
            !_.isEmpty(this.state.patient) &&
            this.state.patient.id ? (
              <React.Fragment>
                <Button
                  style={{ float: "left" }}
                  content={
                    this.idCopiedRdv === rdv.id ? "RDV copié" : "Copier le RDV"
                  }
                  disabled={this.idCopiedRdv === rdv.id}
                  onClick={() => {
                    this.idCopiedRdv = rdv.id;
                    this.setState({}); // forcer le render
                  }}
                />
                <Button
                  content="Tous les rendez-vous"
                  onClick={() => this.setState({ rdvPassCard: true })}
                />
              </React.Fragment>
            ) : null}
            {this.state.isNewOne ? (
              <Button content="Annuler" onClick={this.handleRemove} />
            ) : (
              <React.Fragment>
                <Button
                  content="Supprimer"
                  onClick={() => this.setState({ deleteRdv: true })}
                />
                <Button content="Annuler" onClick={() => this.close()} />
              </React.Fragment>
            )}
            <Ref
              innerRef={node => {
                /*if (!this.state.isNewOne && !_.isNull(node)) {
                  node.focus();
                }*/
              }}
            >
              <Button primary={true} onClick={this.handleOk}>
                OK
              </Button>
            </Ref>
          </Modal.Actions>
        </Modal>

        {/* Modal suppression d'un rendez-vous de l'agenda */}

        <Modal
          size="small"
          open={this.state.deleteRdv && !this.state.isExternal}
        >
          <Modal.Header>Suppression du rendez-vous</Modal.Header>
          <Modal.Content>
            Souhaitez-vous supprimer le rendez-vous ou le marquer comme{" "}
            <strong>annulé</strong> ?
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Retour"
              onClick={() => this.setState({ deleteRdv: false })}
            />
            <Button
              content="Marquer annulé"
              onClick={() => {
                let rdv = this.state.rdv;
                rdv.idEtat = 7;
                this.setState({ rdv: rdv, deleteRdv: false });
                this.handleOk();
              }}
            />
            <Button
              negative={true}
              content="Supprimer"
              onClick={() => {
                this.setState({ deleteRdv: false });
                this.handleRemove();
              }}
            />
          </Modal.Actions>
        </Modal>

        {/* Modal suppression d'un rendez-vous d'une liste d'attente  */}

        <Modal
          size="small"
          open={this.state.deleteRdv && this.state.isExternal}
        >
          <Modal.Header>Supprimer un rendez-vous</Modal.Header>
          <Modal.Content>
            Vous confirmez la suppression du rendez-vous ?
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Annuler"
              onClick={() => this.setState({ deleteRdv: false })}
            />
            <Button
              negative={true}
              content="Supprimer"
              onClick={() => {
                this.setState({ deleteRdv: false });
                this.handleRemove();
              }}
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
