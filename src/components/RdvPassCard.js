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
  Ref,
  List,
  Message,
  Modal
} from "semantic-ui-react";

import { SingleDatePicker } from "react-dates";

/**
 * Pour l'impression au format détaillé

 * dans le picker de date, je n'ai pas réussi le focused avec le bouton, pourtant j'ai essayé de faire comme
 * vous le faîtes dans FichePatient.js
 * ma saisie manuelle de la date marche quand même

 * Toujours sur cette même partie, dans la réinitialisation des paramètres d'impression
 * par défaut, j'ai utilisé un setTimeout pour avoir quelque chose qui fonctionne car j'ai été
 * confronté aux problème des callbacks qui ne répondent pas en temps voulu.
 * 
 * ligne 434 et dans l'annulation 665
 */

export default class RdvPassCard extends React.Component {
  printParameters = {
    // ce sera la configuration par défaut
    defaut: true,
    dateRefCheckbox: false,
    dateRef: moment(), // la date du jour
    dateRefFocused: false,
    commentaires: false,
    etatRdv: false,
    allPlannings: true,
    plannings: [] // les id(s) seulement
  };

  state = {
    open: false,
    newPassword: "",
    oldPassword: "",
    modalPassword: false,
    printWithPassword: false,
    printParameters: { ...this.printParameters },
    chosenFormat: 0, // 1 : carton, 2 : Format détaillé
    printFormat2: false, // impression du format détaillé
    mesRdv: [],
    mesPlannings: []
  };

  componentWillReceiveProps() {
    this.reload();
  }

  loadPlanningsId = mesPlannings => {
    let pl = [];
    for (let i = 0; i < mesPlannings.length; i++) {
      pl.push(mesPlannings[i].id);
    }

    let printParameters = this.state.printParameters;
    printParameters.plannings = pl;
    this.setState({ printParameters: printParameters });
  };

  reload = () => {
    this.props.client.RendezVous.mesRendezVous(
      {
        ipp: this.props.idPatient,
        from: this.state.printParameters.dateRef.toISOString()
      },
      result => {
        // success
        //console.log(result);
        this.setState({ mesRdv: result.results });
      },
      () => {
        // error
        console.log("Erreur this.props.client.RendezVous.mesRendezVous");
      }
    );

    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        // success
        //console.log(result);
        this.setState({ mesPlannings: result.results });
        this.loadPlanningsId(result.results);
      },
      () => {
        // error
        console.log("Erreur this.props.client.Plannings.mesPlannings");
      }
    );

    //
    this.props.client.MonCompte.read(
      monProfil => {
        this.setState({
          praticien: monProfil
        });
      },
      data => {
        console.log("Erreur lecture des informations sur le praticien");
        console.log(data);
      }
    );
  };

  makePasswd = () => {
    let passwd = "";
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // pas de chiffre car ça peut entrainer des confusions entre 0 et O ou entre 1 et I
    for (let i = 0; i < 6; i++) {
      let c = Math.floor(Math.random() * chars.length);
      passwd += chars.charAt(c);
    }
    return passwd;
  };

  /**
   * le contenu à imprimer se trouver dans l'iframe d'id "iframeToPrint"
   * le choix du css à appliquer est fait selon que ce soit la carte ou le format détaillé à imprimer
   */
  print = () => {
    if (_.isEmpty(this.state.mesRdv) && !this.state.printWithPassword) {
      this.afterPrint();
      return;
    }

    let format = this.state.chosenFormat;
    if (format !== 1 && format !== 2) {
      return;
    }

    let pri = document.getElementById("iframeToPrint");
    let doc = pri.contentDocument;
    let head = doc.getElementsByTagName("head")[0];

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";

    if (pri.matchMedia) {
      // Safari
      let mediaQueryList = pri.contentWindow.matchMedia("print");
      mediaQueryList.addListener(mql => {
        if (!mql.matches) {
          console.log("ok");
          this.afterPrint();
        }
      });
    }

    let content;

    if (format === 1) {
      content = document.getElementById("carton");
      link.href = "iframes/css/carte.css";
    } else {
      content = document.getElementById("details");
      link.href = "iframes/css/a4.css";
    }

    // écriture du contenu
    doc.body.innerHTML = content.innerHTML;

    // injection du css dans l'iframe
    head.appendChild(link);

    pri.contentWindow.focus();

    pri.contentWindow.onbeforeunload = this.afterPrint;
    pri.contentWindow.onafterprint = this.afterPrint;
    pri.contentWindow.print();
  };

  // cette fonction va rappeler le reload pour qu'au cas où l'utilisateur aurait changé la date de référence pour
  // lister les rendez-vous, la date est remise à la date du jour et
  // et les rendez-vous dans le state sont actualisés.
  afterPrint = () => {
    // fermeture de toutes les modals
    this.setState({
      open: false,
      newPassword: "",
      modalPassword: false,
      printWithPassword: false,
      chosenFormat: 0, // 1 : carton, 2 : format détaillé
      printFormat2: false,
      printParameters: { ...this.printParameters }
    });
    this.reload();
  };

  motif = (rdv, planningId) => {
    let m = "";
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (rdv.planningsJA[i].id === planningId) {
        if (rdv.planningsJA[i].motif !== -1 && rdv.planningsJA[i].motif !== 0) {
          // rechercher motif
          m = this.state.mesPlannings[planningId - 1].optionsJO.reservation
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

  render() {
    return (
      <React.Fragment>
        <Modal size="small" open={this.state.open}>
          <Modal.Header>
            {"Prochains rendez-vous de " + this.props.denomination}
          </Modal.Header>
          <Modal.Content scrolling={true}>
            {this.state.mesRdv.length === 0 ? (
              <span>Aucun rendez-vous trouvé !</span>
            ) : (
              <List bulleted={true}>
                {_.map(this.state.mesRdv, (item, i) => {
                  return (
                    <List.Item
                      key={i}
                      content={_.upperFirst(rdvDateTime(item.startAt))}
                    />
                  );
                })}
              </List>
            )}
            {this.state.printWithPassword ? (
              <p>
                Votre nouveau mot de passe :{" "}
                <strong>{this.state.newPassword}</strong>
              </p>
            ) : (
              ""
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button
              icon="print"
              content="Format détaillé"
              onClick={() => this.setState({ chosenFormat: 2 })}
            />
            <Button
              icon="print"
              content="Carte"
              onClick={() => this.setState({ chosenFormat: 1 })}
            />
            <Button
              icon="mail"
              content="E-Mail"
              onClick={() => alert("Envoi par mail à implémenter")}
            />
            <Button
              icon="mobile"
              content="SMS"
              onClick={() => alert("Envoi par SMS à implémenter")}
            />
            <Divider hidden={false} fitted={false} />
            <Button
              negative={true}
              content="Nouveau mot de passe"
              icon="lock"
              onClick={() => {
                let pwd = this.makePasswd();
                if (this.state.newPassword === "") {
                  this.setState({
                    newPassword: pwd,
                    modalPassword: true,
                    chosenFormat: 0
                  });
                } else {
                  this.setState({
                    oldPassword: this.state.newPassword,
                    newPassword: pwd,
                    modalPassword: true,
                    chosenFormat: 0
                  });
                }
              }}
            />
            <Ref
              innerRef={node => {
                if (!this.state.modalPassword) {
                  node.firstChild.parentElement.focus();
                }
              }}
            >
              <Button
                icon="close"
                primary={true}
                content="Fermer"
                onClick={() => this.setState({ open: false })}
              />
            </Ref>
          </Modal.Actions>
        </Modal>

        {/* Modal password */}

        <Modal size="small" open={this.state.modalPassword}>
          <Modal.Header>Nouveau mot de passe</Modal.Header>
          <Modal.Content scrolling={true}>
            {this.state.mesRdv.length === 0 ? (
              <span>Aucun rendez-vous trouvé !</span>
            ) : (
              ""
            )}

            <Message warning={true}>
              <Message.Header>
                Un nouveau mot de passe a été généré !
              </Message.Header>
              <Message.Content>
                <p>
                  Nouveau mot de passe :{" "}
                  <strong>
                    <u>{this.state.newPassword}</u>
                  </strong>
                </p>
              </Message.Content>
            </Message>

            <p>
              <strong>
                Vous confirmez vouloir sauvegarder ce nouveau mot de passe et
                remplacer le précédent ?
              </strong>
            </p>
          </Modal.Content>
          <Modal.Actions>
            <Button
              negative={true}
              content="Oui"
              onClick={() => {
                this.props.client.Patients.read(
                  this.props.idPatient,
                  {},
                  result => {
                    // success
                    //console.log(result);
                    let obj = result;
                    obj.gestionRdvJO.reservation.password = this.state.newPassword;

                    this.props.client.Patients.update(
                      this.props.idPatient,
                      obj,
                      () => {
                        // success
                        this.setState({
                          modalPassword: false,
                          printWithPassword: true,
                          open: true
                        });
                        //console.log("Mise à jour terminée");
                      },
                      data => {
                        // error
                        console.log("Erreur update patient");
                        console.log(data);
                      }
                    );
                  },
                  data => {
                    // error
                    console.log("Erreur lecture patient");
                    console.log(data);
                  }
                );
              }}
            />
            <Ref innerRef={node => node.firstChild.parentElement.focus()}>
              <Button
                primary={true}
                content="Non"
                onClick={() =>
                  this.setState({
                    newPassword: this.state.oldPassword,
                    modalPassword: false
                  })
                }
              />
            </Ref>
          </Modal.Actions>
        </Modal>

        {/* Modal Format détaillé Options */}

        <Modal size="fullscreen" open={this.state.chosenFormat === 2}>
          <Modal.Header>Configuration des paramètres d'impression</Modal.Header>
          <Modal.Content>
            <Grid>
              <Grid.Row divided>
                <Grid.Column width={12} floated="left">
                  <Form>
                    <Form.Input label="Configurer les paramètres d'impression par défaut">
                      <Checkbox
                        toggle={true}
                        checked={this.state.printParameters.defaut}
                        onChange={(e, d) => {
                          let printParameters = this.state.printParameters;
                          printParameters.defaut = !printParameters.defaut;
                          if (printParameters.defaut) {
                            this.setState({
                              printParameters: { ...this.printParameters }
                            });
                            setTimeout(() => {
                              this.reload();
                            }, 1500);
                            // je fais le setTimeout car le reload est appelé avant que this.state.printParameters
                            // n'ait terminé son initialisation
                          } else {
                            this.setState({ printParameters: printParameters });
                          }
                        }}
                      />
                    </Form.Input>
                  </Form>
                </Grid.Column>
                <Grid.Column width={4} textAlign="center">
                  <Ref innerRef={node => node.firstChild.parentElement.focus()}>
                    <Button
                      primary={true}
                      icon="print"
                      content="Imprimer"
                      onClick={() => this.setState({ printFormat2: true })}
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
                          checked={this.state.printParameters.dateRefCheckbox}
                          onChange={(e, d) => {
                            let printParameters = this.state.printParameters;
                            printParameters.defaut = false;
                            printParameters.dateRefCheckbox = !printParameters.dateRefCheckbox;
                            this.setState({ printParameters: printParameters });
                          }}
                        />
                      </Form.Input>
                      <Form.Input
                        label="A partir du : "
                        disabled={!this.state.printParameters.dateRefCheckbox}
                      >
                        <SingleDatePicker
                          placeholder="JJ/MM/AAAA"
                          hideKeyboardShortcutsPanel={true}
                          withPortal={true}
                          isOutsideRange={() => false}
                          date={this.state.printParameters.dateRef}
                          numberOfMonths={1}
                          readOnly={false}
                          onClose={() => {
                            let printParameters = this.state.printParameters;
                            printParameters.dateRefFocused = false;
                            this.setState({ printParameters: printParameters });
                          }}
                          onDateChange={date => {
                            this.setState({ dateRef: date });
                            let printParameters = this.state.printParameters;
                            printParameters.dateRef = date;
                            this.setState({ printParameters: printParameters });
                            if (!_.isNull(this.state.printParameters.dateRef)) {
                              this.reload();
                            }
                          }}
                          focused={this.state.printParameters.dateRefFocused}
                          onFocusChange={() => {}}
                        />
                        <Button
                          icon="calendar"
                          onClick={() => {
                            let printParameters = this.state.printParameters;
                            printParameters.dateRefFocused = true;
                            this.setState({ printParameters: printParameters });
                          }}
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
                          checked={this.state.printParameters.commentaires}
                          onChange={(e, d) => {
                            let printParameters = this.state.printParameters;
                            printParameters.defaut = false;
                            printParameters.commentaires = !printParameters.commentaires;
                            this.setState({ printParameters: printParameters });
                          }}
                        />
                      </Form.Input>
                      <Form.Input label="Afficher l'état des rendez-vous">
                        <Checkbox
                          toggle={true}
                          checked={this.state.printParameters.etatRdv}
                          onChange={(e, d) => {
                            let printParameters = this.state.printParameters;
                            printParameters.defaut = false;
                            printParameters.etatRdv = !printParameters.etatRdv;
                            this.setState({ printParameters: printParameters });
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
                        checked={this.state.printParameters.allPlannings}
                        onChange={(e, d) => {
                          let printParameters = this.state.printParameters;
                          printParameters.defaut = false;
                          printParameters.allPlannings = !printParameters.allPlannings;
                          if (printParameters.allPlannings) {
                            this.loadPlanningsId(this.state.mesPlannings);
                          }
                          this.setState({ printParameters: printParameters });
                        }}
                      />
                    </Form.Input>
                  </Form>
                  {this.state.printParameters.allPlannings
                    ? ""
                    : _.map(this.state.mesPlannings, (item, i) => {
                        return (
                          <div key={i}>
                            <Divider />
                            <Checkbox
                              toggle={true}
                              label={item.titre}
                              checked={_.includes(
                                this.state.printParameters.plannings,
                                i + 1
                              )}
                              onChange={(e, d) => {
                                if (
                                  _.includes(
                                    this.state.printParameters.plannings,
                                    i + 1
                                  )
                                ) {
                                  // enlever planning
                                  let pl = [];
                                  let plannings = this.state.printParameters
                                    .plannings;
                                  for (let j = 0; j < plannings.length; j++) {
                                    if (plannings[j] !== i + 1) {
                                      pl.push(plannings[j]);
                                    }
                                  }
                                  let printParameters = this.state
                                    .printParameters;
                                  printParameters.plannings = pl;
                                  this.setState({
                                    printParameters: printParameters
                                  });
                                } else {
                                  let pl = this.state.printParameters.plannings;
                                  pl.push(i + 1);
                                  //console.log(pl);
                                  let printParameters = this.state
                                    .printParameters;
                                  printParameters.plannings = pl;
                                  this.setState({
                                    printParameters: printParameters
                                  });
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

            {/* preview de l'impression détaillée */}

            <div
              className="preview-details"
              style={{
                overflowY: "scroll",
                height:
                  _.isEmpty(this.state.mesRdv) && !this.state.printWithPassword
                    ? "50px"
                    : "300px"
              }}
            >
              <PreviewImpressionDetails
                id="details"
                praticien={this.state.praticien}
                mesRdv={this.state.mesRdv}
                mesPlannings={this.state.mesPlannings}
                printParameters={this.state.printParameters}
                printWithPassword={this.state.printWithPassword}
                newPassword={this.state.newPassword}
                print={this.print}
                idPatient={this.props.idPatient}
                denomination={this.props.denomination}
                rdvIsOnPlanning={this.rdvIsOnPlanning}
                motif={this.motif}
                printFormat2={this.state.printFormat2}
              />
            </div>
          </Modal.Content>
          <Modal.Actions>
            <Button
              negative={true}
              content="Annuler"
              onClick={() => {
                this.setState({
                  printParameters: { ...this.printParameters }
                  //chosenFormat: 0
                });
                setTimeout(() => {
                  this.reload();
                  this.setState({ chosenFormat: 0 });
                }, 1000);
                //this.reload();
              }}
              //onClick={() => this.setState({ chosenFormat: 0 })}
            />
          </Modal.Actions>
        </Modal>

        {/* Modal Carte */}

        <Modal
          size="small"
          open={this.state.chosenFormat === 1}
          closeIcon={true}
          onClose={() => this.setState({ chosenFormat: 0 })}
        >
          <Modal.Header>Impression format carton</Modal.Header>
          <Modal.Content>
            Préparation de l'impression...
            <Carte
              id="carton"
              praticien={this.state.praticien}
              mesRdv={this.state.mesRdv}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}
              print={this.print}
              idPatient={this.props.idPatient}
              //denomination={this.props.denomination}
            />
            <iframe
              id="iframeToPrint"
              title="Impression"
              style={{
                border: "0px",
                height: "0px",
                width: "0px",
                position: "absolute"
              }}
            />
          </Modal.Content>
        </Modal>

        {/* Modal Impression avec détails */}

        <Modal
          size="small"
          open={this.state.printFormat2}
          closeIcon={true}
          onClose={() => this.setState({ printFormat2: false })}
        >
          <Modal.Header>Impression format détaillé</Modal.Header>
          <Modal.Content>
            Préparation de l'impression...
            <PreviewImpressionDetails
              id="details"
              praticien={this.state.praticien}
              mesRdv={this.state.mesRdv}
              mesPlannings={this.state.mesPlannings}
              printParameters={this.state.printParameters}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}
              print={this.print}
              idPatient={this.props.idPatient}
              denomination={this.props.denomination}
              rdvIsOnPlanning={this.rdvIsOnPlanning}
              motif={this.motif}
              printFormat2={this.state.printFormat2}
            />
            <iframe
              id="iframeToPrint"
              title="Impression"
              style={{
                border: "0px",
                height: "0px",
                width: "0px",
                position: "absolute"
              }}
            />
          </Modal.Content>
        </Modal>
        <Button
          icon={this.props.icon}
          content={this.props.content}
          onClick={() => {
            this.setState({ open: true });
          }}
        />
      </React.Fragment>
    );
  }
}

class Carte extends React.Component {
  componentDidMount() {
    this.props.print();
  }

  render() {
    return (
      <div id={this.props.id} hidden={true}>
        <div className="coordonnees-praticien">
          <span>
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
          <span>{"Tél. : " + this.props.praticien.account.telBureau}</span>
        </div>
        <div className="titre-principal">
          <strong>Vos prochains rendez-vous</strong>
        </div>
        {this.props.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
        ) : (
          <List bulleted={false}>
            {_.map(this.props.mesRdv, (item, i) => {
              return (
                <List.Item
                  icon="calendar"
                  className="item-rdv"
                  key={i}
                  content={_.upperFirst(rdvDateTime(item.startAt))}
                />
              );
            })}
          </List>
        )}
        {this.props.printWithPassword ? (
          <p className="new-password">
            Accédez directement à vos rendez-vous en ligne le site (à définir
            selon intégration)<br />
            Identifiant :{" "}
            <strong>
              {this.props.idPatient + "@forme-de-l'indentifiant-à-(re)definir"}
            </strong>
            <br />
            Mot de passe : <strong>{this.props.newPassword}</strong>
          </p>
        ) : (
          ""
        )}
        <Divider />
        <div className="bottom-message">
          <span>
            <strong>
              EN CAS D'IMPOSSIBILITÉ, PRIÈRE DE PRÉVENIR 48H AVANT LA DATE DU
              RENDEZ-VOUS !
            </strong>
          </span>
        </div>
      </div>
    );
  }
}

class PreviewImpressionDetails extends React.Component {
  componentDidMount() {
    if (this.props.printFormat2) {
      this.props.print();
    }
  }

  render() {
    return (
      <div id={this.props.id} className="impression-details">
        {_.isEmpty(this.props.mesRdv) && !this.props.printWithPassword ? (
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
                  Accédez directement à vos rendez-vous en ligne depuis le site
                  (à définir selon intégration)<br />
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
                {_.map(this.props.mesRdv, (item, i) => {
                  return (
                    <List.Item className="rdv-list-item" key={i}>
                      <Icon name="calendar" />
                      <List.Content>
                        <List.Header>
                          {_.upperFirst(rdvDateTime(item.startAt))}
                        </List.Header>
                        <List.List>
                          <List.Item>
                            {this.props.printParameters.plannings.length ===
                            0 ? (
                              ""
                            ) : (
                              <table>
                                <tbody>
                                  {_.map(
                                    this.props.printParameters.plannings,
                                    (planningId, p) => {
                                      if (
                                        this.props.rdvIsOnPlanning(
                                          item,
                                          planningId
                                        )
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
                                              {this.props.motif(
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
                                              {this.props.motif(
                                                item,
                                                planningId
                                              ) !== ""
                                                ? " Motif : "
                                                : ""}
                                            </td>
                                            <td>
                                              {this.props.motif(
                                                item,
                                                planningId
                                              )}
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
                          {this.props.printParameters.commentaires ? (
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
            <div className="signature">
              Fait à &nbsp;. . . . . . . . . . . . . . . . . . . . . . . .
              ,&nbsp;le . . . .&nbsp;/ . . . .&nbsp;/ . . . . . .
              <Divider hidden={true} />
              Signature :
            </div>
          </div>
        )}
      </div>
    );
  }
}
