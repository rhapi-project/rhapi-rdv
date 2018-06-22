import React from "react";

import _ from "lodash";

import { rdvDateTime } from "./Settings";

import { Button, Divider, Ref, List, Message, Modal } from "semantic-ui-react";

import RdvPassCardA4 from "./RdvPassCardA4";

export default class RdvPassCard extends React.Component {
  state = {
    open: false,
    newPassword: "",
    oldPassword: "",
    modalPassword: false,
    printWithPassword: false,
    carte: false,
    mesRdv: [],
    mesPlannings: []
  };

  componentWillReceiveProps() {
    this.reload();
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
        //console.log(result);
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
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // pas de chiffre car ça peut entrainer des confusions entre 0 et O ou entre 1 et I
    for (let i = 0; i < 6; i++) {
      let c = Math.floor(Math.random() * chars.length);
      passwd += chars.charAt(c);
    }
    return passwd;
  };

  print = () => {
    // uniquement la carte

    if (_.isEmpty(this.state.mesRdv) && !this.state.printWithPassword) {
      this.afterPrint();
      return;
    }

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
      navigator.userAgent.indexOf("MSIE") !== -1
    ) {
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
        console.log("Browser delay : " + this.browserDelay);
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
      open: false,
      newPassword: "",
      modalPassword: false,
      printWithPassword: false,
      carte: false
    });
  };

  sendSms = () => {
    alert("Envoi d'une confirmation par SMS (work in progress...)");

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
      // TODO mettre un checkbox rouge (ou autre visualisation retour négatif)
      return;
    }
    let message = this.state.mesPlannings[i].optionsJO.sms.confirmationTexte;
    // tester la validité du template et placer les bonnes valeur {date-heure} et {infos-annulations} !!
    // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si non valide et return

    message = _.replace(message, "{date-heure}", "mardi 19/06 à 18h50");
    let infos =
      "Infos et annulation : " + window.location.origin + "/#Patients/";
    infos += this.props.patient.id;
    if (
      !_.isUndefined(this.state.newPassword) &&
      !_.isEmpty(this.state.newPassword)
    ) {
      infos += ":" + this.state.newPassword;
    }
    infos += "@master"; // TODO récupérer l'identifiant de l'établissement
    message = _.replace(message, "{infos-annulation}", infos);
    console.log(message);

    console.log(this.props.patient.telMobile);

    let receivers = [this.props.patient.telMobile]; // <= liste de numéros de téléphone (à priori 1 seul)
    // attention le nombre de SMS disponibles pour les tests est volontairement limité !

    this.props.client.Sms.create(
      { message: message, receivers: receivers },
      datas => {
        console.log(datas);
        // TODO mettre un checkbox verte (ou autre visualisation retour positif) si le SMS est bien parti
        // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si le SMS n'est pas conforme
        // => tester les champ ad hoc pour savoir si le SMS a bien été envoyé !
      },
      errors => {
        console.log(errors);
        // TODO mettre un checkbox rouge (ou autre visualisation retour négatif) si le SMS n'est pas parti (pb réseau)
      }
    );
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
              icon="mobile"
              content="Confirmation SMS"
              onClick={this.sendSms}
            />
            <Button
              icon="print"
              content="Carte de RDV"
              onClick={() => this.setState({ carte: true })}
            />

            <RdvPassCardA4
              idPatient={this.props.patient.id}
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
              icon="help"
              content="Aide"
              onClick={() => alert("Aide avec détection du navigateur")}
            />
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
                if (!this.state.modalPassword) {
                  node.firstChild.parentElement.focus();
                }
              }}
            >
              <Button
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
          <strong>Vos prochains rendez-vous</strong>
        </div>
        {this.state.mesRdv.length === 0 ? (
          ""
        ) : (
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
        )}
        {this.props.printWithPassword ? (
          <p className="new-password">
            Accédez directement à vos rendez-vous en ligne le site (à définir
            selon intégration)<br />
            Identifiant :{" "}
            <strong>
              {this.props.patient.id + "@forme-de-l'indentifiant-à-(re)definir"}
            </strong>
            <br />
            Mot de passe : <strong>{this.props.newPassword}</strong>
          </p>
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
