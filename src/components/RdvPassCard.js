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
    printWithPassword: false,
    chosenFormat: 0 // 1 : carton, 2 : A4
  };

  componentWillReceiveProps() {
    this.reload();
  }

  reload = () => {
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
        //console.log(result);
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

  print = () => {
    if (this.state.chosenFormat === 1) {
      let content = document.getElementById("carton");
      let pri = document.getElementById("iframeToPrint").contentWindow;
      pri.document.open();
      pri.document.write(content.innerHTML);
      pri.document.close();
      pri.focus();
      pri.print();
    } else if (this.state.chosenFormat === 2) {
      let content = document.getElementById("a4");
      let pri = document.getElementById("iframeToPrint").contentWindow;
      pri.document.open();
      pri.document.write(content.innerHTML);
      pri.document.close();
      pri.focus();
      pri.print();
    } else return;
  };

  componentDidMount() {
    if (_.isUndefined(window.onafterprint) && window.matchMedia) {
      let mediaQueryList = window.matchMedia("print");
      mediaQueryList.addListener(mql => {
        //console.log(mql);
        if (!mql.matches) {
          this.afterPrint();
        }
      });
    } else {
      window.onafterprint = this.afterPrint;
    }
    //this.reload();
  }

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
              {this.state.printWithPassword ? (
                <p>
                  Votre nouveau mot de passe : <br />
                  <strong>{this.state.newPassword}</strong>
                </p>
              ) : (
                ""
              )}
            </Modal.Content>
            <Modal.Actions>
              <Button
                primary={true}
                icon={true}
                labelPosition="right"
                onClick={() => this.setState({ chosenFormat: 2 })}
              >
                Format A4
                <Icon name="print" />
              </Button>
              <Button
                primary={true}
                icon={true}
                labelPosition="right"
                onClick={() => this.setState({ chosenFormat: 1 })}
              >
                Format Carton
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
              >
                Oui
              </Button>
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
              <Carton
                id="carton"
                mesRdv={this.state.mesRdv}
                printWithPassword={this.state.printWithPassword}
                newPassword={this.state.newPassword}
                print={this.print}
              />
              <iframe
                id="iframeToPrint"
                title="carton"
                style={{ height: "0px", width: "0px", position: "absolute" }}
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
              <FormatA4
                id="a4"
                praticien={this.state.praticien}
                mesRdv={this.state.mesRdv}
                printWithPassword={this.state.printWithPassword}
                newPassword={this.state.newPassword}
                print={this.print}
              />
              <iframe
                id="iframeToPrint"
                title="carton"
                style={{ height: "0px", width: "0px", position: "absolute" }}
              />
            </Modal.Content>
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
  componentWillMount() {
    this.setState({
      mesRdv: this.props.mesRdv,
      printWithPassword: this.props.printWithPassword,
      newPassword: this.props.newPassword,
      print: false
    });
  }

  componentDidMount() {
    setTimeout(() => {
      this.props.print();
    }, 1000);
  }

  render() {
    //console.log(this.props.mesRdv);
    return (
      <div id={this.props.id}>
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
      </div>
    );
  }
}

class FormatA4 extends React.Component {
  componentWillMount() {
    this.setState({
      mesRdv: this.props.mesRdv,
      printWithPassword: this.props.printWithPassword,
      newPassword: this.props.newPassword
    });
  }

  componentDidMount() {
    setTimeout(() => {
      this.props.print();
    }, 1000);
  }
  render() {
    return (
      <div id={this.props.id}>
        <Segment basic={true}>
          <strong>{this.props.praticien.currentName}</strong>
          <br />
          Tél Bureau : {this.props.praticien.account.telBureau} <br />
          Tél Mobile : {this.props.praticien.account.telMobile} <br />
          E-mail : {this.props.praticien.account.email}
          <Divider hidden={true} />
          Adresse : {this.props.praticien.account.adresse1} <br />
          {this.props.praticien.account.adresse2 +
            " " +
            this.props.praticien.account.adresse3}{" "}
          <br />
          {this.props.praticien.account.codePostal +
            " " +
            this.props.praticien.account.ville}
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
      </div>
    );
  }
}
