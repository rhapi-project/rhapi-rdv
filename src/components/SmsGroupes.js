import React from "react";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Header,
  Icon,
  List,
  Message,
  Modal,
  Segment
} from "semantic-ui-react";
import _ from "lodash";
import PatientSearchModal from "./PatientSearchModal";
import SmsPeriodeSelection from "./SmsPeriodeSelection";
import { smsCounter } from "../lib/Helpers";

export default class SmsGroupes extends React.Component {
  state = {
    loading: false,
    smsContent: "",
    momentFrom: null,
    momentTo: null,
    selectableNumeros: [],
    selectedNumeros: [],
    modalAddNumero: false,
    modalPatientSearch: false,
    modalResultat: false,
    sendResultat: null
  };

  componentDidUpdate(prevProps) {
    if (this.props.open && this.props.open !== prevProps.open) {
      this.setState({
        smsContent: "",
        momentFrom: null,
        momentTo: null,
        selectableNumeros: [],
        selectedNumeros: []
      });
    }
  }

  patientRead = (idPatient, onSuccess, onError) => {
    this.props.client.Patients.read(
      idPatient,
      {},
      patient => onSuccess(patient),
      error => onError(error)
    );
  };

  reloadPatients = (momentFrom, momentTo) => {
    if (!momentFrom || !momentTo) {
      return;
    }
    this.setState({
      loading: true,
      selectableNumeros: [],
      selectedNumeros: []
    });
    this.props.client.RendezVous.actualiser(
      {
        planning: this.props.idPlanning,
        from: momentFrom.toISOString(true),
        to: momentTo.toISOString(true)
      },
      result => {
        let readPatients = arrayRdv => {
          if (_.isEmpty(arrayRdv)) {
            this.setState({ loading: false });
          } else {
            this.props.client.Patients.read(
              arrayRdv.shift().idPatient,
              {},
              patient => {
                if (!_.isEmpty(patient.telMobile)) {
                  let sn = this.state.selectableNumeros;
                  let obj = {
                    nom: patient.nom,
                    prenom: patient.prenom,
                    telMobile: patient.telMobile
                  };
                  if (!this.existsInSelectables(sn, obj)) {
                    sn.push(obj);
                    let selNum = this.state.selectedNumeros;
                    selNum.push(obj);
                    this.setState({
                      selectableNumeros: sn,
                      selectedNumeros: selNum
                    });
                  }
                }
                readPatients(arrayRdv);
              },
              () => {
                readPatients(arrayRdv);
              }
            );
          }
        };
        readPatients(result.results);
      },
      error => {
        console.log(error);
      }
    );
  };

  findIndexSelectable = (arraySelectables, selectableObj) => {
    return _.findIndex(arraySelectables, selObj => {
      return (
        selectableObj.nom === selObj.nom &&
        selectableObj.prenom === selObj.prenom &&
        selectableObj.telMobile === selObj.telMobile
      );
    });
  };

  existsInSelectables = (arraySelectables, obj) => {
    return this.findIndexSelectable(arraySelectables, obj) !== -1;
  };

  allSelected = () => {
    let selectedNumeros = this.state.selectedNumeros;
    let allSelected = true;
    let checkSelected = arraySelectables => {
      if (_.isEmpty(arraySelectables)) {
        return;
      } else {
        if (
          !this.existsInSelectables(selectedNumeros, arraySelectables.shift())
        ) {
          allSelected = false;
          return;
        }
        checkSelected(arraySelectables);
      }
    };
    checkSelected(_.cloneDeepWith(this.state.selectableNumeros));
    return allSelected;
  };

  sendSms = () => {
    if (
      _.isEmpty(this.state.smsContent) ||
      _.isEmpty(this.state.selectedNumeros)
    ) {
      return;
    }
    let receivers = [];
    _.forEach(this.state.selectedNumeros, selObj => {
      // pas de doublons de numéros
      if (!_.includes(receivers, selObj.telMobile)) {
        receivers.push(selObj.telMobile);
      }
    });
    this.props.client.Sms.create(
      { message: this.state.smsContent, receivers: receivers },
      result => {
        this.setState({
          modalResultat: true,
          sendResultat: {
            type: _.isEmpty(result.ids) ? "ERROR" : "SUCCESS",
            message: _.isEmpty(result.ids)
              ? `Une erreur est survenue lors de l'envoi du SMS. 
                ${
                  !_.isEmpty(result.invalidReceivers)
                    ? "Certains numéros sont invalides."
                    : ""
                }`
              : `SMS envoyé à ${result.ids.length} destinataire(s).`
          }
        });
        //console.log(result);
      },
      error => {
        this.setState({
          modalResultat: true,
          sendResultat: {
            type: "ERROR",
            message:
              "Une erreur est survenue lors de l'envoi du SMS. Veuillez réessayer."
          }
        });
        console.log(error);
      }
    );
  };

  render() {
    return (
      <React.Fragment>
        <Modal open={this.props.open} size="small">
          <Modal.Header>
            Envoi de SMS groupés (Taille: {this.state.smsContent.length}, SMS:{" "}
            {smsCounter(this.state.smsContent)})
          </Modal.Header>
          <Modal.Content>
            <Form>
              <Form.TextArea
                placeholder="Rédiger un message"
                rows={3}
                value={this.state.smsContent}
                onChange={(e, d) => this.setState({ smsContent: d.value })}
              />
            </Form>

            <Divider horizontal={true}>
              <Header as="h5">
                <Icon name="users" />
                Destinataires
              </Header>
            </Divider>

            <SmsPeriodeSelection
              periodeFrom={this.state.momentFrom}
              periodeTo={this.state.momentTo}
              onPeriodeChange={(momentFrom, momentTo) => {
                this.setState({
                  momentFrom: momentFrom,
                  momentTo: momentTo
                });
                this.reloadPatients(momentFrom, momentTo);
              }}
            />

            <Segment
              style={{ height: "200px", overflow: "auto" }}
              loading={this.state.loading}
            >
              {_.isEmpty(this.state.selectableNumeros) ? (
                <div style={{ textAlign: "center" }}>
                  <Header as="h5">Aucun patient</Header>
                </div>
              ) : (
                <List divided={true} relaxed={true}>
                  {_.map(
                    this.state.selectableNumeros,
                    (selectableNum, index) => (
                      <SelectableNumero
                        key={index}
                        nom={selectableNum.nom}
                        prenom={selectableNum.prenom}
                        telMobile={selectableNum.telMobile}
                        selected={this.existsInSelectables(
                          this.state.selectedNumeros,
                          selectableNum
                        )}
                        onSelectionChange={() => {
                          let sn = this.state.selectedNumeros;
                          let i = this.findIndexSelectable(sn, selectableNum);
                          if (i === -1) {
                            sn.push(selectableNum);
                          } else {
                            sn.splice(i, 1);
                          }
                          this.setState({ selectedNumeros: sn });
                        }}
                      />
                    )
                  )}
                </List>
              )}
            </Segment>

            <React.Fragment>
              <span>
                Ajouter un numéro &nbsp;
                <Button
                  circular={true}
                  icon="phone"
                  onClick={() => this.setState({ modalAddNumero: true })}
                />
              </span>
              &nbsp;&nbsp;&nbsp;
              <span>
                Ajouter un patient &nbsp;
                <Button
                  circular={true}
                  icon="add user"
                  onClick={() => this.setState({ modalPatientSearch: true })}
                />
              </span>
              <span style={{ float: "right" }}>
                Sélectionner tout &nbsp;
                <Button
                  circular={true}
                  icon="check"
                  onClick={() => {
                    if (this.allSelected()) {
                      this.setState({ selectedNumeros: [] });
                    } else {
                      let sn = [];
                      _.forEach(this.state.selectableNumeros, selObj => {
                        sn.push(selObj);
                      });
                      this.setState({ selectedNumeros: sn });
                    }
                  }}
                />
              </span>
            </React.Fragment>
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Annuler"
              onClick={() => {
                if (this.props.onClose) {
                  this.props.onClose();
                }
              }}
            />
            <Button
              disabled={
                _.isEmpty(this.state.smsContent) ||
                _.isEmpty(this.state.selectedNumeros)
              }
              primary={true}
              content="Envoyer"
              onClick={this.sendSms}
            />
          </Modal.Actions>
        </Modal>

        {/* recherche élargie d'un patient */}
        <PatientSearchModal
          client={this.props.client}
          open={this.state.modalPatientSearch}
          patientChange={(idPatient, denomination) => {
            this.patientRead(
              idPatient,
              patient => {
                if (!_.isEmpty(patient.telMobile)) {
                  let sn = this.state.selectableNumeros;
                  let obj = {
                    nom: patient.nom,
                    prenom: patient.prenom,
                    telMobile: patient.telMobile
                  };
                  if (!this.existsInSelectables(sn, obj)) {
                    sn.push(obj);
                    let selNum = this.state.selectedNumeros;
                    selNum.push(obj);
                    this.setState({
                      selectableNumeros: sn,
                      selectedNumeros: selNum
                    });
                  }
                }
              },
              error => {
                console.log(error);
              }
            );
          }}
          patientSearchModalOpen={bool => {
            this.setState({ modalPatientSearch: bool });
          }}
        />

        {/* modal d'ajout d'un numéro */}
        <ModalAddNumero
          open={this.state.modalAddNumero}
          onAddNumero={numero => {
            let obj = { nom: "", prenom: "", telMobile: numero };
            let sn = this.state.selectableNumeros;
            if (!this.existsInSelectables(sn, obj)) {
              sn.push(obj);
              let selNum = this.state.selectedNumeros;
              selNum.push(obj);
              this.setState({
                selectableNumeros: sn,
                selectedNumeros: selNum,
                modalAddNumero: false
              });
            }
          }}
          onClose={() => this.setState({ modalAddNumero: false })}
        />

        {/* Modal résultat d'envoi du message */}
        <Modal open={this.state.modalResultat} size="tiny">
          <Modal.Header>Résultat de l'envoi du SMS</Modal.Header>
          <Modal.Content>
            <Message
              info={
                _.isEmpty(this.state.sendResultat)
                  ? false
                  : this.state.sendResultat.type === "SUCCESS"
              }
              negative={
                _.isEmpty(this.state.sendResultat)
                  ? false
                  : this.state.sendResultat.type === "ERROR"
              }
              icon={true}
            >
              {_.isEmpty(this.state.sendResultat) ? null : this.state
                  .sendResultat.type === "SUCCESS" ? (
                <Icon name="send" />
              ) : (
                <Icon name="warning" />
              )}
              <Message.Content>
                <Message.Header>
                  {_.isEmpty(this.state.sendResultat)
                    ? null
                    : this.state.sendResultat.type === "SUCCESS"
                    ? "Message envoyé"
                    : "Erreur"}
                </Message.Header>
                {_.isEmpty(this.state.sendResultat)
                  ? null
                  : this.state.sendResultat.message}
              </Message.Content>
            </Message>
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="OK"
              onClick={() => {
                this.setState({ modalResultat: false, sendResultat: null });
                if (this.props.onClose) {
                  this.props.onClose();
                }
              }}
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

class SelectableNumero extends React.Component {
  render() {
    return (
      <List.Item style={{ position: "relative" }}>
        <div style={{ float: "right" }}>
          <Checkbox
            checked={this.props.selected}
            onChange={this.props.onSelectionChange}
          />
        </div>
        <List.Content>
          {!_.isEmpty(this.props.nom) && !_.isEmpty(this.props.prenom) ? (
            <List.Header>
              {`${this.props.nom} ${this.props.prenom}`}
            </List.Header>
          ) : null}
          <List.Description>{this.props.telMobile}</List.Description>
        </List.Content>
      </List.Item>
    );
  }
}

class ModalAddNumero extends React.Component {
  state = {
    numero: ""
  };

  componentDidUpdate(prevProps) {
    if (this.props.open && this.props.open !== prevProps.open) {
      this.setState({ numero: "" });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Modal open={this.props.open} size="mini">
          <Modal.Header>Ajouter un numéro</Modal.Header>
          <Modal.Content>
            <Form.Input
              placeholder="Numéro de téléphone portable"
              fluid={true}
              value={this.state.numero}
              onChange={(e, d) => this.setState({ numero: d.value })}
            />
          </Modal.Content>
          <Modal.Actions>
            <Button content="Annuler" onClick={this.props.onClose} />
            <Button
              disabled={_.isEmpty(this.state.numero)}
              content="Ajouter"
              onClick={() => {
                // TODO Rajouter une vérification de la validité
                // d'un numéro de téléphone
                this.props.onAddNumero(this.state.numero);
              }}
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
