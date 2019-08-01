import React from "react";
import { Actes } from "rhapi-ui-react";
import {
  Button,
  Divider,
  Header,
  Input,
  Menu,
  Message,
  Modal
} from "semantic-ui-react";

import moment from "moment";
import _ from "lodash";

import site from "./SiteSettings";

export default class PatientSaisieActes extends React.Component {
  componentWillMount() {
    this.setState({
      fse: {},
      msgSaveFSE: "",
      acteToAdd: {}, // acte à ajouter dans une FSE
      typeActe: "#FSE",
      editable: true,
      acteTitre: "",
      modalChangeActeTitre: false
    });
    if (!_.isNull(this.props.idActe) && !this.props.acteCopy) {
      this.read(
        this.props.idActe,
        result => {
          this.setState({
            fse: result,
            editable: result.code !== "#FSE",
            typeActe: result.code
          });
        },
        error => {
          console.log(error);
          this.setState({ fse: {} });
        }
      );
    } else if (!_.isNull(this.props.idActe) && this.props.acteCopy) {
      this.copyActe(this.props.idActe);
    } else {
      this.onPatientChange(this.props.idPatient, "#FSE", {});
    }
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
    this.onPatientChange(next.idPatient, this.state.typeActe, {});
  }

  read = (idActe, onSuccess, onError) => {
    this.props.client.Actes.read(
      idActe,
      {},
      result => {
        onSuccess(result);
      },
      error => {
        onError(error);
      }
    );
  };

  copyActe = idActe => {
    this.read(
      idActe,
      result => {
        this.create(
          this.props.idPatient,
          result.code,
          res => {
            let params = { ...result };
            _.unset(params, "etat");
            _.unset(params, "lockRevision");
            _.set(params, "doneAt", moment().toISOString());
            this.update(
              res.id,
              params,
              r => {
                this.setState({ fse: r, editable: true });
              },
              e => {
                console.log(e);
                this.setState({ fse: {} });
              }
            );
          },
          err => {
            console.log(err);
            this.setState({ fse: {} });
          }
        );
      },
      error => {
        console.log(error);
        this.setState({ fse: {} });
      }
    );
  };

  create = (idPatient, typeActe, onSuccess, onError) => {
    let params = {
      code: typeActe,
      etat: 1,
      idPatient: idPatient,
      description:
        typeActe === "#FSE"
          ? site.evolution.actes.fseTitre
          : typeActe === "#DEVIS"
          ? site.evolution.actes.devisTitre
          : "Titre par défaut"
    };
    this.props.client.Actes.create(
      params,
      result => {
        onSuccess(result);
      },
      error => {
        onError(error);
      }
    );
  };

  onPatientChange = (id, typeActe, acteToAdd) => {
    if (id) {
      let params = {
        _code: typeActe,
        _etat: 1,
        _idPatient: id
      };
      this.props.client.Actes.readAll(
        params,
        result => {
          let actes = result.results;
          //console.log(actes);
          if (_.isEmpty(actes)) {
            this.create(
              id,
              typeActe,
              res => {
                this.setState({
                  fse: res,
                  acteToAdd: acteToAdd,
                  editable: true
                });
              },
              err => {
                console.log(err);
                this.setState({ fse: {} });
              }
            );
          } else if (actes.length > 1) {
            let recent = _.maxBy(actes, a => moment.max(moment(a.modifiedAt)));
            this.setState({
              fse: recent,
              acteToAdd: acteToAdd,
              editable: true
            });
          } else {
            this.setState({
              fse: actes[0],
              acteToAdd: acteToAdd,
              editable: true
            });
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
        //console.log("création avec succès d'un acte");
      },
      error => {
        console.log(error);
        console.log("La création d'un acte a échoué");
      }
    );
  };

  update = (idActe, params, onSuccess, onError) => {
    this.props.client.Actes.update(
      idActe,
      params,
      result => {
        onSuccess(result);
      },
      error => {
        onError(error);
      }
    );
  };

  save = () => {
    this.read(
      this.state.fse.id,
      result => {
        if (this.state.fse.code === "#FSE") {
          let actes = _.filter(
            _.get(result, "contentJO.actes", []),
            a => !_.isEmpty(a.code)
          );
          _.forEach(actes, acte => {
            this.createActe(acte, result.id, result.idPatient);
          });
        }
        this.update(
          result.id,
          {
            etat: 0,
            doneAt: new Date().toISOString(),
            description: this.state.acteTitre
          },
          res => {
            this.setState({
              msgSaveFSE: `L'acte ${
                this.state.typeActe
              } a été bien enregistré !`,
              fse: {},
              acteTitre: "",
              modalChangeActeTitre: false
            });
            this.onPatientChange(this.props.idPatient, this.state.typeActe, {});
          },
          err => {
            this.setState({
              msgSaveFSE: "Erreur de sauvegarde de la FSE !",
              acteTitre: "",
              modalChangeActeTitre: false
            });
          }
        );
      },
      error => {
        this.setState({
          msgSaveFSE: `Erreur de sauvegarde de l'acte ${
            this.state.typeActe
          }! Lecture de cette acte impossible`,
          acteTitre: "",
          modalChangeActeTitre: false
        });
      }
    );
  };

  destroy = () => {
    this.props.client.Actes.destroy(
      this.state.fse.id,
      result => {
        this.setState({ fse: {} });
        this.onPatientChange(this.props.idPatient, this.state.typeActe, {});
      },
      error => {
        console.log(error);
      }
    );
  };

  onError = () => {
    this.setState({ fse: {} });
  };

  handleChangeType = (type, acteToAdd) => {
    this.setState({ typeActe: type });
    this.onPatientChange(this.props.idPatient, type, acteToAdd);
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
              <Menu pointing={true} secondary={true}>
                <Menu.Item
                  name="FSE"
                  active={this.state.typeActe === "#FSE"}
                  onClick={() => {
                    if (this.state.typeActe !== "#FSE") {
                      this.handleChangeType("#FSE", {});
                    }
                  }}
                />
                <Menu.Item
                  name="PROJET"
                  active={this.state.typeActe === "#DEVIS"}
                  onClick={() => {
                    if (this.state.typeActe !== "#DEVIS") {
                      this.handleChangeType("#DEVIS", {});
                    }
                  }}
                />
              </Menu>

              <Header as="h3">{this.state.fse.description}</Header>
              <div
                style={{
                  height: "500px",
                  overflow: "auto",
                  marginBottom: "15px",
                  marginTop: "10px"
                }}
              >
                <Actes.Saisie
                  client={this.props.client}
                  idActe={this.state.fse.id}
                  editable={this.state.editable}
                  onError={this.onError} // à voir - TODO
                  lignes={20}
                  //codGrille
                  //executant
                  //specialite
                  acteToAdd={this.state.acteToAdd}
                  addToFSE={acte => {
                    this.handleChangeType("#FSE", acte);
                  }}
                />
              </div>
              <span>
                <Button
                  disabled={!this.state.editable}
                  content="Valider"
                  onClick={() => {
                    if (this.state.fse.code === "#FSE") {
                      this.save();
                    }
                    if (this.state.fse.code === "#DEVIS") {
                      this.setState({
                        acteTitre: this.state.fse.description,
                        modalChangeActeTitre: true
                      });
                    }
                  }}
                />
                <Button
                  disabled={!this.state.editable}
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
            <Modal.Header>Résultat de la validation</Modal.Header>
            <Modal.Content>
              <Message>{this.state.msgSaveFSE}</Message>
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="OK"
                onClick={() => this.setState({ msgSaveFSE: "" })}
              />
            </Modal.Actions>
          </Modal>

          {/* Titre de l'acte */}
          <Modal size="mini" open={this.state.modalChangeActeTitre}>
            <Modal.Header>
              {this.state.fse.code === "#DEVIS" ? "Titre du projet" : "Titre"}
            </Modal.Header>
            <Modal.Content>
              <Input
                placeholder="Titre"
                fluid={true}
                value={this.state.acteTitre}
                onChange={(e, d) => this.setState({ acteTitre: d.value })}
              />
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="OK"
                onClick={() => {
                  if (!_.isEmpty(this.state.acteTitre)) {
                    this.save();
                  }
                }}
              />
            </Modal.Actions>
          </Modal>
        </React.Fragment>
      );
  }
}
