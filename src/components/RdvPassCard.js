import React from "react";

import _ from "lodash";

import moment from "moment";

import { rdvDateTime } from "./Settings";
// la date/heure du RDV dans un format commun
// voir dans Settings => il n'y pas de split et autres complications ;-)

import { Button, Icon, List, Message, Modal, Segment } from "semantic-ui-react";

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
    //
    // Les 2 lignes ci-dessous étaient à revoir :
    // moment propose une fonction qui donne directement la date au format UTC
    // Là vous prenez la date du jour (qui à l'origine est en UTC),
    // vous supposez que le navigateur est français et ensuite
    // vous convertissez en UTC avec des split sur '/'
    // => ce n'est vraiment pas top et sujet à de multiples bugs
    //
    //let today = moment().format("L"); // La date est en français => vous êtes sûr ?????
    //let t = _.split(today, "/");

    //console.log(t[2] + "-" + t[1] + "-" + t[0]);

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
          .split("T")[0], //t[2] + "-" + t[1] + "-" + t[0],
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
          praticien: monProfil.currentName
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

  /*
  dateTransformation = date => {
      // 
      // trop compliqué et pas robuste
      //
    // JJ/MM/AAAA
    let utc = moment(date)._i; //  ex : 2018-04-27T09:00:00
    let onlyDate = _.split(utc, "T")[0];
    let t = _.split(onlyDate, "-");
    return t[2] + "/" + t[1] + "/" + t[0];
  };

  timeTransformation = date => {
      // 
      // trop compliqué et pas robuste
      //
    // 09h00
    let utc = moment(date)._i;
    let onlyTime = _.split(utc, "T")[1];
    let t = _.split(onlyTime, ":");
    return " " + t[0] + " h " + t[1] + " ";
  };

  getDay = date => {
    return _.upperFirst(_.split(moment(date).format("LLLL"), " ")[0]);
  };
  */

  render() {
    const newPassword = this.makePasswd();

    // feuille d'impression
    // attention, le retour ne doit pas se faire dans le composant RdvPassCard...
    // A revoir
    if (this.state.chosenFormat === 1) {
      return (
        <React.Fragment>
          <Segment
            style={{
              marginLeft: "10%",
              marginRight: "10%"
            }}
          >
            <p>
              <h3>Vos prochains rendez-vous</h3>
            </p>
            {this.state.mesRdv.length === 0 ? (
              <span>Aucun rendez-vous trouvé !</span>
            ) : (
              <List bulleted={true}>
                {_.map(this.state.mesRdv, (item, i) => {
                  return (
                    <List.Item
                      key={i}
                      content={
                        _.upperFirst(rdvDateTime(item.startAt))
                        // on n'indique pas la durée du RDV !
                        /*
                        this.getDay(item.startAt) +
                        " " +
                        "le " +
                        this.dateTransformation(item.startAt) +
                        " : " +
                        this.timeTransformation(item.startAt) +
                        " - " +
                        this.timeTransformation(item.endAt)
                          */
                      }
                    />
                  );
                })}
              </List>
            )}
            {/*Rajouter le mot de passe s'il y en a eu un*/}
          </Segment>
        </React.Fragment>
      );
    } else if (this.state.chosenFormat === 2) {
      // Impression d'une feuille de format A4 (avec plus de détails)
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
                        content={
                          _.upperFirst(rdvDateTime(item.startAt))
                          // inutile de mentionner la fin du rdv
                          /*
                          this.getDay(item.startAt) +
                          " " +
                          "le " +
                          this.dateTransformation(item.startAt) +
                          " : " +
                          this.timeTransformation(item.startAt) +
                          " - " +
                          this.timeTransformation(item.endAt)
                          */
                        }
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
                    open: false
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
                    modalPassword: true
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
                        content={
                          _.upperFirst(rdvDateTime(item.startAt))
                          // inutile de mentionner la fin du rdv
                          /*
                          this.getDay(item.startAt) +
                          " " +
                          "le " +
                          this.dateTransformation(item.startAt) +
                          " : " +
                          this.timeTransformation(item.startAt) +
                          " - " +
                          this.timeTransformation(item.endAt)
                          */
                        }
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
                  this.setState({
                    modalPassword: false,
                    printFormat: true,
                    printWithPassword: true
                  });
                  // le mot de passe va être sauvegardé
                  // => Non il est sauvegardé maintenant dès qu'on a une réponse favorable à
                  // "Êtes-vous sûr de vouloir remplacer l'ancien mot de passe ?"
                  // Il ne faut pas "remonter" le password dans le component parent
                  // ... qui ne sera d'ailleurs pas toujours en mesure de le gérer
                  // la prop newPassword ne figure pas au le cahier des charges de RdvPassCard
                  // => il faut le sauvegarder ici directement avec un update patient !
                  this.props.newPassword(this.state.newPassword);
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
