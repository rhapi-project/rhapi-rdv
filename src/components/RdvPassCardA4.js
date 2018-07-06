import React from "react";

import _ from "lodash";

import moment from "moment";

import { rdvDateTime, rdvEtats, site } from "./Settings";

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

import { SingleDatePicker } from "react-dates";

export default class RdvPassCardA4 extends React.Component {
  state = {
    defaut: true,
    //dateRefCheckbox: false,
    dateRef: moment(),
    //dateRefFocused: false,
    commentaires: false,
    etatRdv: false,
    allPlannings: true,
    plannings: [], // les id des plannings
    open: false,
    print: false
  };

  componentWillMount() {
    this.loadPlanningsId(this.props.mesPlannings);
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
      //dateRefCheckbox: false,
      dateRef: moment(),
      //dateRefFocused: false,
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
            size="fullscreen"
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
                        <Form.Input label="À partir du">
                          <SingleDatePicker
                            placeholder="JJ/MM/AAAA"
                            hideKeyboardShortcutsPanel={true}
                            withPortal={true}
                            isOutsideRange={() => false}
                            date={this.state.dateRef}
                            numberOfMonths={1}
                            readOnly={false}
                            //onOutsideClick={() => {}}
                            /*onClose={() =>
                              this.setState({ dateRefFocused: false })
                            }*/
                            onDateChange={date => {
                              this.setState({ dateRef: null });
                              if (!_.isNull(date)) {
                                this.setState({ dateRef: date });
                              }
                            }}
                            //focused={this.state.dateRefFocused}
                            onFocusChange={() => {}}
                          />
                        </Form.Input>
                      </Form.Group>
                    </Form>
                  </Grid.Column>
                  <Grid.Column width={4} /*textAlign="center"*/>
                    <Ref
                      innerRef={node => node.firstChild.parentElement.focus()}
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
                        <Form.Input label="Afficher l'état des rendez-vous">
                          <Checkbox
                            toggle={true}
                            checked={this.state.etatRdv}
                            onChange={(e, d) =>
                              this.setState({
                                defaut: false,
                                etatRdv: !this.state.etatRdv
                              })
                            }
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
              />
            </Modal.Content>
          </Modal>
        </React.Fragment>
      );
    }
  }
}

/*
 * Regroupement des états pour les statistiques
 * 0 n'est pas pris en compte
 * 1, 2 et 3 : présence
 * 4 : Retar important
 * 5, 6 et 7 : Absence ou annulation
 */

class Preview extends React.Component {
  state = {
    mesRdv: [],
    infos: {
      presence: 0,
      retardImportant: 0,
      absEtAnnul: 0
    }
  };

  componentWillMount() {
    this.reload(this.props.dateRef);
  }

  componentWillReceiveProps(next) {
    if (this.props.dateRef !== next.dateRef) {
      // si la date est modifiée, on recharge mesRdv
      this.reload(next.dateRef);
    } else {
      if (next.print) {
        this.print();
      }
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
          //console.log(result.results);

          let infos = this.state.infos;
          infos.presence = 0;
          infos.retardImportant = 0;
          infos.absEtAnnul = 0;

          this.setState({ mesRdv: result.results });

          let mesRdv = result.results;
          for (let i = 0; i < mesRdv.length; i++) {
            // L'idEtat 0 n'est pas pris en compte
            if (_.includes([1, 2, 3], mesRdv[i].idEtat)) {
              infos.presence += 1;
            } else if (mesRdv[i].idEtat === 4) {
              infos.retardImportant += 1;
            } else if (_.includes([5, 6, 7], mesRdv[i].idEtat)) {
              infos.absEtAnnul += 1;
            }
          }
          this.setState({ infos: infos });
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

    if (_.isEmpty(this.state.mesRdv) && !this.state.printWithPassword) {
      this.afterPrint();
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

    let mediaQueryList = win.matchMedia("print");

    // Safari mediaQueryList.addListener
    if (mediaQueryList) {
      mediaQueryList.addListener(mql => {
        if (!mql.matches) {
          win.close();
          this.afterPrint();
        }
      });
    }

    // Microsoft Internet Explorer ou Edge
    if (
      navigator.userAgent.indexOf("Edge/") !== -1 ||
      navigator.userAgent.indexOf("MSIE") !== -1
    ) {
      this.browserDelay = _.isUndefined(this.browserDelay) ? 1500 : 500;

      _.delay(() => {
        win.print();
      }, this.browserDelay);

      win.onafterprint = () => {
        // win.close(); // crash => impossibilité de fermer la fenêtre ici !
        this.props.afterPrint();
      };
      return;
    }

    // Firefox et Chrome onafterprint
    win.onafterprint = () => {
      win.close();
      this.props.afterPrint();
    };

    if (navigator.userAgent.indexOf("Firefox") === -1) {
      /*
      Delay requis par les navigateurs autres que Firefox :
      Firefox déclenche onload lorsque le DOM ET les CSS sont complètement chargés.
      Les autres navigateurs chargent le CSS de manière asynchrone parallèlement au DOM.
      Le trigger onload est déclenché à la fin du chargement du DOM. Le CSS semantic -
      plus volumineux - n'est alors pas toujours totalement chargé et il 
      n'est pas encore en cache à la première impression...
      => delay plus important la première fois (chargement en cache)
      */

      this.browserDelay = _.isUndefined(this.browserDelay) ? 1500 : 500;

      win.onload = () => {
        // console.log("Browser delay : " + this.browserDelay);
        _.delay(() => {
          win.print();
        }, this.browserDelay);
      };
    } else {
      // Firefox (no delay)

      win.onload = () => {
        win.print();
      };
    }
  };

  render() {
    let infos = "";
    let siteUrl = "";
    let identifiant = "";
    if (this.props.printWithPassword) {
      siteUrl =
        window.location.origin + window.location.pathname + "#Patients/";
      identifiant =
        this.props.patient.id +
        "@" +
        this.props.praticien.organisation.split("@")[0];
      infos = siteUrl;
      infos += this.props.patient.id;
      infos += ":" + this.props.newPassword;
      infos += "@" + this.props.praticien.organisation.split("@")[0];
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
                    {"Tél. " +
                      this.props.praticien.account.telBureau +
                      " (Bureau)"}
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
                {this.props.printWithPassword ? (
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

              <div /*style={{ marginLeft: "10px" }}*/>
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
                                            return "";
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
                {this.props.etatRdv ? (
                  <div>
                    <Divider hidden={true} />
                    <span>
                      <Icon name="chart pie" />
                      <strong>Statistiques</strong>
                    </span>
                    <table style={{ marginTop: "10px" }}>
                      <tbody>
                        <tr>
                          <td>
                            <Icon name="chart line" />
                          </td>
                          <td>Présence</td>
                          <td>
                            : &nbsp;
                            {Math.round(
                              (this.state.infos.presence * 100) /
                                this.state.mesRdv.length
                            )}
                            &nbsp; %
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Icon name="chart line" />
                          </td>
                          <td>Retards importants</td>
                          <td>
                            : &nbsp;
                            {Math.round(
                              (this.state.infos.retardImportant * 100) /
                                this.state.mesRdv.length
                            )}
                            &nbsp; %
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Icon name="chart line" />
                          </td>
                          <td>Absence ou annulation</td>
                          <td>
                            : &nbsp;
                            {Math.round(
                              (this.state.infos.absEtAnnul * 100) /
                                this.state.mesRdv.length
                            )}
                            &nbsp; %
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
