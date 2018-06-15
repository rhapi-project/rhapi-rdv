import React from "react";

import _ from "lodash";

import moment from "moment";

import { rdvDateTime } from "./Settings";

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
    dateRefCheckbox: false,
    dateRef: moment(),
    dateRefFocused: false,
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
      dateRefCheckbox: false,
      dateRef: moment(),
      dateRefFocused: false,
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
          content="Format detaillé"
          onClick={() => this.setState({ open: true })}
        />
      );
    } else {
      return (
        <React.Fragment>
          <Modal size="fullscreen" open={this.state.open}>
            <Modal.Header>
              Configuration des paramètres d'impression
            </Modal.Header>
            <Modal.Content>
              <Grid>
                <Grid.Row>
                  <Grid.Column width={12} floated="left">
                    <Form>
                      <Form.Input label="Configurer les paramètres d'impression par défaut">
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
                    </Form>
                  </Grid.Column>
                  <Grid.Column width={4} textAlign="center">
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

                <Grid.Row>
                  <Grid.Column width={12}>
                    <Form>
                      <Form.Group widths="equal">
                        <Form.Input label="Définir une date de référence">
                          <Checkbox
                            toggle={true}
                            checked={this.state.dateRefCheckbox}
                            onChange={(e, d) =>
                              this.setState({
                                defaut: false,
                                dateRefCheckbox: !this.state.dateRefCheckbox
                              })
                            }
                          />
                        </Form.Input>
                        <Form.Input
                          label="A partir du : "
                          disabled={!this.state.dateRefCheckbox}
                        >
                          <SingleDatePicker
                            placeholder="JJ/MM/AAAA"
                            hideKeyboardShortcutsPanel={true}
                            withPortal={true}
                            isOutsideRange={() => false}
                            date={this.state.dateRef}
                            numberOfMonths={1}
                            readOnly={false}
                            onClose={() =>
                              this.setState({ dateRefFocused: false })
                            }
                            onDateChange={date => {
                              this.setState({ dateRef: null });
                              if (!_.isNull(date)) {
                                this.setState({ dateRef: date });
                              }
                            }}
                            focused={this.state.dateRefFocused}
                            onFocusChange={() => {}}
                          />
                          <Button
                            icon="calendar"
                            onClick={() =>
                              this.setState({ dateRefFocused: true })
                            }
                          />
                        </Form.Input>
                      </Form.Group>
                    </Form>
                  </Grid.Column>

                  <Grid.Column width={4} />
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
                            }
                          }}
                        />
                      </Form.Input>
                    </Form>
                    {this.state.allPlannings
                      ? ""
                      : _.map(this.props.mesPlannings, (item, i) => {
                          return (
                            <div key={i}>
                              <Divider />
                              <Checkbox
                                toggle={true}
                                label={item.titre}
                                checked={_.includes(
                                  this.state.plannings,
                                  i + 1
                                )}
                                onChange={(e, d) => {
                                  if (_.includes(this.state.plannings, i + 1)) {
                                    // enlever planning
                                    let pl = [];
                                    let plannings = this.state.plannings;
                                    for (let j = 0; j < plannings.length; j++) {
                                      if (plannings[j] !== i + 1) {
                                        pl.push(plannings[j]);
                                      }
                                    }
                                    this.setState({ plannings: pl });
                                  } else {
                                    // ajouter planning
                                    let pl = this.state.plannings;
                                    pl.push(i + 1);
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
                idPatient={this.props.idPatient}
                client={this.props.client}
                denomination={this.props.denomination}
                praticien={this.props.praticien}
                dateRef={this.state.dateRef}
                commentaires={this.state.commentaires}
                newPassword={this.props.newPassword}
                printWithPassword={this.props.printWithPassword}
                plannings={this.state.plannings}
                mesPlannings={this.props.mesPlannings}
                print={this.state.print}
                afterPrint={this.afterPrint}
              />
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="Annuler"
                negative={true}
                onClick={() => {
                  this.setState({ open: false });
                  this.defaut();
                }}
              />
            </Modal.Actions>
          </Modal>
        </React.Fragment>
      );
    }
  }
}

class Preview extends React.Component {
  state = {
    mesRdv: []
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
          ipp: this.props.idPatient,
          from: dateRef.toISOString()
        },
        result => {
          // success
          //console.log(result.results);
          this.setState({ mesRdv: result.results });
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
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (rdv.planningsJA[i].id === planningId) {
        if (rdv.planningsJA[i].motif !== -1 && rdv.planningsJA[i].motif !== 0) {
          // rechercher motif
          m = this.props.mesPlannings[planningId - 1].optionsJO.reservation
            .motifs[rdv.planningsJA[i].motif - 1].motif;
        } else {
          m = "";
        }
      }
    }
    return m;
  };

  rdvIsOnPlanning = (rdv, planningId) => {
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (rdv.planningsJA[i].id === planningId) {
        return true;
      }
    }
    return false;
  };

  print = () => {
    if (_.isEmpty(this.state.mesRdv) && !this.state.printWithPassword) {
      return;
    }

    //Solution avec l'ouverture d'une window
    // DEBUT
    let content = document.getElementById("details");

    let win = window.open("", "Print", "height=600,width=800");

    win.document.write("<html><head>");
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="iframes/a4.css" />'
    );
    win.document.write("</head><body>");
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();

    if (win.matchMedia) {
      // Safari
      let mediaQueryList = win.matchMedia("print");
      mediaQueryList.addListener(mql => {
        if (!mql.matches) {
          console.log("ok");
          this.props.afterPrint();
          win.close();
        }
      });
    }

    setTimeout(() => {
      win.print();
    }, 1500);
    // TODO : Supprimer le timeout ! (Voir ligne ci-dessous)
    //win.onloadend = () =>{ win.print() };

    win.onbeforeunload = this.props.afterPrint;

    if (typeof InstallTrigger !== "undefined" && !document.documentMode) {
      // firefox
      setTimeout(() => {
        win.print();
        win.close();
      }, 1500);
      win.onafterprint = this.props.afterPrint;
    }
    // FIN
  };

  render() {
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
        <div id="details" className="impression-details">
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
                <div className="coordonnees-praticien">
                  <span className="praticien-currentName">
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

              <div className="titre-principal">
                <strong>{"Rendez-vous de " + this.props.denomination}</strong>
              </div>

              <div className="new-password" style={{ marginBottom: "20px" }}>
                {this.props.printWithPassword ? (
                  <p>
                    Accédez directement à vos rendez-vous en ligne depuis le
                    site (à définir selon intégration)<br />
                    Identifiant :{" "}
                    <strong>
                      {this.props.idPatient +
                        "@forme-de-l'indentifiant-à-(re)definir"}
                    </strong>
                    <br />
                    Mot de passe : <strong>{this.props.newPassword}</strong>
                  </p>
                ) : (
                  ""
                )}
              </div>

              <div /*style={{ marginLeft: "10px" }}*/>
                <List>
                  {_.map(this.state.mesRdv, (item, i) => {
                    return (
                      <List.Item className="rdv-list-item" key={i}>
                        <Icon name="calendar" />
                        <List.Content>
                          <List.Header>
                            {_.upperFirst(rdvDateTime(item.startAt))}
                          </List.Header>
                          <List.List>
                            <List.Item>
                              {this.props.plannings.length === 0 ? (
                                ""
                              ) : (
                                <table>
                                  <tbody>
                                    {_.map(
                                      this.props.plannings,
                                      (planningId, p) => {
                                        if (
                                          this.rdvIsOnPlanning(item, planningId)
                                        ) {
                                          return (
                                            <tr key={p}>
                                              <td
                                                style={{ verticalAlign: "top" }}
                                              >
                                                Planning
                                              </td>
                                              <td
                                                style={{
                                                  verticalAlign: "top",
                                                  width: "180px"
                                                }}
                                              >
                                                {" ( " +
                                                  this.props.mesPlannings[
                                                    planningId - 1
                                                  ].titre +
                                                  " ) "}
                                              </td>
                                              <td
                                                style={{ verticalAlign: "top" }}
                                              >
                                                {this.motif(
                                                  item,
                                                  planningId
                                                ) !== "" ? (
                                                  <Icon name="arrow right" />
                                                ) : (
                                                  ""
                                                )}
                                              </td>
                                              <td
                                                style={{
                                                  verticalAlign: "top",
                                                  width: "50px"
                                                }}
                                              >
                                                {this.motif(
                                                  item,
                                                  planningId
                                                ) !== ""
                                                  ? " Motif : "
                                                  : ""}
                                              </td>
                                              <td>
                                                {this.motif(item, planningId)}
                                              </td>
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
                                    <tr style={{ verticalAlign: "top" }}>
                                      <td>
                                        <strong>{" Description :  "}</strong>
                                      </td>
                                      <td>{item.description}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </List.Item>
                            )}
                            {this.props.commentaires ? (
                              <List.Item>
                                <table>
                                  <tbody>
                                    {item.commentaire !== "" ? (
                                      <tr style={{ verticalAlign: "top" }}>
                                        <td>
                                          <strong>{" Commentaire :  "}</strong>
                                        </td>
                                        <td>{item.commentaire}</td>
                                      </tr>
                                    ) : (
                                      ""
                                    )}
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
