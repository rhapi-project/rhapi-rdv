import React from "react";

import moment from "moment";

import _ from "lodash";

import {
  Button,
  Dimmer,
  Divider,
  Form,
  Grid,
  Icon,
  Loader,
  Menu,
  Modal,
  Segment
} from "semantic-ui-react";

import { telFormat } from "./Settings";

// TODO : placer le bouton d'impression

export default class SmsHistory extends React.Component {
  state = {
    loading: true,
    mois: moment().month() - 1, // le mois précédent par défaut
    years: [], // select année
    currentYear: moment().year(), // année en cours
    messages: [],
    openedMessage: -1 // index du message ouvert
  };

  // les mois sont indicés à partir de 0
  mois = [
    { text: "Janvier", value: 0 },
    { text: "Février", value: 1 },
    { text: "Mars", value: 2 },
    { text: "Avril", value: 3 },
    { text: "Mai", value: 4 },
    { text: "Juin", value: 5 },
    { text: "Juillet", value: 6 },
    { text: "Août", value: 7 },
    { text: "Septembre", value: 8 },
    { text: "Octobre", value: 9 },
    { text: "Novembre", value: 10 },
    { text: "Décembre", value: 11 }
  ];

  componentWillReceiveProps(next) {
    if (next.sms) {
      let argFrom = this.state.mois + 1 + "-" + this.state.currentYear;
      this.reload(argFrom);
    }
  }

  reload = argFrom => {
    // argForm sera de la forme : "mois-année" ex: 11-2017

    // TODO : à vérifier si "argFrom" est bien au bon format

    //console.log(argFrom);
    this.props.client.Sms.readAll(
      { from: argFrom },
      datas => {
        // Prévoir un loader car ça peut être très long...
        // https://react.semantic-ui.com/elements/loader
        //console.log(datas);
        this.setState({
          loading: false,
          messages: datas.results,
          years: this.years(3),
          openedMessage: -1
        });
      },
      errors => {
        console.log(errors);
      }
    );
  };

  years = number => {
    let currentYear = moment().year();
    let yearObj = { text: currentYear.toString(), value: currentYear };
    let years = [yearObj];
    for (let i = 0; i < number - 1; i++) {
      currentYear -= 1;
      yearObj = { text: currentYear.toString(), value: currentYear };
      years.push(yearObj);
    }
    return years;
  };

  monthChange = (e, d) => {
    if (d.value !== this.state.mois) {
      let argFrom = d.value + 1 + "-" + this.state.currentYear;
      //console.log(argFrom);
      this.setState({ loading: true, mois: d.value });
      this.reload(argFrom);
    } else {
      return;
    }
  };

  yearChange = (e, d) => {
    if (d.value !== this.state.currentYear) {
      let argFrom = this.state.mois + 1 + "-" + d.value;
      this.setState({ loading: true, currentYear: d.value });
      this.reload(argFrom);
    } else {
      return;
    }
  };

  openMessage = (e, d) => {
    this.setState({
      openedMessage: d.index
    });
  };

  render() {
    //console.log(this.state.messages);
    return (
      <React.Fragment>
        <Modal size="small" open={this.props.sms}>
          <Modal.Header>
            Historique SMS &nbsp;&nbsp;
            {this.state.loading
              ? ""
              : "( " + this.state.messages.length + " messages )"}
          </Modal.Header>
          <Modal.Content>
            {this.state.loading ? (
              <Segment basic={true}>
                <Dimmer active={true} inverted={true}>
                  <Loader size="large">Chargement...</Loader>
                </Dimmer>
              </Segment>
            ) : (
              <div>
                <div>
                  <Form>
                    <Form.Group inline={true}>
                      <label>A partir de : </label>
                      <Form.Dropdown
                        placeholder="Mois"
                        selection={true}
                        multiple={false}
                        options={this.mois}
                        value={this.state.mois}
                        onChange={(e, d) => this.monthChange(e, d)}
                      />
                      <Form.Dropdown
                        placeholder="Année"
                        selection={true}
                        multiple={false}
                        options={this.state.years}
                        value={this.state.currentYear}
                        onChange={(e, d) => this.yearChange(e, d)}
                      />
                    </Form.Group>
                  </Form>
                </div>
                <Divider />
                <Grid>
                  <Grid.Row divided={true}>
                    <Grid.Column width={6}>
                      <div style={{ overflowY: "scroll", height: "300px" }}>
                        <Menu fluid={true} secondary={true} vertical={true}>
                          {_.map(this.state.messages, (message, i) => {
                            return (
                              <Menu.Item
                                index={i}
                                key={i}
                                active={i === this.state.openedMessage}
                                onClick={(e, d) => this.openMessage(e, d)}
                              >
                                <Menu.Header as="h3">
                                  {telFormat(message.receiver)}
                                  &nbsp;&nbsp;&nbsp;&nbsp;
                                  {message.deliveryReceipt === 1 ? (
                                    <Icon name="checkmark" color="green" />
                                  ) : (
                                    <Icon name="close" color="red" />
                                  )}
                                </Menu.Header>
                                <p style={{ fontSize: "12px", color: "grey" }}>
                                  Envoyé le{" "}
                                  {moment(message.creationDateTime).format(
                                    "DD/MM/YYYY"
                                  )}
                                </p>
                              </Menu.Item>
                            );
                          })}
                        </Menu>
                      </div>
                    </Grid.Column>
                    <Grid.Column width={10}>
                      {this.state.openedMessage === -1 ? (
                        <div style={{ textAlign: "center", paddingTop: "20%" }}>
                          <Icon name="envelope" size="massive" />
                          <p style={{ fontSize: "18px" }}>
                            Sélectionner un message pour le lire
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div>
                            <div style={{ float: "right" }}>
                              <Icon
                                name="window close"
                                color="red"
                                size="large"
                                onClick={() =>
                                  this.setState({ openedMessage: -1 })
                                }
                              />
                            </div>
                            <span>
                              <strong>
                                {telFormat(
                                  this.state.messages[this.state.openedMessage]
                                    .receiver
                                )}
                              </strong>
                            </span>
                            <br />
                            <span>
                              Date d'envoi :{" "}
                              {moment(
                                this.state.messages[this.state.openedMessage]
                                  .creationDateTime
                              ).format("DD/MM/YYYY")}
                            </span>
                            <br />
                            <span>
                              Statut &nbsp;&nbsp;
                              {this.state.messages[this.state.openedMessage]
                                .deliveryReceipt === 1 ? (
                                <Icon name="circle" color="green" />
                              ) : (
                                <Icon name="circle" color="red" />
                              )}
                            </span>
                            <Divider />
                            <span>Contenu du message : </span>
                            <Divider hidden={true} />
                            <div
                              style={{ overflowY: "scroll", height: "150px" }}
                            >
                              <p style={{ paddingRight: "15%" }}>
                                {
                                  this.state.messages[this.state.openedMessage]
                                    .message
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </div>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button
              content="Fermer"
              onClick={() => this.props.smsHistoryOpen(false)}
            />
          </Modal.Actions>
        </Modal>
        <Button
          content="Historique SMS"
          onClick={() => this.props.smsHistoryOpen(true)}
        />
      </React.Fragment>
    );
  }
}
