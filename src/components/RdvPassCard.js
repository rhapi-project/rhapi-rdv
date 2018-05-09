import React from "react";

import _ from "lodash";

//import moment from "moment";

import { rdvDateTime } from "./Settings";

import { Button, Divider, Ref, List, Message, Modal } from "semantic-ui-react";

export default class RdvPassCard extends React.Component {
  state = {
    open: false,
    newPassword: "",
    oldPassword: "",
    modalPassword: false,
    printWithPassword: false,
    chosenFormat: 0, // 1 : carton, 2 : A4
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
        console.log(result);
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
        console.log(result);
        /*
        TODO
        L'objet mesPlannings permettra de renseigner toutes les informations utiles
        pour chaque rendez-vous du patient (surtout sur la version détaillée en A4)
        - nom du/des plannings concerné(s) par le rendez-vous (champ planningsJA du rdv)
        - motif (le texte en clair)
        - etc... (mise en couleur ?)
    
        voir exemple ligne 66 de mesRdv.js
        let titrePlanning = "";
        if (
            !_.isUndefined(this.props.plannings) &&
            !_.isUndefined(this.props.rdv.planningsJA)
           ) {
             titrePlanning = this.props.plannings[this.props.rdv.planningsJA[0].id]
             .titre;
             if (_.isUndefined(titrePlanning)) titrePlanning = "Planning non défini";
        }
        */
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
    let format = this.state.chosenFormat;
    if (format !== 1 && format !== 2) {
      return;
    }

    let pri = document.getElementById("iframeToPrint").contentWindow;

    if (pri.matchMedia) {
      // Safari
      let mediaQueryList = pri.matchMedia("print");
      mediaQueryList.addListener(mql => {
        if (!mql.matches) {
          console.log("ok");
          this.afterPrint();
        }
      });
    }

    let content =
      format === 1
        ? document.getElementById("carton")
        : document.getElementById("a4");
    pri.document.open();
    pri.document.write(content.innerHTML);
    pri.document.close();
    pri.focus();
    pri.onbeforeunload = this.afterPrint; // // Firefox
    pri.onafterprint = this.afterPrint; // Chrome
    pri.print();
  };

  afterPrint = () => {
    // fermeture de toutes les modals
    this.setState({
      open: false,
      newPassword: "",
      modalPassword: false,
      printWithPassword: false,
      chosenFormat: 0 // 1 : carton, 2 : A4
    });
  };

  render() {
    return (
      <React.Fragment>
        <Modal size="small" open={this.state.open}>
          <Modal.Header>Prochains rendez-vous</Modal.Header>
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
              content="Format A4"
              onClick={() => this.setState({ chosenFormat: 2 })}
            />
            <Button
              icon="print"
              content="Format carton"
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

        {/*Modal password*/}

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

        {/*Modal Carton*/}

        <Modal
          size="small"
          open={this.state.chosenFormat === 1}
          closeIcon={true}
          onClose={() => this.setState({ chosenFormat: 0 })}
        >
          <Modal.Header>Impression format carton</Modal.Header>
          <Modal.Content>
            Préparation de l'impression...
            <Carton
              id="carton"
              mesRdv={this.state.mesRdv}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}
              print={this.print}
              idPatient={this.props.idPatient}
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

        {/*Modal A4*/}

        <Modal
          size="small"
          open={this.state.chosenFormat === 2}
          closeIcon={true}
          onClose={() => this.setState({ chosenFormat: 0 })}
        >
          <Modal.Header>Impression format A4</Modal.Header>
          <Modal.Content>
            Préparation de l'impression...
            <FormatA4
              id="a4"
              praticien={this.state.praticien}
              mesRdv={this.state.mesRdv}
              mesPlannings={this.state.mesPlannings}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}
              print={this.print}
              idPatient={this.props.idPatient}
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

class Carton extends React.Component {
  componentDidMount() {
    this.props.print();
  }

  render() {
    //console.log(this.props.mesRdv);
    return (
      <div id={this.props.id} hidden={true}>
        <h3>Vos prochains rendez-vous</h3>
        {this.props.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
        ) : (
          <List bulleted={true}>
            {_.map(this.props.mesRdv, (item, i) => {
              return (
                <List.Item
                  key={i}
                  content={_.upperFirst(rdvDateTime(item.startAt))}
                />
              );
            })}
          </List>
        )}
        {this.props.printWithPassword ? (
          <p>
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
      </div>
    );
  }
}

class FormatA4 extends React.Component {
  componentDidMount() {
    this.props.print();
  }

  render() {
    return (
      <div id={this.props.id} hidden={true}>
        <div>
          <strong>{this.props.praticien.currentName}</strong>
          <br />
          Tél Bureau : {this.props.praticien.account.telBureau} <br />
          Tél Mobile : {this.props.praticien.account.telMobile} <br />
          E-mail : {this.props.praticien.account.email} <br />
          Adresse : {this.props.praticien.account.adresse1} <br />
          {this.props.praticien.account.adresse2 +
            " " +
            this.props.praticien.account.adresse3}{" "}
          <br />
          {this.props.praticien.account.codePostal +
            " " +
            this.props.praticien.account.ville}
        </div>

        <Divider />

        <h3>Vos prochains rendez-vous</h3>
        {this.props.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
        ) : (
          <table style={{ borderCollapse: "collapse", textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid black" }}>Date et heure</th>
                <th style={{ border: "1px solid black" }}>Rendez-vous</th>
                <th style={{ border: "1px solid black" }}>Motif</th>
                <th style={{ border: "1px solid black" }}>Plannings</th>
              </tr>
            </thead>
            <tbody>
              {_.map(this.props.mesRdv, (item, i) => {
                let planningId = item.planningsJA[0].id;
                let motifNumero = item.planningsJA[0].motif; // number
                let motif = "";
                let rdv = "";
                let nomPlanning = "";
                for (let j = 0; j < this.props.mesPlannings.length; j++) {
                  if (this.props.mesPlannings[j].id === planningId) {
                    rdv = this.props.mesPlannings[j].titre;
                    nomPlanning = this.props.mesPlannings[j].description;
                    motif = this.props.mesPlannings[j].optionsJO.reservation
                      .motifs[motifNumero].motif;
                  }
                }
                return (
                  <tr key={i}>
                    <td style={{ border: "1px solid black", width: "25%" }}>
                      {_.upperFirst(rdvDateTime(item.startAt))}
                    </td>
                    <td style={{ border: "1px solid black", width: "20%" }}>
                      {_.upperFirst(rdv)}
                    </td>
                    <td style={{ border: "1px solid black" }}>{motif}</td>
                    <td style={{ border: "1px solid black", width: "20%" }}>
                      {nomPlanning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Divider hidden={true} />
        {this.props.printWithPassword ? (
          <p>
            Accédez directement à vos rendez-vous en ligne depuis le site (à
            définir selon intégration)<br />
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
      </div>
    );
  }
}
