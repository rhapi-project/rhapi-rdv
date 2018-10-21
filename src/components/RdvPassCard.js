import React from "react";

import _ from "lodash";

import { rdvDateTime, site } from "./Settings";

import {
  Button,
  Divider,
  Icon,
  Ref,
  List,
  Message,
  Modal
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
    //pwdGeneration: false, // proposition de génération de mot de passe (modal)
    carte: false,
    mesRdv: [],
    mesPlannings: [],
    savingModal: false,
    retourSMS: false,
    errorSMS: -1, // pas d'envoi effectué encore
    help: false
  };

  componentWillMount() {
    this.reload();
  }

  componentWillReceiveProps(next) {
    if (!_.isUndefined(this.props.saved)) {
      if (next.open && !next.saved) {
        this.setState({ savingModal: true });
      }
    }
  }

  reload = () => {
    this.props.client.RendezVous.mesRendezVous(
      { ipp: this.props.patient.id },
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
        this.setState({ mesPlannings: result.results });
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
      let c = Math.floor(Math.random() * (new Date()).getTime()) % chars.length;
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

  print = () => {
    // uniquement la carte

    let content = document.getElementById("carte");

    let win = window.open("", "Impression", "height=600,width=800");

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
      navigator.userAgent.indexOf("Trident") !== -1
    ) {
      // l'attribut "Trident" de navigator.userAgent existe
      // uniquement sur les navigateurs IE (pas Edge)
      this.browserDelay = _.isUndefined(this.browserDelay) ? 1500 : 500;

      win.onafterprint = () => {
        // win.close(); // crash => impossibilité de fermer la fenêtre ici !
        this.afterPrint();
      };
      _.delay(() => {
        win.print();
      }, this.browserDelay);
      return;
    }

    // Firefox et Chrome onafterprint
    win.onafterprint = () => {
      win.close();
      this.afterPrint();
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
      //console.log("Browser delay : " + this.browserDelay);
      //console.log(win.onload);

      win.onload = () => {
        //console.log("Browser delay : " + this.browserDelay);
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

  sendSms = () => {
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
    if (
      _.isUndefined(this.state.newPassword) ||
      _.isEmpty(this.state.newPassword)
    ) {
      pwd = this.makePasswd();
      this.setState({ newPassword: pwd });
      this.savePasswd();
    } else {
      pwd = this.state.newPassword;
    }

    // il faut prendre le premier planning autorisé à envoyer des SMS et possédant
    // un template de texte de confirmation
    let i = _.findIndex(this.state.mesPlannings, planning => {
      return (
        planning.optionsJO &&
        planning.optionsJO.sms &&
        planning.optionsJO.sms.confirmationTexte &&
        planning.optionsJO.sms.confirmationTexte !== "" &&
        (planning.optionsJO.sms.rappel12 ||
          planning.optionsJO.sms.rappel24 ||
          planning.optionsJO.sms.rappel48)
      );
    });
    if (i === -1) {
      // pas de planning autorisé à envoyer un SMS !
      // erreur (1)
      this.setState({ retourSMS: true, errorSMS: 1 });
      return;
    }
    let message = this.state.mesPlannings[i].optionsJO.sms.confirmationTexte;
    // tester la validité du template et placer les bonnes valeur {date-heure} et {infos-annulations} !!
    // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si non valide et return
    // erreur (2)

    message = _.replace(
      message,
      "{date-heure}",
      rdvDateTime(this.state.mesRdv[0].startAt)
    );
    let infos =
      "Infos et annulation : " +
      window.location.origin +
      window.location.pathname +
      "#Patients/";
    infos += this.props.patient.id;
    //infos += ":" + this.state.newPassword;
    infos += ":" + pwd;
    infos += "@" + this.state.praticien.organisation.split("@")[0];
    // split("@") si une forme master@master => master
    message = _.replace(message, "{infos-annulation}", infos);

    let receivers = [this.props.patient.telMobile]; // la normalisation du n° est assuré en backend
    // attention le nombre de SMS disponibles pour les tests est volontairement limité !

    this.props.client.Sms.create(
      { message: message, receivers: receivers },
      datas => {
        //console.log(datas);
        // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si le SMS n'est pas conforme
        // => tester les champ ad hoc pour savoir si le SMS a bien été envoyé !
        if (!_.isEmpty(datas.validReceivers)) {
          // le SMS a été envoyé
          this.setState({
            retourSMS: true,
            errorSMS: 0
          });
        } else if (!_.isEmpty(datas.invalidReceivers)) {
          // numéro invalide
          this.setState({
            retourSMS: true,
            errorSMS: 4
          });
        }
      },
      errors => {
        console.log(errors);
        this.setState({
          retourSMS: true,
          errorSMS: 3
        });
      }
    );
  };

  openHelp = bool => {
    this.setState({ help: bool });
  };

  render() {
    let infos = "";
    if (this.state.printWithPassword) {
      let siteUrl =
        window.location.origin + window.location.pathname + "#Patients/";
      infos = siteUrl;
      infos += this.props.patient.id;
      infos += ":" + this.state.newPassword;
      infos += "@";
      if (this.state.praticien.organisation) {
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
            {this.state.mesRdv.length === 0 ? (
              <span>Aucun rendez-vous n'est programmé</span>
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
              <div>
                Nouveau mot de passe : <b>{this.state.newPassword}</b>
                <br />
                Lien direct : <b>{infos}</b>
                &nbsp;
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
              </div>
            ) : (
              ""
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button
              icon="mobile"
              content="Confirmation SMS"
              onClick={this.sendSms}
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
            {this.state.mesRdv.length === 0 ? (
              <span>Aucun nouveau rendez-vous n'est actuellement fixé</span>
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

        {/* Retours SMS */}

        <Modal size="small" open={this.state.retourSMS}>
          <Modal.Header>Confirmation SMS</Modal.Header>
          <Modal.Content>
            {this.state.mesRdv.length === 0 ||
            this.props.patient.telMobile.length < 8 ? (
              <Message icon={true} info={true}>
                <Icon name="info" />
                <Message.Content>
                  <Message.Header>
                    Impossible d'envoyer un SMS de confirmation
                  </Message.Header>
                  {this.state.mesRdv.length === 0 ? (
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

          {this.state.mesRdv.length === 0 ||
          this.props.patient.telMobile.length < 8 ? (
            <Modal.Actions>
              <Ref
                innerRef={node => {
                  if (
                    this.state.mesRdv.length === 0 ||
                    this.props.patient.telMobile.length < 8
                  )
                    node.firstChild.parentElement.focus();
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
              <Ref innerRef={node => node.firstChild.parentElement.focus()}>
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
              <Ref innerRef={node => node.firstChild.parentElement.focus()}>
                <Button
                  content="Réessayer"
                  primary={true}
                  onClick={() => {
                    this.setState({
                      errorSMS: -1,
                      retourSMS: false
                    });
                    this.sendSms();
                  }}
                />
              </Ref>
              <Button
                content="Annuler"
                onClick={() =>
                  this.setState({
                    errorSMS: -1,
                    retourSMS: false
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
                  node.firstChild.parentElement.focus();
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
              mesRdv={this.state.mesRdv}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}
              print={this.print}
              patient={this.props.patient}
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

  componentWillMount() {
    this.mesRdvLimitation();
  }

  componentDidMount() {
    this.props.print();
  }

  mesRdvLimitation = () => {
    // Par défaut on affiche 4 rdv sur la carte
    // si un nouveau mot de passe a été généré, on en affichera 2 avec le nouveau mot de passe
    if (this.props.printWithPassword) {
      if (this.props.mesRdv.length <= 2) {
        this.setState({
          mesRdv: this.props.mesRdv
        });
      } else {
        let mesRdv = [];
        for (let i = 0; i < 2; i++) {
          mesRdv.push(this.props.mesRdv[i]);
        }
        this.setState({
          mesRdv: mesRdv
        });
      }
    } else {
      if (this.props.mesRdv.length <= 4) {
        this.setState({
          mesRdv: this.props.mesRdv
        });
      } else {
        let mesRdv = [];
        for (let i = 0; i < 4; i++) {
          mesRdv.push(this.props.mesRdv[i]);
        }
        this.setState({
          mesRdv: mesRdv
        });
      }
    }
  };

  render() {
    let siteUrl = "";
    let identifiant = "";
    if (this.props.printWithPassword) {
      siteUrl =
        window.location.origin + window.location.pathname + "#Patients/";
      identifiant =
        this.props.patient.id +
        "@" +
        this.props.praticien.organisation.split("@")[0];
    }

    return (
      <div id={this.props.id} className="carte" hidden={true}>
        <div className="coordonnees-praticien">
          <p>
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
            <span>{"Tél. : " + this.props.praticien.account.telBureau}</span>
          </p>
        </div>
        <div className="titre-principal">
          <strong>
            {this.state.mesRdv.length === 0
              ? ""
              : this.state.mesRdv.length === 1
                ? "Votre prochain rendez-vous"
                : "Vos prochains rendez-vous"}
          </strong>
        </div>
        {this.state.mesRdv.length === 0 ? (
          ""
        ) : (
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
            {this.props.printWithPassword ? (
              <p>
                {site.title} : <b>{siteUrl}</b>
                <br />
                Identifiant : <b>{identifiant}</b>
                &nbsp;&nbsp; Mot de passe : <b>{this.props.newPassword}</b>
              </p>
            ) : (
              ""
            )}
          </div>
        ) : (
          ""
        )}
        <div className="bottom-message">
          <Divider className="separator" />
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
