import React from "react";

import _ from "lodash";

import { rdvDateTime, site, helpPopup } from "./Settings";
import { print } from "../lib/Helpers";

import {
  Button,
  Checkbox,
  Divider,
  Form,
  Icon,
  Ref,
  List,
  Message,
  Modal,
  Popup
} from "semantic-ui-react";

import RdvPassCardA4 from "./RdvPassCardA4";

import RdvPassCardHelp from "./RdvPassCardHelp";

export default class RdvPassCard extends React.Component {
  /*
      errorSMSType

      0 : pas d'erreur
      1 : Pas de planning autorisé à envoyer un SMS
      2 : validité du message
          (SMS conforme ? Comment savoir ?)
      3 : erreur réseau
      4 : numéro invalide
  */

  state = {
    newPassword: "",
    oldPassword: "",
    modalPassword: false,
    printWithPassword: false,
    confirmPrintWithPassword: true, // new
    //pwdGeneration: false, // proposition de génération de mot de passe (modal)
    carte: false,
    onlineRdv: false, // prise de rendez-vous en ligne désactivé par défaut
    mesRdv: [],
    rdvToPrint: [], // new
    mesPlannings: [],
    praticien: {
      currentName: "",
      organisation: "",
      account: {
        adresse1: "",
        adresse2: "",
        adresse3: "",
        codePostal: "",
        ville: "",
        telBureau: ""
      }
    },
    savingModal: false,
    previsualisationSMS: false, // new
    smsToSend: "", // new
    retourSMS: false,
    errorSMS: -1, // pas d'envoi effectué encore
    help: false
  };

  componentDidMount() {
    this.reload();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.open && !_.isUndefined(props.saved) && !props.saved) {
      return { savingModal: true };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.open &&
      prevProps.open !== this.props.open &&
      this.props.saved
    ) {
      this.reload(this.props.patient.id);
    }
  }

  reload = id => {
    this.props.client.RendezVous.mesRendezVous(
      { ipp: _.isUndefined(id) ? this.props.patient.id : id },
      result => {
        // success
        // les rendez-vous annulés (masqués) ne sont pas affichés
        let mesRdv = _.filter(result.results, function(o) {
          return o.idEtat !== 7;
        });
        this.setState({
          mesRdv: mesRdv,
          rdvToPrint: mesRdv, // new
          confirmPrintWithPassword: true // new
        });
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
        // onlineRdv : true si le patient a une autorisation suffisante pour
        // accéder à ses RDV sur au moins un des plannings disponibles
        let autorisationPatient = this.props.patient.gestionRdvJO.reservation
          ? this.props.patient.gestionRdvJO.reservation.autorisation
          : 0;

        this.setState({
          mesPlannings: result.results,
          onlineRdv:
            _.findIndex(result.results, planning => {
              return (
                autorisationPatient >=
                planning.optionsJO.reservation.autorisationMin
              );
            }) > -1
        });
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
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 10; i++) {
      // http://lastbit.com/pswcalc.asp
      // 10 chars => Brute Force Attack will take up to 53968 years (500000 passwords per second)
      // Math.random() n'est pas une source d'aléas de niveau cryptographique : les séquences peuvent,
      // sous certaines conditions, être reproduites
      // https://stackoverflow.com/questions/5651789/is-math-random-cryptographically-secure
      // => on ajoute une source d'entropie avec l'horloge interne
      let c = Math.floor(Math.random() * new Date().getTime()) % chars.length;
      passwd += chars.charAt(c);
    }
    return passwd;
  };

  savePasswd = () => {
    // le nouveau mot de passe a été généré et se trouve dans this.state.newPassword
    // Sauvegarde dans la base de données.
    this.props.client.Patients.read(
      this.props.patient.id,
      {},
      result => {
        // success
        //console.log(result);
        let obj = result;
        obj.gestionRdvJO.reservation.password = this.state.newPassword;

        this.props.client.Patients.update(
          this.props.patient.id,
          obj,
          () => {
            // success
            this.setState({
              modalPassword: false,
              printWithPassword: true
            });
            // Après chaque génération de mot de passe,
            // remettre à jour les données de la fiche du patient.
            // Si cela n'est pas fait, les sauvegardes sur la fiche
            // du patient ne seront pas possible (lockRevision)
            this.props.patientReload(this.props.patient.id);
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
  };

  printBlock = false;
  print = () => {
    if (this.printBlock) {
      return;
    }

    this.printBlock = true;
    _.delay(() => (this.printBlock = false), 1000);

    // uniquement la carte
    let content = document.getElementById("carte");

    let win = window.open("", "Impression", "height=600,width=800");

    win.document.open();
    win.document.write("<html><head>");
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="print-css/semantic-ui-css/semantic.min.css" />'
    );
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="print-css/carte.css" />'
    );
    win.document.write("</head><body>");
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();

    let windowClose = () => {
      win.close();
    };

    print(this, win, this.afterPrint, windowClose);
  };

  afterPrint = () => {
    // fermeture de toutes les modals
    this.setState({
      //newPassword: "",
      modalPassword: false,
      //printWithPassword: false,
      carte: false
    });
    this.props.rdvPassCardOpen(false);
  };

  extractSms = () => {
    let pwd = "";
    if (this.state.mesRdv.length === 0) {
      this.setState({ retourSMS: true });
      return;
    }
    if (this.props.patient.telMobile.length < 8) {
      // check basique mais suffisant ici
      this.setState({ retourSMS: true });
      return;
    }
    if (!this.state.newPassword) {
      pwd = this.makePasswd();
      this.setState({ newPassword: pwd });
      this.savePasswd();
    } else {
      pwd = this.state.newPassword;
    }

    // il faut prendre le premier planning (autorisé à envoyer des SMS => supprimé) et possédant
    // un template de texte de confirmation
    let i = _.findIndex(this.state.mesPlannings, planning => {
      return (
        planning.optionsJO &&
        planning.optionsJO.sms &&
        planning.optionsJO.sms.confirmationTexte &&
        planning.optionsJO.sms.confirmationTexte !==
          "" /*&&
        (planning.optionsJO.sms.rappel12 ||
          planning.optionsJO.sms.rappel24 ||
          planning.optionsJO.sms.rappel48)
        */
      );
    });

    if (i === -1) {
      // pas de planning autorisé à envoyer un SMS !
      // erreur (1)
      this.setState({ retourSMS: true, errorSMS: 1 });
      return;
    }

    let mrdv = "";
    for (let i = 0; i < this.state.rdvToPrint.length; i++) {
      mrdv += rdvDateTime(this.state.rdvToPrint[i].startAt) + "\n";
    }

    //let message = this.state.mesPlannings[i].optionsJO.sms.confirmationTexte;
    let message = this.state.mesPlannings[i].optionsJO.sms.rappelTexte;
    // tester la validité du template et placer les bonnes valeur {date-heure} et {infos-annulations} !!
    // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si non valide et return
    // erreur (2)
    message = _.replace(
      message,
      "{date-heure}",
      //rdvDateTime(this.state.mesRdv[0].startAt)
      mrdv
    );
    let infos =
      "Infos et annulation : " +
      window.location.origin +
      window.location.pathname
        .split("/")
        .slice(0, -1)
        .join("/") +
      "/#Patients/";
    infos += this.props.patient.id;
    //infos += ":" + this.state.newPassword;
    infos += ":" + pwd;
    infos += "@" + this.state.praticien.organisation.split("@")[0];
    // split("@") si une forme master@master => master
    message = _.replace(message, "{infos-annulation}", infos);

    this.setState({ smsToSend: message, previsualisationSMS: true });
  };

  sendSms = sms => {
    let receivers = [this.props.patient.telMobile]; // la normalisation du n° est assuré en backend
    // attention le nombre de SMS disponibles pour les tests est volontairement limité !

    this.props.client.Sms.create(
      { message: sms, receivers: receivers },
      datas => {
        //console.log(datas);
        // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si le SMS n'est pas conforme
        // => tester les champ ad hoc pour savoir si le SMS a bien été envoyé !
        if (!_.isEmpty(datas.validReceivers)) {
          // le SMS a été envoyé
          this.setState({
            retourSMS: true,
            errorSMS: 0,
            previsualisationSMS: false,
            smsToSend: ""
          });
        } else if (!_.isEmpty(datas.invalidReceivers)) {
          // numéro invalide
          this.setState({
            retourSMS: true,
            errorSMS: 4,
            previsualisationSMS: false,
            smsToSend: ""
          });
        }
      },
      errors => {
        console.log(errors);
        this.setState({
          retourSMS: true,
          errorSMS: 3,
          previsualisationSMS: false,
          smsToSend: sms
        });
      }
    );
  };

  openHelp = bool => {
    this.setState({ help: bool });
  };

  handleCheckRdv = myRdv => {
    let index = _.findIndex(this.state.rdvToPrint, rdv => myRdv.id === rdv.id);
    let res = _.cloneDeep(this.state.rdvToPrint);
    if (index !== -1) {
      res.splice(index, 1);
    } else {
      res.push(myRdv);
    }
    this.setState({ rdvToPrint: res });
  };

  render() {
    let infos = "";
    if (this.state.printWithPassword) {
      let siteUrl =
        window.location.origin +
        window.location.pathname
          .split("/")
          .slice(0, -1)
          .join("/") +
        "/#Patients/";
      infos = siteUrl;
      infos += this.props.patient.id;
      infos += ":" + this.state.newPassword;
      infos += "@";
      if (/*this.state.praticien && */ this.state.praticien.organisation) {
        infos += this.state.praticien.organisation.split("@")[0];
      }
    }

    return (
      <React.Fragment>
        <Modal size="small" open={this.props.open}>
          <Modal.Header>
            {"Prochains rendez-vous de " + this.props.denomination}
          </Modal.Header>
          <Modal.Content scrolling={true}>
            {_.isEmpty(this.state.mesRdv) ? (
              <React.Fragment>
                <span style={{ marginBottom: "7px" }}>
                  Aucun rendez-vous n'est programmé
                </span>
                <br />
              </React.Fragment>
            ) : (
              <List>
                {_.map(this.state.mesRdv, (item, i) => {
                  return (
                    <List.Item key={i}>
                      <List.Content>
                        <Checkbox
                          checked={
                            _.findIndex(
                              this.state.rdvToPrint,
                              rdv => item.id === rdv.id
                            ) !== -1
                          }
                          onChange={(e, d) => this.handleCheckRdv(item)}
                          label={_.upperFirst(rdvDateTime(item.startAt))}
                        />
                      </List.Content>
                    </List.Item>
                  );
                })}
              </List>
            )}

            <Checkbox
              checked={this.state.confirmPrintWithPassword}
              onChange={(e, d) =>
                this.setState({ confirmPrintWithPassword: d.checked })
              }
              label="Imprimer les coordonnées du patient sur la carte"
            />

            {this.state.printWithPassword && this.state.onlineRdv ? (
              <div style={{ marginTop: "7x" }}>
                Nouveau mot de passe : <b>{this.state.newPassword}</b>
                <br />
                Lien direct : <b>{infos}</b>
                &nbsp;
                <Popup
                  trigger={
                    <Button
                      icon="copy"
                      size="mini"
                      compact={true}
                      circular={true}
                      onClick={() => {
                        // copy to clipboard
                        const el = document.createElement("textarea");
                        el.value = infos;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand("copy");
                        document.body.removeChild(el);
                      }}
                    />
                  }
                  content="Copier le lien"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
              </div>
            ) : null}
          </Modal.Content>
          <Modal.Actions>
            <Button
              icon="mobile"
              content="Confirmation SMS"
              //onClick={this.sendSms}
              onClick={() => this.extractSms()}
            />
            <Button
              icon="print"
              content="Carte de RDV"
              onClick={() => {
                if (
                  _.isEmpty(this.state.newPassword) ||
                  _.isUndefined(this.state.newPassword)
                ) {
                  let pwd = this.makePasswd();
                  this.setState({ newPassword: pwd, printWithPassword: true });
                  this.savePasswd();
                }
                this.setState({ carte: true });
              }}
            />

            <RdvPassCardA4
              patient={this.props.patient}
              client={this.props.client}
              mesPlannings={this.state.mesPlannings}
              newPassword={this.state.newPassword}
              printWithPassword={this.state.printWithPassword}
              praticien={this.state.praticien}
              denomination={this.props.denomination}
              afterPrint={this.afterPrint}
              onlineRdv={this.state.onlineRdv}
            />
            {/* L'envoi de mail ne sera pas nécessairement implémenté...
            <Button
              icon="mail"
              content="E-Mail"
              onClick={() => alert("Envoi par mail")}
            />*/}
            <Divider hidden={false} fitted={false} />
            <Button
              icon="print"
              content="Aide Carte"
              onClick={() => this.openHelp(true)}
            />
            {/* si la prise de rdv en ligne est activé, on affiche le bouton de génération d'un nouveau mot de passe */}
            {this.state.onlineRdv ? (
              <Button
                content="Nouveau mot de passe"
                icon="lock"
                onClick={() => {
                  let pwd = this.makePasswd();
                  if (this.state.newPassword === "") {
                    this.setState({
                      newPassword: pwd,
                      modalPassword: true,
                      carte: false
                    });
                  } else {
                    this.setState({
                      oldPassword: this.state.newPassword,
                      newPassword: pwd,
                      modalPassword: true,
                      carte: false
                    });
                  }
                }}
              />
            ) : (
              ""
            )}
            <Ref
              innerRef={node => {
                if (this.props.open) {
                  node.focus();
                }
              }}
            >
              <Button
                primary={true}
                content="Fermer"
                onClick={() => this.props.rdvPassCardOpen(false)}
              />
            </Ref>
          </Modal.Actions>
        </Modal>

        {/* Modal password */}

        <Modal size="small" open={this.state.modalPassword}>
          <Modal.Header>Nouveau mot de passe</Modal.Header>
          <Modal.Content scrolling={true}>
            {_.isEmpty(this.state.mesRdv) ? (
              <span>Aucun nouveau rendez-vous n'est actuellement fixé</span>
            ) : null}

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
            <Ref
              innerRef={node => {
                if (this.state.modalPassword) {
                  node.focus();
                }
              }}
            >
              <Button
                content="Oui"
                primary={true}
                onClick={() => this.savePasswd()}
              />
            </Ref>
            <Button
              content="Non"
              onClick={() =>
                this.setState({
                  newPassword: this.state.oldPassword,
                  modalPassword: false
                })
              }
            />
          </Modal.Actions>
        </Modal>

        {/* Prévisualisation SMS */}
        {this.state.previsualisationSMS ? (
          <SMSPrevisualisation
            open={this.state.previsualisationSMS}
            sms={this.state.smsToSend}
            onCancel={() =>
              this.setState({ previsualisationSMS: false, smsToSend: "" })
            }
            onSend={sms => this.sendSms(sms)}
          />
        ) : null}

        {/* Retours SMS */}

        <Modal size="small" open={this.state.retourSMS}>
          <Modal.Header>Confirmation SMS</Modal.Header>
          <Modal.Content>
            {_.isEmpty(this.state.mesRdv) ||
            this.props.patient.telMobile.length < 8 ? (
              <Message icon={true} info={true}>
                <Icon name="info" />
                <Message.Content>
                  <Message.Header>
                    Impossible d'envoyer un SMS de confirmation
                  </Message.Header>
                  {_.isEmpty(this.state.mesRdv) ? (
                    <p>Aucun nouveau RDV n'est actuellement fixé !</p>
                  ) : (
                    <p>Le téléphone mobile du patient n'est pas renseigné !</p>
                  )}
                </Message.Content>
              </Message>
            ) : this.state.errorSMS !== -1 && this.state.errorSMS !== 0 ? (
              <div>
                <Message icon={true} negative={true}>
                  {this.state.errorSMS === 1 ? (
                    <Icon name="warning" />
                  ) : this.state.errorSMS === 3 ? (
                    <Icon name="signal" />
                  ) : this.state.errorSMS === 4 ? (
                    <Icon name="remove" />
                  ) : (
                    ""
                  )
                  // reste erreur type 2
                  }
                  <Message.Content>
                    <Message.Header>Erreur d'envoi SMS</Message.Header>
                    {this.state.errorSMS === 1 ? (
                      <p>
                        L'envoi du SMS a échoué. <br />
                        Vous n'avez pas de planning autorisé à envoyer un SMS !
                      </p>
                    ) : this.state.errorSMS === 3 ? (
                      <p>
                        Le SMS n'a pas pu être envoyé. <br />
                        Vérifiez si votre poste est connecté à internet et
                        réessayez.
                      </p>
                    ) : this.state.errorSMS === 4 ? (
                      <p>Numéro invalide</p>
                    ) : (
                      ""
                    )
                    // reste erreur type 2
                    }
                  </Message.Content>
                </Message>
              </div>
            ) : this.state.errorSMS === 0 ? (
              <div>
                <Message size="small" icon={true} positive={true}>
                  <Icon name="send" />
                  <Message.Content>
                    <Message.Header>Le SMS a été envoyé</Message.Header>
                  </Message.Content>
                </Message>
              </div>
            ) : (
              ""
            )}
          </Modal.Content>

          {_.isEmpty(this.state.mesRdv) ||
          this.props.patient.telMobile.length < 8 ? (
            <Modal.Actions>
              <Ref
                innerRef={node => {
                  if (
                    node &&
                    (_.isEmpty(this.state.mesRdv) ||
                      this.props.patient.telMobile.length < 8)
                  ) {
                    node.focus();
                  }
                }}
              >
                <Button
                  primary={true}
                  content="OK"
                  onClick={() => this.setState({ retourSMS: false })}
                />
              </Ref>
            </Modal.Actions>
          ) : this.state.errorSMS === 0 ||
            this.state.errorSMS === 1 ||
            this.state.errorSMS === 4 ? (
            <Modal.Actions>
              <Ref
                innerRef={node => {
                  if (
                    this.state.errorSMS === 0 ||
                    this.state.errorSMS === 1 ||
                    this.state.errorSMS === 4
                  ) {
                    node.focus();
                  }
                }}
              >
                <Button
                  primary={true}
                  content="OK"
                  onClick={() =>
                    this.setState({
                      errorSMS: -1,
                      retourSMS: false
                    })
                  }
                />
              </Ref>
            </Modal.Actions>
          ) : this.state.errorSMS === 3 ? (
            <Modal.Actions>
              <Ref
                innerRef={node => {
                  if (node && this.state.errorSMS === 3) {
                    node.focus();
                  }
                }}
              >
                <Button
                  content="Réessayer"
                  primary={true}
                  onClick={() => {
                    this.setState({
                      errorSMS: -1,
                      retourSMS: false
                    });
                    this.sendSms(this.state.smsToSend);
                  }}
                />
              </Ref>
              <Button
                content="Annuler"
                onClick={() =>
                  this.setState({
                    errorSMS: -1,
                    retourSMS: false,
                    smsToSend: "" // new
                  })
                }
              />
            </Modal.Actions>
          ) : (
            ""
          )}
        </Modal>

        {/* Saving modal */}

        <Modal size="small" open={this.state.savingModal}>
          <Modal.Header>{"Fiche de " + this.props.denomination}</Modal.Header>
          <Modal.Content>
            <div>
              <Message icon={true} warning={true}>
                <Icon name="warning" />
                <Message.Content>
                  <Message.Header>
                    Les données du patient ont été motifiées
                  </Message.Header>
                  <p>Souhaitez-vous les sauvegarder avant de continuer ?</p>
                </Message.Content>
              </Message>
              <p>
                <strong>
                  En cas de réponse négative, les modifications apportées à la
                  fiche du patient seront effacées !
                </strong>
              </p>
            </div>
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.state.savingModal) {
                  node.focus();
                }
              }}
            >
              <Button
                content="Oui"
                primary={true}
                onClick={() => {
                  this.props.save();
                  if (
                    _.isUndefined(this.state.newPassword) ||
                    _.isEmpty(this.state.newPassword)
                  ) {
                    this.setState({ savingModal: false, pwdGeneration: true });
                  } else {
                    this.setState({ savingModal: false /*, open: true*/ });
                  }
                }}
              />
            </Ref>
            <Button
              content="Non"
              onClick={() => {
                this.props.patientReload(this.props.patient.id);
                if (
                  _.isUndefined(this.state.newPassword) ||
                  _.isEmpty(this.state.newPassword)
                ) {
                  this.setState({ savingModal: false, pwdGeneration: true });
                } else {
                  this.setState({ savingModal: false /*, open: true*/ });
                }
              }}
            />
          </Modal.Actions>
        </Modal>

        {/* Aide pour l'impression d'une carte */}

        <RdvPassCardHelp open={this.state.help} openHelp={this.openHelp} />

        {/* Modal Carte */}

        <Modal
          size="small"
          open={this.state.carte}
          closeIcon={true}
          onClose={() => this.setState({ carte: false })}
        >
          <Modal.Header>Impression d'une carte</Modal.Header>
          <Modal.Content>
            Préparation de l'impression...
            <Carte
              id="carte"
              praticien={this.state.praticien}
              //mesRdv={this.state.mesRdv}
              mesRdv={this.state.rdvToPrint}
              printWithPassword={
                this.state.printWithPassword &&
                this.state.confirmPrintWithPassword
              }
              newPassword={this.state.newPassword}
              print={this.print}
              patient={this.props.patient}
              onlineRdv={this.state.onlineRdv}
              limit={7}
              //idPatient={this.props.patient.id}
              //denomination={this.props.denomination}
            />
          </Modal.Content>
        </Modal>
      </React.Fragment>
    );
  }
}

class Carte extends React.Component {
  state = {
    mesRdv: []
  };

  componentDidMount() {
    this.mesRdvLimitation();
  }

  // TODO : Bien tester les impressions sur tous les navigateurs
  componentDidUpdate(prevProps, prevState) {
    this.props.print();
  }

  mesRdvLimitation = () => {
    // Par défaut on affiche 7 rdv sur la carte
    // si un nouveau mot de passe a été généré, on en affichera 5 avec le nouveau mot de passe
    if (this.props.mesRdv.length <= this.props.limit - 2) {
      this.setState({ mesRdv: this.props.mesRdv });
    }
    if (this.props.mesRdv.length > this.props.limit) {
      let mesRdv = [];
      if (this.props.printWithPassword) {
        for (let i = 0; i < this.props.limit - 2; i++) {
          mesRdv.push(this.props.mesRdv[i]);
        }
      } else {
        for (let i = 0; i < this.props.limit; i++) {
          mesRdv.push(this.props.mesRdv[i]);
        }
      }
      this.setState({ mesRdv: mesRdv });
    }
  };

  render() {
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
    }

    return (
      <div id={this.props.id} className="carte" hidden={true}>
        <div className="coordonnees-praticien">
          <p>
            {this.props.praticien.currentName ? (
              <React.Fragment>
                <span className="praticien-currentName">
                  <strong>{this.props.praticien.currentName}</strong>
                </span>
                <br />
              </React.Fragment>
            ) : null}
            {this.props.praticien.account.adresse1 ? (
              <React.Fragment>
                <span>{this.props.praticien.account.adresse1}</span>
                <br />
              </React.Fragment>
            ) : null}
            {this.props.praticien.account.adresse2 ||
            this.props.praticien.account.adresse3 ? (
              <React.Fragment>
                <span>
                  {this.props.praticien.account.adresse2
                    ? this.props.praticien.account.adresse2 + " "
                    : ""}
                  {this.props.praticien.account.adresse3
                    ? this.props.praticien.account.adresse3
                    : ""}
                </span>
                <br />
              </React.Fragment>
            ) : null}
            {this.props.praticien.account.codePostal ||
            this.props.praticien.account.ville ? (
              <React.Fragment>
                <span>
                  {this.props.praticien.account.codePostal
                    ? this.props.praticien.account.codePostal + " "
                    : ""}
                  {this.props.praticien.account.ville
                    ? this.props.praticien.account.ville
                    : ""}
                </span>
                <br />
              </React.Fragment>
            ) : null}
            {this.props.praticien.account.telBureau ? (
              <span>{"Tél. : " + this.props.praticien.account.telBureau}</span>
            ) : null}
          </p>
        </div>

        {!_.isEmpty(this.state.mesRdv) ? (
          <div className="titre-principal">
            <strong>Vos prochains rendez-vous</strong>
          </div>
        ) : null}

        {_.isEmpty(this.state.mesRdv) ? null : (
          <div>
            <List>
              {_.map(this.state.mesRdv, (item, i) => {
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
          </div>
        )}
        {this.props.printWithPassword ? (
          <div className="new-password">
            {this.props.printWithPassword && this.props.onlineRdv ? (
              <p>
                {site.title} : <b>{siteUrl}</b>
                <br />
                Identifiant : <b>{identifiant}</b>
                &nbsp;&nbsp; Mot de passe : <b>{this.props.newPassword}</b>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="bottom-message">
          <Divider className="separator" />
          <span>
            <strong>
              EN CAS D'IMPOSSIBILITÉ, MERCI DE PRÉVENIR 48H AVANT LA DATE DU
              RENDEZ-VOUS
            </strong>
          </span>
        </div>
      </div>
    );
  }
}

class SMSPrevisualisation extends React.Component {
  state = {
    sms: "",
    open: false
  };

  static getDerivedStateFromProps(props, state) {
    if (props.open !== state.open && props.sms !== state.sms) {
      return {
        open: props.open,
        sms: props.sms
      };
    }
    return null;
  }

  // TODO : fonction à mettre dans les Helpers
  smsCounter = () => {
    let length = this.state.sms.length;
    if (length === 0) {
      return 1;
    }
    if (length % 160 === 0) {
      return length / 160;
    }
    return parseInt(length / 160 + 1);
  };

  render() {
    return (
      <Modal size="tiny" open={this.state.open}>
        <Modal.Header>
          Contenu du SMS (Taille: {this.state.sms.length}, SMS:{" "}
          {this.smsCounter()})
        </Modal.Header>
        <Modal.Content>
          <Form>
            <Form.TextArea
              placeholder="Contenu du message vide"
              rows={4}
              value={this.state.sms}
              onChange={(e, d) => this.setState({ sms: d.value })}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button content="Annuler" onClick={() => this.props.onCancel()} />
          <Button
            content="Envoyer"
            primary={true}
            onClick={() => this.props.onSend(this.state.sms)}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
