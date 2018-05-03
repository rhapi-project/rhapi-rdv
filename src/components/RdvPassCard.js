import React from "react";

import _ from "lodash";

import moment from "moment";

import { rdvDateTime } from "./Settings";

import {
  Button,
  Divider,
  Icon,
  List,
  Message,
  Modal,
  Segment,
  Table
} from "semantic-ui-react";

export default class RdvPassCard extends React.Component {
  state = {
    open: false,
    newPassword: "",
    modalPassword: false,
    printFormat: false,
    printWithPassword: false,
    chosenFormat: 0 // 1 : carton, 2 : A4
  };

  componentWillReceiveProps() {
    this.reload();
  }

  reload = () => {
    console.log(
      moment()
        .toISOString()
        .split("T")[0]
    );

    let params = {
      _idPatient: this.props.idPatient,
      q1:
        "startAt,GreaterThan," +
        moment()
          .toISOString()
          .split("T")[0],
      limit: "1000",
      sort: "startAt",
      fields: "startAt,endAt,planningsJA"
    };

    this.props.client.RendezVous.readAll(
      params,
      result => {
        // success
        console.log(result);
        this.setState({ mesRdv: result.results });
      },
      () => {
        // error
        console.log("Erreur this.props.client.RendezVous.readAll");
      }
    );

    // à voir si on garde cette information ou pas
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

  render() {
    // feuille d'impression
    if (this.state.chosenFormat === 1) {
      // carton
      // avec window.open -> difficulté de rendre un component React

      /*  let carton = window.open("localhost:3000/#Praticiens/Patients", "RHAPI RDV - Impression carton", "width=300, height=600");

      carton.document.write("<div>");
      carton.document.write("<h3>Vos prochains rendez-vous</h3>");

      if (this.state.mesRdv.length === 0) {
        carton.document.write("<span>Aucun rendez-vous trouvé !</span>");
      } else {
        let mesRdv = this.state.mesRdv;
        let newPwd = this.state.newPassword;
        //carton.document.write("<span>" + mesRdv.length + " rendez-vous trouvés !</span><br />");

        carton.document.write("<ul>");
        for (let i = 0; i < mesRdv.length; i++) {
          carton.document.write("<li>");
          carton.document.write(_.upperFirst(rdvDateTime(mesRdv[i].startAt)));
          carton.document.write("</li>");
          //carton.document.write("<Divider hidden />");
        }
        carton.document.write("</ul>");

        if (this.state.printWithPassword) {
          carton.document.write("<div>");
          carton.document.write("Nouveau mot de passe : " + newPwd);
          carton.document.write("</div>");
        }
      }

      carton.document.write("</div>");

      carton.print();
      carton.close();
      this.setState({ chosenFormat: 0 }); */
      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      return (
        <Carton
          mesRdv={this.state.mesRdv}
          printWithPassword={this.state.printWithPassword}
          newPassword={this.state.newPassword}
        />
      ); // attention, ceci remplace tout le composant RdvPassCard.js

      /*return (
          <div>
            <ReactToPrint
              trigger={() => <a href="#">Imprimer</a>}
              content={() => this.componentRef}/>
            <Carton 
              ref={el => (this.componentRef = el)}
              mesRdv={this.state.mesRdv}
              printWithPassword={this.state.printWithPassword}
              newPassword={this.state.newPassword}/>
          </div>
        );*/
    } else if (this.state.chosenFormat === 2) {
      // Impression d'une feuille de format A4 (avec plus de détails)
      return (
        <FormatA4
          praticien={this.state.praticien}
          mesRdv={this.state.mesRdv}
          printWithPassword={this.state.printWithPassword}
          newPassword={this.state.newPassword}
        />
      );
    }

    // modal choix du format d'impression
    if (this.state.printFormat) {
      return (
        <Modal size="tiny" open={this.state.printFormat}>
          <Modal.Header>Choisissez le format d'impression</Modal.Header>
          <Modal.Content>
            <p>
              <strong>A4</strong> : Liste des prochains rendez-vous avec
              détails. <br />
              <strong>Carton</strong> : Liste des prochains rendez-vous sans
              détails.
            </p>
          </Modal.Content>
          <Modal.Actions>
            <Button
              onClick={() => {
                this.setState({
                  chosenFormat: 1,
                  printFormat: false
                });
              }}
            >
              Carton
            </Button>
            <Button
              onClick={() => {
                this.setState({
                  chosenFormat: 2,
                  printFormat: false
                });
              }}
            >
              A4
            </Button>
          </Modal.Actions>
        </Modal>
      );
    }

    if (this.state.open) {
      return (
        <div>
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
            </Modal.Content>
            <Modal.Actions>
              <Button
                icon={true}
                primary={true}
                labelPosition="right"
                onClick={() =>
                  this.setState({
                    printFormat: true,
                    open: false,
                    chosenFormat: 0
                  })
                }
              >
                Imprimer
                <Icon name="print" />
              </Button>
              <Button
                positive={true}
                onClick={() => {
                  let pwd = this.makePasswd();
                  this.setState({
                    newPassword: pwd,
                    modalPassword: true,
                    chosenFormat: 0
                  });
                }}
              >
                Nouveau mot de passe
              </Button>
              <Button
                negative={true}
                onClick={() => this.setState({ open: false })}
              >
                Fermer
              </Button>
            </Modal.Actions>
          </Modal>

          {/*Modal password*/}

          <Modal size="small" open={this.state.modalPassword}>
            <Modal.Header>Nouveau mot de passe</Modal.Header>
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
                  Êtes-vous sûr de vouloir remplacer l'ancien mot de passe ?
                </strong>
              </p>
            </Modal.Content>
            <Modal.Actions>
              <Button
                negative={true}
                onClick={() => this.setState({ modalPassword: false })}
              >
                Non
              </Button>
              <Button
                positive={true}
                onClick={() => {
                  this.props.client.Patients.read(
                    this.props.idPatient,
                    {},
                    result => {
                      // success
                      console.log(result);
                      let obj = result;
                      obj.gestionRdvJO.reservation.password = this.state.newPassword;

                      this.props.client.Patients.update(
                        this.props.idPatient,
                        obj,
                        () => {
                          // success
                          this.setState({
                            modalPassword: false,
                            printFormat: true,
                            printWithPassword: true,
                            open: false
                          });
                          console.log("Mise à jour terminée");
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
              >
                Oui
              </Button>
            </Modal.Actions>
          </Modal>
        </div>
      );
    } else {
      return (
        // 3 cas de figures
        this.props.label !== "" && this.props.icon !== "" ? (
          <Button
            icon={true}
            labelPosition="right"
            onClick={() => this.setState({ open: true })}
          >
            {this.props.label}
            <Icon name={this.props.icon} />
          </Button>
        ) : this.props.label === "" ? (
          <Button icon={true} onClick={() => this.setState({ open: true })}>
            <Icon name={this.props.icon} />
          </Button>
        ) : (
          <Button onClick={() => this.setState({ open: true })}>
            {this.props.label}
          </Button>
        )
      );
    }
  }
}

class Carton extends React.Component {
  /*componentDidMount() {
    setTimeout(() => window.print(), 1000);
  }*/
  componentWillMount() {
    this.setState({
      mesRdv: this.props.mesRdv,
      printWithPassword: this.props.printWithPassword,
      newPassword: this.props.newPassword,
      print: false
    });
  }

  componentDidMount() {
    this.setState({
      print: true
    });
  }

  print;

  render() {
    console.log(this.props.mesRdv);
    return (
      <React.Fragment>
        <h3>Vos prochains rendez-vous</h3>
        {this.state.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
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
            Votre nouveau mot de passe : <br />
            <strong>{this.state.newPassword}</strong>
          </p>
        ) : (
          ""
        )}
      </React.Fragment>
    );
  }
}

class FormatA4 extends React.Component {
  componentWillMount() {
    this.setState({
      praticien: this.props.praticien,
      mesRdv: this.props.mesRdv,
      printWithPassword: this.props.printWithPassword,
      newPassword: this.props.newPassword
    });
  }
  render() {
    return (
      <React.Fragment>
        <Segment basic={true}>
          <strong>{this.state.praticien.currentName}</strong>
          <br />
          Tél Bureau : {this.state.praticien.account.telBureau} <br />
          Tél Mobile : {this.state.praticien.account.telMobile} <br />
          E-mail : {this.state.praticien.account.email}
          <Divider hidden={true} />
          Adresse : {this.state.praticien.account.adresse1} <br />
          {this.state.praticien.account.adresse2 +
            " " +
            this.state.praticien.account.adresse3}{" "}
          <br />
          {this.state.praticien.account.codePostal +
            " " +
            this.state.praticien.account.ville}
        </Segment>

        <Divider hidden={true} />

        <h3>Vos prochains rendez-vous</h3>
        {this.state.mesRdv.length === 0 ? (
          <Message compact={true}>
            <Message.Content>
              <p>Aucun rendez-vous n'a été trouvé !</p>
            </Message.Content>
          </Message>
        ) : (
          <Table basic={true} fixed={true} stackable={true}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date et Heure</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {_.map(this.state.mesRdv, (item, i) => {
                return (
                  <Table.Row key={i}>
                    <Table.Cell collapsing>
                      {_.upperFirst(rdvDateTime(item.startAt))}
                    </Table.Cell>
                    <Table.Cell>{"description " + i}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
        <Divider hidden={true} />
        {this.state.printWithPassword ? (
          <p>
            Un nouveau mot de passe a été généré. <br />
            Le nouveau mot de passe que vous utiliserez pour acceder à vos
            rendez-vous en ligne est : <strong>{this.state.newPassword}</strong>
          </p>
        ) : (
          ""
        )}
      </React.Fragment>
    );
  }
}
