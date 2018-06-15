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

    //Solution avec l'ouverture d'une window
    // DEBUT
    let content = document.getElementById("carte");

    let win = window.open("", "Print", "height=600,width=800");

    win.document.write("<html><head>");
    win.document.write(
      '<link rel="stylesheet" type="text/css" href="iframes/carte.css" />'
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
          this.afterPrint();
          win.close();
        }
      });
    }

    setTimeout(() => {
      win.print();
    }, 1500);
    // TODO : Supprimer le timeout ! (Voir ligne ci-dessous)
    //win.onloadend = () =>{ win.print() };

    win.onbeforeunload = this.afterPrint;

    if (typeof InstallTrigger !== "undefined" && !document.documentMode) {
      // firefox
      setTimeout(() => {
        win.print();
        win.close();
      }, 1500);
      win.onafterprint = this.afterPrint;
    }
    // FIN
    // -----------------------------------------------------------------------------
    /*
    // cette solution ne marche pas forcement sur tous les navigateurs

    // DEBUT

    let pri = document.getElementById("iframeToPrint");

    if (pri.contentWindow.matchMedia) {
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
    } else {
      content = document.getElementById("details");
    }

    // écriture du contenu
    pri.contentWindow.document.write("<html><head>");
    if (format === 1) {
      pri.contentWindow.document.write(
        '<link rel="stylesheet" type="text/css" href="iframes/carte.css" />'
      );
    } else {
      pri.contentWindow.document.write(
        '<link rel="stylesheet" type="text/css" href="iframes/a4.css" />'
      );
    }
    pri.contentWindow.document.write("</head><body>");
    pri.contentWindow.document.write(content.innerHTML);
    pri.contentWindow.document.write("</body></html>");

    pri.contentWindow.focus();

    pri.contentWindow.onbeforeunload = this.afterPrint;
    pri.contentWindow.onafterprint = this.afterPrint;

    console.log(this.state.printFormat2);

    //pri.contentWindow.print(); pas sûr que ça marche partout

    setTimeout(() => {
      pri.contentWindow.print();
    }, 1500);

    // FIN*/

    // autre solution c'est d'ouvrir une fenêtre, y mettre du contenu et l'imprimer
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
            <Button
              icon="print"
              content="Carte"
              onClick={() => this.setState({ carte: true })}
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
