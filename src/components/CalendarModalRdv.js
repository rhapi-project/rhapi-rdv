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
  Accordion
} from "semantic-ui-react";

import TimeField from "react-simple-timefield";

import moment from "moment";

import { maxWidth /*, hsize, fsize*/, rdvDateTime, rdvEtats } from "./Settings";

import PatientSearch from "./PatientSearch";

import ColorPicker from "./ColorPicker";

import RdvPassCard from "./RdvPassCard";

import { SingleDatePicker } from "react-dates";

class FromTo extends React.Component {
  componentWillMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  componentWillReceiveProps(next) {
    this.setState({ hfrom: next.hfrom, hto: next.hto });
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
          onChange={value => this.handleChange(value, "hfrom")}
          input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
        <Label size="large" style={{ marginTop: 5 }} content="à" />
        <TimeField
          value={hto} // {String}   required, format '00:00' or '00:00:00'
          onChange={value => this.handleChange(value, "hto")}
          //input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
      </div>
    );
  }
}

export default class CalendarModalRdv extends React.Component {
  //plannings = [];

  componentWillMount() {
    this.setState({
      rdvPassCard: false,
      deleteRdv: false,
      dateRdvFocused: false
    });
    this.reload(this.props);
  }

  componentWillReceiveProps(next) {
    if (next.open) {
      this.reload(next);
    }
    this.setState({ image: "", accordionIndex: -1, accordionIndex2: -1 });
  }

  patientLoad = idPatient => {
    this.props.client.Patients.read(
      idPatient,
      {},
      patient => {
        // success
        if (patient.gestionRdvJO.autoriseSMS) {
          // prendre les rappels qui sont définis dans les plannings
          // s'il n'y a pas encore eu de modifications sur le rdv
          // par rapport aux rappels SMS
          _.findIndex(this.state.plannings, planning => {
            if (
              planning.sms &&
              planning.sms.confirmationTexte &&
              planning.sms.confirmationTexte !== "" &&
              (planning.sms.rappel1 ||
                planning.sms.rappel24 ||
                planning.sms.rappel48)
            ) {
              let sms = {};
              sms.rappel1 = this.state.isNewOne
                ? planning.sms.rappel1
                : this.state.rdv.rappelsJO.sms.rappel1;
              sms.rappel24 = this.state.isNewOne
                ? planning.sms.rappel24
                : this.state.rdv.rappelsJO.sms.rappel24;
              sms.rappel48 = this.state.isNewOne
                ? planning.sms.rappel48
                : this.state.rdv.rappelsJO.sms.rappel48;
              sms.rappel1Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel1Done;
              sms.rappel24Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel24Done;
              sms.rappel48Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel48Done;

              let rdv = this.state.rdv;
              if (_.isEmpty(rdv.rappelsJO)) {
                let rappelsJO = {};
                rappelsJO.sms = sms;
                rappelsJO.modified = this.state.isNewOne
                  ? false
                  : this.state.rdv.rappelsJO.modified;
                rdv.rappelsJO = rappelsJO;
              } else {
                rdv.rappelsJO.sms = sms;
                rdv.rappelsJO.modified = this.state.isNewOne
                  ? false
                  : this.state.rdv.rappelsJO.modified; // à revoir
              }
              this.setState({ rdv: rdv });
              return true;
            } else {
              let sms = {};
              sms.rappel1 = this.state.isNewOne
                ? false
                : this.state.rdv.rappelsJO.sms.rappel1;
              sms.rappel24 = this.state.isNewOne
                ? false
                : this.state.rdv.rappelsJO.sms.rappel24;
              sms.rappel48 = this.state.isNewOne
                ? false
                : this.state.rdv.rappelsJO.sms.rappel48;
              sms.rappel1Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel1Done;
              sms.rappel24Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel24Done;
              sms.rappel48Done = this.state.isNewOne
                ? ""
                : this.state.rdv.rappelsJO.sms.rappel48Done;

              let rdv = this.state.rdv;
              if (_.isEmpty(rdv.rappelsJO)) {
                let rappelsJO = {};
                rappelsJO.sms = sms;
                rappelsJO.modified = this.state.isNewOne
                  ? false
                  : this.state.rdv.rappelsJO.modified;
                rdv.rappelsJO = rappelsJO;
              } else {
                rdv.rappelsJO.sms = sms;
                rdv.rappelsJO.modified = this.state.isNewOne
                  ? false
                  : this.state.rdv.rappelsJO.modified; // à revoir
              }
              this.setState({ rdv: rdv });
              return false;
            }
          });
        } else {
          // l'envoi SMS n'est pas autorisé chez ce patient,
          // s'il c'est un nouveau rendez-vous, mettre tous les rappels à false
          let sms = {};
          sms.rappel1 = this.state.isNewOne
            ? false
            : this.state.rdv.rappelsJO.sms.rappel1;
          sms.rappel24 = this.state.isNewOne
            ? false
            : this.state.rdv.rappelsJO.sms.rappel24;
          sms.rappel48 = this.state.isNewOne
            ? false
            : this.state.rdv.rappelsJO.sms.rappel48;
          sms.rappel1Done = this.state.isNewOne
            ? ""
            : this.state.rdv.rappelsJO.sms.rappel1Done;
          sms.rappel24Done = this.state.isNewOne
            ? ""
            : this.state.rdv.rappelsJO.sms.rappel24Done;
          sms.rappel48Done = this.state.isNewOne
            ? ""
            : this.state.rdv.rappelsJO.sms.rappel48Done;

          let rdv = this.state.rdv;
          if (_.isEmpty(rdv.rappelsJO)) {
            let rappelsJO = {};
            rappelsJO.sms = sms;
            rappelsJO.modified = this.state.isNewOne
              ? false
              : this.state.rdv.rappelsJO.modified;
            rdv.rappelsJO = rappelsJO;
          } else {
            rdv.rappelsJO.sms = sms;
            rdv.rappelsJO.modified = this.state.isNewOne
              ? false
              : this.state.rdv.rappelsJO.modified; // à revoir
          }
          this.setState({ rdv: rdv });
        }
        this.setState({ patient: patient });
        this.setState({ image: patient.profilJO.base64 });
      },
      data => {
        // error
        console.log("Erreur lecture patient");
        this.setState({ image: "" });
      }
    );
  };

  reload = next => {
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
            //console.log(associe);
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
        rdv.startAt = _.isUndefined(next.selectStart)
          ? ""
          : next.selectStart.toISOString();
        rdv.endAt = _.isUndefined(next.selectEnd)
          ? rdv.startAt
          : next.selectEnd.toISOString();
      }
    } else {
      // (re)lire le rdv depuis le client
      this.props.client.RendezVous.read(
        event.id,
        { planning: this.props.planning },
        rdv => {
          //console.log(rdv);
          this.patientLoad(rdv.idPatient);
          this.setState({ rdv: rdv });
        },
        () => {}
      );
    }
    this.planningsSelect();
    this.setState({ isNewOne: isNewOne, rdv: rdv });
  };

  close = () => {
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
  };

  planningMotifChange = d => {
    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningsJA)) {
      rdv.planningsJA = [];
    }

    _.find(rdv.planningsJA, pl => {
      if (pl.id === d.planning) {
        if (d.planning === this.props.planning) {
          rdv.planningJO.motif = d.value;
        }
        pl.motif = d.value;
        return true;
      }
      return false;
    });

    if (d.firstplanning) {
      //
      // planning associé à ce motif ?
      let planningsAssocies = this.props.options.reservation.planningsAssocies;
      let associe = _.find(planningsAssocies, p => {
        return p.motif === Math.abs(d.value) - 1 || p.motif === -1;
      });

      if (!_.isUndefined(associe)) {
        // il existe un planning associé

        let i = _.findIndex(rdv.planningsJA, pl => {
          return pl.id === associe.planning2;
        });
        if (i === -1) {
          // associé non défini
          //console.log(associe);
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

    this.setState({ rdv: rdv });
  };

  rdvPassCardOpen = bool => {
    this.setState({ rdvPassCard: bool });
  };

  rdvEtatsChange = idEtat => {
    let rdv = this.state.rdv;
    rdv.idEtat = idEtat;
    this.setState({ rdv: rdv });
  };

  rappelSMSChange = (e, d) => {
    let rdv = this.state.rdv;
    rdv.rappelsJO.modified = true;
    rdv.rappelsJO.sms[d.name] = !this.state.rdv.rappelsJO.sms[d.name];
    this.setState({ rdv: rdv });
  };

  // bloquer des jours sur le datePicker
  // TODO : Bloquer les jours fériés
  isDayBlocked = day => {
    // day est un objet "moment"
    let d = _.split(day._d, " ")[0];

    // on bloque les jeudis et les dimanches
    return d === "Thu" || d === "Sun";
  };

  render() {
    if (!this.props.open) {
      return "";
    }

    let accordionIndex = this.state.accordionIndex;
    let accordionIndex2 = this.state.accordionIndex2;

    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningJO)) {
      return "";
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
      return "";
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

    let motifsOptions = [];

    _.forEach(planning.motifs, (motif, i) => {
      if (
        !motif.hidden &&
        motif.autorisationMin >= planning.autorisationMinAgenda
      ) {
        motifsOptions.push({ value: i + 1, text: motif.motif });
      }
    });
    // plannings et motifs - fin

    // Rappels SMS
    let showRappels =
      !_.isUndefined(this.state.rdv.idPatient) &&
      !_.isUndefined(this.state.rdv.rappelsJO) &&
      (!_.isEmpty(this.state.patient) && this.state.patient.telMobile !== "");

    //console.log(this.state.rdv);
    //console.log(moment(this.state.rdv.startAt));
    return (
      <React.Fragment>
        <Modal open={this.props.open}>
          <Segment clearing={true}>
            <Header size="medium" floated="left">
              {this.state.isNewOne ? (
                <Ref innerRef={node => node.firstChild.parentElement.focus()}>
                  <PatientSearch
                    client={this.props.client}
                    patientChange={this.patientChange}
                    format={this.props.denominationFormat}
                  />
                </Ref>
              ) : (
                this.state.rdv.titre
              )}
            </Header>
            <Header
              size="medium"
              floated="right"
              style={{ textAlign: "right" }}
            >
              {this.props.isExternal ? (
                "Rendez-vous en attente"
              ) : (
                //: moment(this.state.rdv.startAt).format("LLLL")
                <div
                  onClick={() =>
                    this.setState({
                      dateRdvFocused: !this.state.dateRdvFocused
                    })
                  }
                >
                  <SingleDatePicker
                    disabled={true}
                    small={true}
                    noBorder={true}
                    hideKeyboardShortcutsPanel={true}
                    isOutsideRange={() => false}
                    isDayBlocked={day => this.isDayBlocked(day)}
                    date={moment(this.state.rdv.startAt)}
                    numberOfMonths={2}
                    onClose={() => this.setState({ dateRdvFocused: false })}
                    onDateChange={dateRdv => {
                      let rdv = this.state.rdv;
                      if (dateRdv) {
                        let startAt =
                          _.split(dateRdv.toISOString(), "T")[0] +
                          "T" +
                          _.split(rdv.startAt, "T")[1];
                        let endAt =
                          _.split(dateRdv.toISOString(), "T")[0] +
                          "T" +
                          _.split(rdv.endAt, "T")[1];
                        rdv.startAt = startAt;
                        rdv.endAt = endAt;
                        this.setState({ rdv: rdv });
                      } else {
                        console.log("dateRdv est null");
                        return;
                      }
                    }}
                    focused={this.state.dateRdvFocused}
                    onFocusChange={() => {}}
                  />
                </div>
              )}
              <div>
                <Icon
                  name="circle"
                  color={rdvEtats[this.state.rdv.idEtat].color}
                />
                <Dropdown text={rdvEtats[this.state.rdv.idEtat].text}>
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
                            <Icon name="circle" color={etat.color} />
                            {etat.text}
                          </Dropdown.Item>
                        );
                      }
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Header>
          </Segment>
          <Modal.Content>
            <Grid>
              <Grid.Column width={3}>
                {_.isEmpty(this.state.image) ? (
                  <Icon name="user" size="massive" />
                ) : (
                  <Image
                    size="massive"
                    src={this.state.image}
                    alt="Photo de profil"
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
                      <Form.Input label="Couleur">
                        <ColorPicker
                          color={this.state.rdv.couleur}
                          onChange={color => {
                            let rdv = this.state.rdv;
                            rdv.couleur = color;
                            this.setState({ rdv: rdv });
                          }}
                        />
                        <Icon
                          name="close"
                          size="large"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            let rdv = this.state.rdv;
                            rdv.couleur = "";
                            this.setState({ rdv: rdv });
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
                          let motifsOptions = [];
                          _.forEach(planning2.motifs, (motif2, i) => {
                            if (
                              !motif2.hidden &&
                              motif2.autorisationMin >=
                                planning2.autorisationMinAgenda
                            ) {
                              motifsOptions.push({
                                value: i + 1,
                                text: motif2.motif
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
                    this.setState({ rdv: rdv });
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
                        {rdv.origine}
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
                      <Form.Group widths="equal">
                        <Form.Input label="Rappel à 48h">
                          <Checkbox
                            name="rappel48"
                            toggle={true}
                            checked={this.state.rdv.rappelsJO.sms.rappel48}
                            onChange={(e, d) => this.rappelSMSChange(e, d)}
                          />
                        </Form.Input>

                        <Form.Input
                          label="Statut"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel48}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel48 ? (
                            this.state.rdv.rappelsJO.sms.rappel48Done !== "" ? (
                              <Icon name="checkmark" color="green" />
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>

                        <Form.Input
                          label="Date d'envoi"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel48}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel48 ? (
                            this.state.rdv.rappelsJO.sms.rappel48Done !== "" ? (
                              rdvDateTime(
                                this.state.rdv.rappelsJO.sms.rappel48Done
                              )
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>
                      </Form.Group>
                      <Form.Group widths="equal">
                        <Form.Input label="Rappel à 24h">
                          <Checkbox
                            name="rappel24"
                            toggle={true}
                            checked={this.state.rdv.rappelsJO.sms.rappel24}
                            onChange={(e, d) => this.rappelSMSChange(e, d)}
                          />
                        </Form.Input>
                        <Form.Input
                          label="Statut"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel24}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel24 ? (
                            this.state.rdv.rappelsJO.sms.rappel24Done !== "" ? (
                              <Icon name="checkmark" color="green" />
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>

                        <Form.Input
                          label="Date d'envoi"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel24}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel24 ? (
                            this.state.rdv.rappelsJO.sms.rappel24Done !== "" ? (
                              rdvDateTime(
                                this.state.rdv.rappelsJO.sms.rappel24Done
                              )
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>
                      </Form.Group>

                      <Form.Group widths="equal">
                        <Form.Input label="Rappel à 1h">
                          <Checkbox
                            name="rappel1"
                            toggle={true}
                            checked={this.state.rdv.rappelsJO.sms.rappel1}
                            onChange={(e, d) => this.rappelSMSChange(e, d)}
                          />
                        </Form.Input>
                        <Form.Input
                          label="Statut"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel1}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel1 ? (
                            this.state.rdv.rappelsJO.sms.rappel1Done !== "" ? (
                              <Icon name="checkmark" color="green" />
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>

                        <Form.Input
                          label="Date d'envoi"
                          disabled={!this.state.rdv.rappelsJO.sms.rappel1}
                        >
                          {this.state.rdv.rappelsJO.sms.rappel1 ? (
                            this.state.rdv.rappelsJO.sms.rappel1Done !== "" ? (
                              rdvDateTime(
                                this.state.rdv.rappelsJO.sms.rappel1Done
                              )
                            ) : (
                              <Icon name="minus" color="red" />
                            )
                          ) : (
                            ""
                          )}
                        </Form.Input>
                      </Form.Group>
                    </Form>
                    {this.state.rdv.rappelsJO.modified &&
                    !_.isUndefined(this.state.patient) &&
                    !this.state.patient.gestionRdvJO.autoriseSMS ? (
                      <Message info={true}>
                        <Message.Content>
                          <Message.Header>
                            L'envoi de SMS n'est pas autorisé pour ce patient
                          </Message.Header>
                          <p>
                            Les rappels SMS activés seront faites uniquement
                            pour ce rendez-vous !
                          </p>
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
              Elles seront utiles dans le cas où nous sommes sur l'interface de 
              la fiche du patient.
          */}
            {!this.state.isNewOne && !_.isEmpty(this.state.patient) ? (
              <RdvPassCard
                open={this.state.rdvPassCard}
                client={this.props.client}
                patient={this.state.patient}
                denomination={
                  this.state.patient.nom + " " + this.state.patient.prenom
                }
                // TODO : pour la dénomination voir dans FichePatient.js
                //        comment les valeurs sont obtenues
                rdvPassCardOpen={this.rdvPassCardOpen}
                patientReload={this.patientLoad}
                //saved
                //save
              />
            ) : (
              ""
            )}
          </Modal.Content>
          <Modal.Actions>
            {!this.state.isNewOne ? (
              <Button onClick={() => this.setState({ rdvPassCard: true })}>
                Tous les rendez-vous
              </Button>
            ) : (
              ""
            )}
            {/*<Button negative={!this.state.isNewOne} onClick={this.handleRemove}>
            {this.state.isNewOne ? "Annuler" : "Supprimer"}
          </Button>*/}
            {this.state.isNewOne ? (
              <Button content="Annuler" onClick={this.handleRemove} />
            ) : (
              <Button
                content="Supprimer"
                onClick={() => this.setState({ deleteRdv: true })}
              />
            )}
            <Ref
              innerRef={node => {
                if (!this.state.isNewOne) {
                  node.focus();
                }
              }}
            >
              <Button primary={true} onClick={this.handleOk}>
                OK
              </Button>
            </Ref>
          </Modal.Actions>
        </Modal>

        {/* Modal suppression d'un rendez-vous */}

        <Modal size="small" open={this.state.deleteRdv}>
          <Modal.Header>Suppression du rendez-vous</Modal.Header>
          <Modal.Content>
            Voulez-vous supprimer le rendez-vous ou le marquer comme{" "}
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
      </React.Fragment>
    );
  }
}
