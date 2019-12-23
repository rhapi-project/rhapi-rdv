import React from "react";

import { Button, Checkbox, Message, Modal, Progress } from "semantic-ui-react";

import moment from "moment";
import _ from "lodash";

export default class UpdateRappels extends React.Component {
  state = {
    update: false,
    checkAutorisationSMS: true,
    totalRDV: 0,
    modifiedRDV: 0,
    traitedRDV: 0
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.open !== this.props.open) {
      this.setState({
        checkAutorisationSMS: true,
        update: false,
        totalRDV: 0,
        modifiedRDV: 0,
        traitedRDV: 0
      });
    }
  }

  update = () => {
    let now = moment();
    this.props.client.RendezVous.actualiser(
      {
        planning: this.props.planningId,
        from: now.toISOString(true),
        to: now.add(3, "years").toISOString(true)
      },
      result => {
        this.setState({ totalRDV: result.results.length });
        let updateFunc = arrayRDV => {
          let rdv = arrayRDV.shift();
          if (_.isUndefined(rdv)) {
            return;
          }
          this.props.client.Patients.read(
            rdv.idPatient,
            {},
            res => {
              if (!_.isEmpty(res.telMobile)) {
                let smsIsAllowed =
                  res.gestionRdvJO.autoriseSMS ||
                  !this.state.checkAutorisationSMS;
                if (smsIsAllowed) {
                  let rappelsJO = rdv.rappelsJO;
                  let sms = rappelsJO.sms;
                  sms.rappel1 = !this.props.rappels.rappel1
                    ? false
                    : this.props.rappels.rappel1;
                  sms.rappel24 = !this.props.rappels.rappel24
                    ? false
                    : this.props.rappels.rappel24;
                  sms.rappel48 = !this.props.rappels.rappel48
                    ? false
                    : this.props.rappels.rappel48;
                  sms.rappel72 = !this.props.rappels.rappel72
                    ? false
                    : this.props.rappels.rappel72;
                  rappelsJO.sms = sms;

                  // mise à jour du RDV
                  this.props.client.RendezVous.update(
                    rdv.id,
                    { rappelsJO: rappelsJO },
                    result => {
                      this.setState({
                        modifiedRDV: this.state.modifiedRDV + 1,
                        traitedRDV: this.state.traitedRDV + 1
                      });
                      updateFunc(arrayRDV);
                    },
                    error => {
                      console.log(error);
                      this.setState({ traitedRDV: this.state.traitedRDV + 1 });
                      updateFunc(arrayRDV);
                    }
                  );
                } else {
                  // smsIsAllowed === false
                  this.setState({ traitedRDV: this.state.traitedRDV + 1 });
                  updateFunc(arrayRDV);
                }
              } else {
                this.setState({ traitedRDV: this.state.traitedRDV + 1 });
                updateFunc(arrayRDV);
              }
            },
            error => {
              this.setState({ traitedRDV: this.state.traitedRDV + 1 });
              updateFunc(arrayRDV);
            }
          );
        };

        updateFunc(result.results);
      },
      error => {
        console.log(error);
      }
    );
  };

  render() {
    let finished =
      this.state.totalRDV === 0 ||
      this.state.totalRDV === this.state.modifiedRDV ||
      this.state.traitedRDV === this.state.totalRDV;

    return (
      <Modal open={this.props.open} size="small">
        <Modal.Header>
          {!this.state.update
            ? "Appliquer les modifications aux RDV déjà existants"
            : "Mise à jour des RDV à venir"}
        </Modal.Header>
        <Modal.Content>
          {!this.state.update ? (
            <React.Fragment>
              <Message>
                <Message.Header>Confirmation</Message.Header>
                <Message.Content>
                  Voulez-vous appliquer les modifications apportées aux rappels
                  SMS aux RDV futurs déjà enregistrés ?
                </Message.Content>
              </Message>
              <Checkbox
                label="Vérifier que le patient autorise les SMS"
                checked={this.state.checkAutorisationSMS}
                onChange={() =>
                  this.setState({
                    checkAutorisationSMS: !this.state.checkAutorisationSMS
                  })
                }
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              {this.state.totalRDV === 0 ? (
                "Aucun rendez-vous à venir."
              ) : (
                <React.Fragment>
                  <Message info={finished}>
                    <Message.Content>
                      {finished
                        ? "Mise à jour des rappels de rendez-vous terminée."
                        : "Mise à jour des rappels de rendez-vous en cours..."}
                    </Message.Content>
                  </Message>
                  <Progress
                    active={finished ? false : true}
                    color="blue"
                    size="small"
                    total={this.state.totalRDV}
                    value={this.state.traitedRDV}
                  >
                    {this.state.modifiedRDV +
                      " / " +
                      this.state.totalRDV +
                      " rendez-vous mis à jour..."}
                  </Progress>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </Modal.Content>
        <Modal.Actions>
          {!this.state.update ? (
            <React.Fragment>
              <Button content="Annuler" onClick={() => this.props.onClose()} />
              <Button
                primary={true}
                content="Oui"
                onClick={() => {
                  this.update();
                  this.setState({ update: true });
                }}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button
                content={finished ? "OK" : "Annuler"}
                primary={finished}
                onClick={() => {
                  this.props.onClose();
                }}
              />
            </React.Fragment>
          )}
        </Modal.Actions>
      </Modal>
    );
  }
}
