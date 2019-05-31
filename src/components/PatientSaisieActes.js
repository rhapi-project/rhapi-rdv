import React from "react";
import { Actes } from "rhapi-ui-react";
import { Button, Divider, Message, Modal } from "semantic-ui-react";

import moment from "moment";
import _ from "lodash";

export default class PatientSaisieActes extends React.Component {
  componentWillMount() {
    this.setState({
      fse: {},
      msgSaveFSE: ""
    });
    this.onPatientChange(this.props.idPatient);
  }

  // Can't perform a React state update on an unmounted component.
  // This is a no-op, but it indicates a memory leak in your application.
  // To fix, cancel all subscriptions and asynchronous tasks in the componentWillUnmount method
  componentWillUnmount() {
    this.setState({
      fse: {} // No render if fse is empty
    });
  }

  componentWillReceiveProps(next) {
    this.setState({
      fse: {},
      msgSaveFSE: ""
    });
    this.onPatientChange(next.idPatient);
  }

  createFSE = idPatient => {
    let params = {
      code: "#FSE",
      etat: 1,
      idPatient: idPatient,
      description: "Nouvelle FSE du patient d'id " + idPatient
    };
    this.props.client.Actes.create(
      params,
      result => {
        //console.log(result);
        this.setState({ fse: result, msgSaveFSE: "" });
      },
      error => {
        console.log(error);
        this.setState({ fse: {} });
      }
    );
  };

  onPatientChange = id => {
    if (id) {
      let params = {
        _code: "#FSE",
        _etat: 1,
        _idPatient: id
      };
      this.props.client.Actes.readAll(
        params,
        result => {
          let actes = result.results;
          //console.log(actes);
          if (_.isEmpty(actes)) {
            this.createFSE(id);
          } else if (actes.length > 1) {
            let recent = _.maxBy(actes, a => moment.max(moment(a.modifiedAt)));
            this.setState({ fse: recent });
          } else {
            this.setState({ fse: actes[0] });
          }
        },
        error => {
          console.log(error);
          this.setState({ fse: {} });
        }
      );
    } else {
      this.setState({ fse: {} });
    }
  };

  createActe = (acte, idDocument, idPatient) => {
    let params = {
      code: acte.code,
      doneAt: acte.date,
      localisation: acte.localisation,
      cotation: acte.cotation,
      description: acte.description,
      montant: acte.montant,
      idPatient: idPatient,
      idDocument: idDocument,
      etat: 0
    };
    this.props.client.Actes.create(
      params,
      result => {
        console.log("création avec succès d'un acte");
      },
      error => {
        console.log(error);
        console.log("La création d'un acte a échoué");
      }
    );
  };

  save = () => {
    this.props.client.Actes.read(
      this.state.fse.id,
      {},
      result => {
        let actes = _.get(result, "contentJO.actes", []);
        _.forEach(actes, acte => {
          this.createActe(acte, result.id, result.idPatient);
        });
        this.props.client.Actes.update(
          result.id,
          { etat: 0, doneAt: new Date().toISOString() },
          result => {
            this.setState({
              msgSaveFSE: "Cette FSE a été bien enregistrée !",
              fse: {}
            });
            this.onPatientChange(this.props.idPatient);
          },
          error => {
            this.setState({ msgSaveFSE: "Erreur de sauvegarde de la FSE !" });
          }
        );
      },
      error => {
        this.setState({
          msgSaveFSE:
            "Erreur de sauvegarde de la FSE ! Lecture de cette acte impossible "
        });
      }
    );
  };

  destroy = () => {
    this.props.client.Actes.destroy(
      this.state.fse.id,
      result => {
        this.setState({ fse: {} });
        this.onPatientChange(this.props.idPatient);
      },
      error => {
        console.log(error);
      }
    );
  };

  onError = () => {
    this.setState({ fse: {} });
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
        <React.Fragment>
          <Divider hidden={true} />
          {!_.isEmpty(this.state.fse) ? (
            <div>
              <Actes.Saisie
                client={this.props.client}
                idActe={this.state.fse.id}
                onError={this.onError}
                lignes={10}
              />
              <span>
                <Button content="Valider" onClick={this.save} />
                <Button
                  content="Supprimer"
                  negative={true}
                  onClick={this.destroy}
                />
              </span>
            </div>
          ) : (
            ""
          )}
          <Modal
            size="mini"
            open={!_.isEmpty(this.state.msgSaveFSE)}
            onClose={() => this.setState({ msgSaveFSE: "" })}
          >
            <Modal.Header>Résultat validation FSE</Modal.Header>
            <Modal.Content>
              <Message>{this.state.msgSaveFSE}</Message>
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="OK"
                onClick={() =>
                  this.setState({ idPatient: null, msgSaveFSE: "" })
                }
              />
            </Modal.Actions>
          </Modal>
        </React.Fragment>
      );
  }
}
