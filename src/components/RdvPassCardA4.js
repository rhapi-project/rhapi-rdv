import React from "react";

import _ from "lodash";

import moment from "moment";

import { rdvDateTime, rdvEtats, site } from "./Settings";
import { print } from "../lib/Helpers";

import {
  Button,
  Checkbox,
  Divider,
  Form,
  Grid,
  Icon,
  List,
  Message,
  Modal,
  Ref
} from "semantic-ui-react";

import DayPickerInput from "react-day-picker/DayPickerInput";
import MomentLocaleUtils, {
  formatDate,
  parseDate
} from "react-day-picker/moment";
import "react-day-picker/lib/style.css";

export default class RdvPassCardA4 extends React.Component {
  state = {
    defaut: true,
    dateRef: moment(),
    commentaires: false,
    etatRdv: false,
    allPlannings: true,
    plannings: [], // les id des plannings
    open: false,
    print: false
  };

  componentDidMount() {
    this.loadPlanningsId(this.props.mesPlannings);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.mesPlannings !== this.props.mesPlannings) {
      this.loadPlanningsId(this.props.mesPlannings);
    }
  }

  /**
   * Chargement des identifiants de tous les plannings reçus en props.
   *
   * Ces valeurs seront utilisées dans la gestion des ajouts et des retraits de
   * plannings (cf option "Tous les plannings" dans la configuration des paramètres d'impression)
   */
  loadPlanningsId = mesPlannings => {
    let pl = [];
    for (let i = 0; i < mesPlannings.length; i++) {
      pl.push(mesPlannings[i].id);
    }
    this.setState({ plannings: pl });
  };

  // Les paramètres d'impression par défaut
  defaut = () => {
    this.setState({
      defaut: true,
      dateRef: moment(),
      commentaires: false,
      etatRdv: false,
      allPlannings: true
    });
    this.loadPlanningsId(this.props.mesPlannings);
  };

  afterPrint = () => {
    this.setState({
      print: false,
      open: false
    });
    this.props.afterPrint();
  };

  render() {
    if (!this.state.open) {
      return (
        <Button
          icon="print"
          content="Historique des RDV"
          onClick={() => this.setState({ open: true })}
        />
      );
    } else {
      return (
        <React.Fragment>
          <Modal
            //size="fullscreen"
            size="large"
            open={this.state.open}
            closeIcon={true}
            onClose={() => {
              this.setState({ open: false });
              this.defaut();
            }}
          >
            <Modal.Header>Historique des rendez-vous</Modal.Header>
            <Modal.Content>
              <Grid>
                <Grid.Row verticalAlign="middle">
                  <Grid.Column width={12}>
                    <Form>
                      <Form.Group widths="equal">
                        <Form.Input label="Paramètres par défaut">
                          <Checkbox
                            toggle={true}
                            checked={this.state.defaut}
                            onChange={(e, d) => {
                              if (d.checked) {
                                this.defaut();
                              } else {
                                this.setState({ defaut: !this.state.defaut });
                              }
                            }}
                          />
                        </Form.Input>
                        <Form.Input label="À partir du" style={{ zIndex: 3 }}>
                          <DayPickerInput
                            dayPickerProps={{
                              locale: "fr",
                              localeUtils: MomentLocaleUtils
                            }}
                            format="L"
                            formatDate={formatDate}
                            parseDate={parseDate}
                            placeholder="JJ/MM/AAAA"
                            value={this.state.dateRef.toDate()}
                            onDayChange={day => {
                              if (day) {
                                this.setState({
                                  dateRef: moment(day),
                                  defaut: false
                                });
                              }
                            }}
                          />
                        </Form.Input>
                      </Form.Group>
                    </Form>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <Ref
                      innerRef={node => {
                        if (!_.isNull(node)) {
                          node.focus();
                        }
                      }}
                    >
                      <Button
                        primary={true}
                        icon="print"
                        content="Imprimer"
                        onClick={() => {
                          this.setState({ print: true });
                        }}
                      />
                    </Ref>
                  </Grid.Column>
                </Grid.Row>

                <Grid.Row stretched={true} verticalAlign="middle">
                  <Grid.Column width={12}>
                    <Form>
                      <Form.Group widths="equal">
                        <Form.Input label="Afficher les commentaires">
                          <Checkbox
                            toggle={true}
                            checked={this.state.commentaires}
                            onChange={(e, d) =>
                              this.setState({
                                defaut: false,
                                commentaires: !this.state.commentaires
                              })
                            }
                          />
                        </Form.Input>
                        <Form.Input label="Afficher les statuts et les statistiques">
                          <Checkbox
                            toggle={true}
                            checked={this.state.etatRdv}
                            onChange={(e, d) => {
                              let dateRef = this.state.dateRef;
                              dateRef = d.checked
                                ? dateRef.diff(moment(), "days") === 0
                                  ? moment("2000-01-01")
                                  : dateRef
                                : dateRef.diff(moment("2000-01-01"), "days") ===
                                  0
                                ? moment()
                                : dateRef;
                              this.setState({
                                defaut: false,
                                etatRdv: !this.state.etatRdv,
                                dateRef: dateRef
                              });
                            }}
                          />
                        </Form.Input>
                      </Form.Group>
                    </Form>
                  </Grid.Column>

                  <Grid.Column width={4}>
                    <Form>
                      <Form.Input label="Tous les plannings">
                        <Checkbox
                          toggle={true}
                          checked={this.state.allPlannings}
                          onChange={(e, d) => {
                            this.setState({
                              defaut: false,
                              allPlannings: !this.state.allPlannings
                            });
                            if (d.checked) {
                              this.loadPlanningsId(this.props.mesPlannings);
                            } else {
                              this.setState({ plannings: [] });
                            }
                          }}
                        />
                      </Form.Input>
                    </Form>
                    {this.state.allPlannings
                      ? ""
                      : _.map(this.props.mesPlannings, (planning, i) => {
                          return (
                            <div key={i}>
                              <Divider />
                              <Checkbox
                                toggle={true}
                                label={planning.titre}
                                checked={_.includes(
                                  this.state.plannings,
                                  planning.id
                                )}
                                onChange={(e, d) => {
                                  if (
                                    _.includes(
                                      this.state.plannings,
                                      planning.id
                                    )
                                  ) {
                                    // enlever planning
                                    let pl = [];
                                    let plannings = this.state.plannings;
                                    for (let j = 0; j < plannings.length; j++) {
                                      if (plannings[j] !== planning.id) {
                                        pl.push(plannings[j]);
                                      }
                                    }
                                    this.setState({ plannings: pl });
                                  } else {
                                    // ajouter planning
                                    let pl = this.state.plannings;
                                    pl.push(planning.id);
                                    //console.log(pl);
                                    this.setState({ plannings: pl });
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                  </Grid.Column>
                </Grid.Row>
              </Grid>

              <Divider />

              <Preview
                id="details"
                patient={this.props.patient}
                client={this.props.client}
                denomination={this.props.denomination}
                praticien={this.props.praticien}
                dateRef={this.state.dateRef}
                commentaires={this.state.commentaires}
                etatRdv={this.state.etatRdv}
                newPassword={this.props.newPassword}
                printWithPassword={this.props.printWithPassword}
                plannings={this.state.plannings}
                mesPlannings={this.props.mesPlannings}
                print={this.state.print}
                afterPrint={this.afterPrint}
                onlineRdv={this.props.onlineRdv}
              />
            </Modal.Content>
          </Modal>
        </React.Fragment>
      );
    }
  }
}

class Preview extends React.Component {
  state = {
    mesRdv: [],
    infos: {
      presence: 0,
      retardImportant: 0,
      absEtAnnul: 0
    }
  };

  componentDidMount() {
    this.reload(this.props.dateRef);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.dateRef !== this.props.dateRef) {
      // si la date est modifiée, on recharge mesRdv
      this.reload(this.props.dateRef);
    } else if (this.props.print && prevProps.print !== this.props.print) {
      this.print();
    }
  }

  reload = dateRef => {
    if (!_.isNull(dateRef)) {
      this.props.client.RendezVous.mesRendezVous(
        {
          ipp: this.props.patient.id,
          from: dateRef.toISOString()
        },
        result => {
          // success
          // les rendez-vous annulés (masqués) ne sont pas affichés qu'en mode "statistiques"
          let mesRdv = result.results;
          if (!this.props.etatRdv) {
            mesRdv = _.filter(mesRdv, function(o) {
              return o.idEtat !== 7;
            });
          }
          this.setState({ mesRdv: mesRdv });
        },
        () => {
          // error
          console.log(
            "Erreur this.props.client.RendezVous.mesRendezVous dans la Preview"
          );
        }
      );
    }
  };

  motif = (rdv, planningId) => {
    let m = "";
    let index = _.findIndex(rdv.planningsJA, planning => {
      return planning.id === planningId;
    });
    if (index !== -1) {
      let motif = rdv.planningsJA[index].motif;
      if (motif !== 0) {
        // rechercher motif
        let index2 = _.findIndex(this.props.mesPlannings, planning => {
          return planning.id === planningId;
        });
        if (index2 !== -1) {
          m =
            this.props.mesPlannings[index2].optionsJO.reservation.motifs[
              Math.abs(motif) - 1
            ].motif + (motif < 0 ? " (RDV pris en ligne)" : "");
        }
      }
    }
    return m;
  };

  afficherRdv = rdv => {
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (_.includes(this.props.plannings, rdv.planningsJA[i].id)) {
        return true;
      }
    }
    return false;
  };

  print = () => {
    if (_.isEmpty(this.state.mesRdv) && !this.state.printWithPassword) {
      return;
    }

    let content = document.getElementById("details");

    let win = window.open("", "Impression", "height=600,width=800");

    win.document.write("<html><head>");
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="print-css/semantic-ui-css/semantic.min.css" />'
    );
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="print-css/a4.css" />'
    );
    win.document.write("</head><body>");
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");

    win.document.close();
    win.focus();

    let windowClose = () => {
      win.close();
    };

    print(this, win, this.props.afterPrint, windowClose);
  };

  render() {
    let infos = "";
    let siteUrl = "";
    let identifiant = "";
    if (this.props.printWithPassword) {
      siteUrl =
        window.location.origin +
        window.location.pathname
          .split("/")
          .slice(0, -1)
          .join("/") +
        "/#Patients/";
      identifiant =
        this.props.patient.id +
        "@" +
        this.props.praticien.organisation.split("@")[0];
      infos = siteUrl;
      infos += this.props.patient.id;
      infos += ":" + this.props.newPassword;
      infos += "@" + this.props.praticien.organisation.split("@")[0];
    }

    /*
      Regroupements des états pour les statistiques
      0 n'est pas pris en compte
      1, 2 : Présence à l'heure ou non renseigné
      3, 4 : Retard
      5, 6 : Absence ou annulation
    */

    let etat = { presences: 0, retards: 0, absences: 0 };
    if (this.props.etatRdv && this.state.mesRdv.length) {
      let n = this.state.mesRdv.length;
      _.each(this.state.mesRdv, rdv => {
        let e = rdv.idEtat;
        if (e > 4) {
          etat.absences++;
        } else if (e > 2) {
          etat.retards++;
        } else {
          etat.presences++;
        }
      });
      etat.absencesPc = Math.round((100 * etat.absences) / n);
      etat.retardsPc = Math.round((100 * etat.retards) / n);
      etat.presencesPc = 100 - etat.absencesPc - etat.retardsPc;
    }

    return (
      <div
        className="preview-details"
        style={{
          overflowY: "scroll",
          height:
            _.isEmpty(this.state.mesRdv) && !this.props.printWithPassword
              ? "50px"
              : "300px"
        }}
      >
        <div
          id="details"
          className="impression-details"
          style={{ margin: "0 auto" }}
        >
          {_.isEmpty(this.state.mesRdv) && !this.props.printWithPassword ? (
            <Message>
              <Message.Content style={{ textAlign: "center" }}>
                <p>Aucun rendez-vous n'a été trouvé !</p>
              </Message.Content>
            </Message>
          ) : (
            <div>
              {_.isUndefined(this.props.praticien) ? (
                ""
              ) : (
                <div
                  className="coordonnees-praticien"
                  style={{ marginLeft: "10px", marginTop: "0px" }}
                >
                  <span
                    className="praticien-currentName"
                    style={{ fontSize: "18px" }}
                  >
                    <strong>{this.props.praticien.currentName}</strong>
                  </span>
                  <br />
                  <span>{this.props.praticien.account.adresse1}</span>
                  <br />
                  {this.props.praticien.account.adresse2 !== "" ||
                  this.props.praticien.account.adresse3 !== "" ? (
                    <span>
                      {this.props.praticien.account.adresse2 +
                        " " +
                        this.props.praticien.account.adresse3}
                      <br />
                    </span>
                  ) : (
                    ""
                  )}
                  <span>
                    {this.props.praticien.account.codePostal +
                      " " +
                      this.props.praticien.account.ville}
                  </span>
                  <br />
                  <span>
                    {this.props.praticien.account.telBureau !== ""
                      ? "Tél. " +
                        this.props.praticien.account.telBureau +
                        " (Bureau)"
                      : ""}
                  </span>
                  <br />
                  <span>{this.props.praticien.account.email}</span>
                </div>
              )}

              <div
                className="titre-principal"
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                  textAlign: "center",
                  fontSize: "20px"
                }}
              >
                <b>{"Rendez-vous de " + this.props.denomination}</b>
              </div>

              <div className="new-password" style={{ marginBottom: "20px" }}>
                {this.props.printWithPassword && this.props.onlineRdv ? (
                  <p>
                    {site.title} : <b>{siteUrl}</b>
                    <br />
                    Identifiant : <b>{identifiant}</b>
                    <br />
                    Mot de passe : <b>{this.props.newPassword}</b>
                    <br />
                    Lien direct : <b>{infos}</b>
                  </p>
                ) : (
                  ""
                )}
              </div>

              {this.props.etatRdv ? (
                <div>
                  <span>
                    <Icon name="chart pie" />
                    <strong>Statistiques ponctualité</strong>
                  </span>
                  <table style={{ marginTop: "10px" }}>
                    <tbody>
                      <tr>
                        <td style={{ minWidth: 20 }} />
                        <td>Nombre de rendez-vous</td>
                        <td style={{ textAlign: "right" }}>
                          {this.state.mesRdv.length}
                        </td>
                      </tr>
                      <tr>
                        <td />
                        <td>Présences à l'heure</td>
                        <td style={{ textAlign: "right" }}>{etat.presences}</td>
                        <td style={{ textAlign: "right" }}>
                          {etat.presencesPc}
                          &nbsp;%
                        </td>
                      </tr>
                      <tr>
                        <td />
                        <td>Retards</td>
                        <td style={{ textAlign: "right" }}>{etat.retards}</td>
                        <td style={{ textAlign: "right" }}>
                          {etat.retardsPc}
                          &nbsp; %
                        </td>
                      </tr>
                      <tr>
                        <td />
                        <td>Absences ou annulations</td>
                        <td style={{ textAlign: "right" }}>{etat.absences}</td>
                        <td style={{ textAlign: "right" }}>
                          {etat.absencesPc}
                          &nbsp; %
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Divider hidden={true} />
                </div>
              ) : (
                ""
              )}

              <div>
                <List>
                  {_.map(this.state.mesRdv, (item, i) => {
                    if (this.afficherRdv(item)) {
                      return (
                        <List.Item className="rdv-list-item" key={i}>
                          <Icon name="calendar" />
                          <List.Content>
                            <List.Header>
                              {this.props.etatRdv
                                ? _.upperFirst(rdvDateTime(item.startAt)) +
                                  " - " +
                                  rdvEtats[item.idEtat].text
                                : _.upperFirst(rdvDateTime(item.startAt))}
                            </List.Header>
                            <List.List>
                              <List.Item>
                                {this.props.plannings.length === 0 ? (
                                  ""
                                ) : (
                                  <table>
                                    <tbody>
                                      {_.map(
                                        item.planningsJA,
                                        (planning, p) => {
                                          let index = _.findIndex(
                                            this.props.mesPlannings,
                                            planning2 => {
                                              return (
                                                planning.id === planning2.id
                                              );
                                            }
                                          );
                                          if (index === -1) {
                                            return null;
                                          } else {
                                            let m = this.motif(
                                              item,
                                              planning.id
                                            );
                                            return (
                                              <tr key={p}>
                                                <td
                                                  style={{
                                                    verticalAlign: "top",
                                                    width: "180px"
                                                  }}
                                                >
                                                  {
                                                    this.props.mesPlannings[
                                                      index
                                                    ].titre
                                                  }
                                                </td>
                                                <td
                                                  style={{
                                                    verticalAlign: "top"
                                                  }}
                                                >
                                                  {m !== "" ? (
                                                    <Icon name="info circle" />
                                                  ) : (
                                                    ""
                                                  )}
                                                </td>
                                                <td>{m}</td>
                                              </tr>
                                            );
                                          }
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                )}
                              </List.Item>
                              {item.description === "" ? (
                                ""
                              ) : (
                                <List.Item>
                                  <table>
                                    <tbody>
                                      <tr>
                                        <td style={{ verticalAlign: "top" }}>
                                          {item.description !== "" ? (
                                            <Icon name="edit" />
                                          ) : (
                                            ""
                                          )}
                                        </td>
                                        <td>
                                          {_.map(
                                            item.description.split("\n"),
                                            (line, i) => {
                                              return (
                                                <React.Fragment key={i}>
                                                  {line}
                                                  <br />
                                                </React.Fragment>
                                              );
                                            }
                                          )}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </List.Item>
                              )}
                              {this.props.commentaires ? (
                                <List.Item>
                                  <table>
                                    <tbody>
                                      <tr>
                                        <td style={{ verticalAlign: "top" }}>
                                          {item.commentaire !== "" ? (
                                            <Icon name="sticky note outline" />
                                          ) : (
                                            ""
                                          )}
                                        </td>
                                        <td>
                                          {_.map(
                                            item.commentaire.split("\n"),
                                            (line, i) => {
                                              return (
                                                <React.Fragment key={i}>
                                                  {line}
                                                  <br />
                                                </React.Fragment>
                                              );
                                            }
                                          )}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </List.Item>
                              ) : (
                                ""
                              )}
                            </List.List>
                          </List.Content>
                        </List.Item>
                      );
                    }
                  })}
                </List>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
