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
      { ipp: this.props.idPatient },
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
      '<link rel="stylesheet" type="text/css" href="print-css/carte.css" />'
    );
    win.document.write("</head><body>");
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");

    win.document.close();
    win.focus();

    /*
    Le css est chargé de manière asynchrone parallèlement au DOM.
    Le trigger onload est déclenché à la fin du chargement du DOM, mais le ccs -
    plus lourd - n'est pas toujours totalement chargé à ce moment-là et il 
    n'est pas encore en cache à la première impression...
    Il est donc nécessaire de précharger le css semantic avec toutes les images associées
    voir index.html : <!-- préchargement semantic.min.css utilisé lors de l'impression --> 
    */

    if (win.matchMedia) {
      // Safari ou Firefox
      let mediaQueryList = win.matchMedia("print");
      // Safari mediaQueryList.addListener
      mediaQueryList.addListener(mql => {
        if (!mql.matches) {
          win.close();
          this.afterPrint();
        }
      });
      // Firefox onafterprint
      win.onafterprint = () => {
        win.close();
        this.afterPrint();
      };
      win.onload = win.print();
    } else {
      // Chrome
      win.onload = () => {
        win.print();
        win.close();
        this.afterPrint();
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
    alert("Envoi SMS à implémenter");
    // Test lecture de l'historique des envois : n'a rien à faire ici mais devra être implémenté dans Profil.js
    this.props.client.Sms.readAll(
      {},
      datas => {
        console.log(datas);
      },
      errors => {
        console.log(errors);
      }
    );
    //
    // Test envoi SMS
    // à implémenter ici avec :
    // - le bon numéro de tél
    // - les données du praticien
    // - les prochains RDV
    // - le bon lien , l'identifiant et le mot de passe
    // - mettre un checkbox verte (ou autre visualisation retour positif) si le SMS est bien parti
    let receivers = ["+336xxxxxxxx"];
    // tester ici avec votre numéro de téléphone ou mettre votre numéro de tél comme tel mobile du patient
    // attention le nombre de SMS disponibles pour les tests est volontairement limité !
    let message =
      "RDV mardi 19/06 à 18h50 Dr Jean-Paul Durand 12 Bd Foch 49100 Angers 02 41 58 98 15\n";
    message += "Infos et annulation : https://un-lien.fr\n";
    message += "Identifiant : 1256\n";
    message += "Mot de passe : dfTwr";
    this.props.client.Sms.create(
      { message: message, receivers: receivers },
      datas => {
        console.log(datas);
      },
      errors => {
        console.log(errors);
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
              Click={this.sendSms}
            />
            <Button
              icon="print"
              content="Carte de RDV"
              onClick={() => this.setState({ carte: true })}
            />

            <RdvPassCardA4
              idPatient={this.props.idPatient}
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
              idPatient={this.props.idPatient}
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
  componentDidMount() {
    this.props.print();
  }

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
        {this.props.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
        ) : (
          <List>
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
