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
  Message,
  Modal,
  Ref,
  Segment
} from "semantic-ui-react";

import { telFormat, rdvDateTime } from "./Settings";

/*
  reload avec des paramètres

  Forcer le reload à charger les SMS avec les bonnes valeurs "fromStr" et "toStr"
  sinon, il arrive que le reload charge avec les valeurs du state qui ne sont pas
  à jour !
*/

export default class SmsHistory extends React.Component {
  tri = [
    { text: "Tri par date", value: "date" },
    { text: "Tri par téléphone", value: "tel" }
  ];

  componentWillMount() {
    this.setState({
      loading: true,
      mois: moment().month(),
      currentYear: moment().year(),
      years: this.years(3), // select année
      allMonths: this.allMonths(), // select mois (les mois sont indicés à partir de 0)
      messages: [],
      sortBy: "date",
      openedMessage: -1
    });
  }

  componentWillReceiveProps(next) {
    if (next.sms) {
      // charger uniquement les SMS du mois en cours
      let fromStr = this.formatYearMonth(
        this.state.currentYear,
        this.state.mois + 1
      );
      let toStr = this.formatYearMonth(
        this.state.currentYear,
        this.state.mois + 2
      );
      this.reload(fromStr, toStr, this.state.sortBy);
    }
  }

  reload = (fromStr, toStr, sortBy) => {
    //console.log(fromStr + " - " + toStr);
    this.props.client.Sms.readAll(
      { from: fromStr, to: toStr },
      datas => {
        //console.log(datas);
        let msg = datas.results;
        // tri par date du plus récent au plus ancien
        if (sortBy === "date") {
          msg.sort((msg1, msg2) => {
            if (msg1.creationDatetime > msg2.creationDatetime) {
              return -1;
            } else if (msg1.creationDatetime < msg2.creationDatetime) {
              return 1;
            } else {
              return 0;
            }
          });
        } else {
          // tri par téléphone
          msg.sort((msg1, msg2) => {
            if (msg1.receiver < msg2.receiver) {
              return -1;
            } else if (msg1.receiver > msg2.receiver) {
              return 1;
            } else {
              return 0;
            }
          });
        }

        this.setState({
          loading: false,
          messages: msg,
          openedMessage: -1
        });
      },
      errors => {
        console.log(errors);
      }
    );
  };

  formatYearMonth = (year, month) => {
    let format = "";
    if (month < 10) {
      format = year + "-0" + month;
    } else {
      format = year + "-" + month;
    }
    return format;
  };

  allMonths = () => {
    let date = moment();
    let tabMonths = [];
    for (let i = 0; i < date._locale._months.length; i++) {
      let m = {};
      m.text = date._locale._months[i];
      // ou
      // m.text = date._locale.monthsShort[i]; // pour un format plus court
      m.value = i;
      tabMonths.push(m);
    }
    return tabMonths;
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

  handleChangeDropdown = (e, d) => {
    if (d.name === "mois") {
      if (d.value !== this.state.mois) {
        let fromStr = this.formatYearMonth(this.state.currentYear, d.value + 1);
        let toStr = "";
        if (d.value < 11) {
          toStr = this.formatYearMonth(this.state.currentYear, d.value + 2);
        } else {
          // janvier de l'année suivante
          toStr = this.formatYearMonth(this.state.currentYear + 1, 1);
        }
        //console.log(argFrom);
        this.setState({ loading: true, mois: d.value });
        this.reload(fromStr, toStr, this.state.sortBy);
      } else {
        return;
      }
    }

    if (d.name === "annee") {
      if (d.value !== this.state.currentYear) {
        let fromStr = this.formatYearMonth(d.value, this.state.mois + 1);
        let toStr = this.formatYearMonth(d.value, this.state.mois + 2);
        this.setState({ loading: true, currentYear: d.value });
        this.reload(fromStr, toStr, this.state.sortBy);
      } else {
        return;
      }
    }

    if (d.name === "tri") {
      if (d.value !== this.state.sortBy) {
        let fromStr = this.formatYearMonth(
          this.state.currentYear,
          this.state.mois + 1
        );
        let toStr = this.formatYearMonth(
          this.state.currentYear,
          this.state.mois + 2
        );
        this.setState({ loading: true, sortBy: d.value });
        this.reload(fromStr, toStr, d.value);
      } else {
        return;
      }
    }
  };

  openMessage = (e, d) => {
    this.setState({
      openedMessage: d.index
    });
  };

  render() {
    //console.log(this.state.mois);
    let nbSMS = 0;
    if (_.isEmpty(this.state.messages)) {
      nbSMS = 0;
    } else {
      for (let i = 0; i < this.state.messages.length; i++) {
        nbSMS += this.state.messages[i].numberOfSms;
      }
    }

    return (
      <React.Fragment>
        <Modal size="small" open={this.props.sms}>
          <Modal.Header>
            Historique SMS &nbsp;&nbsp;
            {this.state.loading
              ? ""
              : "( " +
                this.state.messages.length +
                " messages - " +
                nbSMS +
                " SMS )"}
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
                      <Form.Dropdown
                        placeholder="Mois"
                        name="mois"
                        selection={true}
                        multiple={false}
                        options={this.state.allMonths}
                        value={this.state.mois}
                        onChange={(e, d) => this.handleChangeDropdown(e, d)}
                      />
                      <Form.Dropdown
                        placeholder="Année"
                        name="annee"
                        selection={true}
                        multiple={false}
                        options={this.state.years}
                        value={this.state.currentYear}
                        onChange={(e, d) => this.handleChangeDropdown(e, d)}
                      />
                      <Form.Dropdown
                        name="tri"
                        selection={true}
                        multiple={false}
                        options={this.tri}
                        value={this.state.sortBy}
                        onChange={(e, d) => this.handleChangeDropdown(e, d)}
                      />
                    </Form.Group>
                  </Form>
                </div>
                <Divider />
                {_.isEmpty(this.state.messages) ? (
                  <Message icon={true}>
                    <Icon name="envelope" />
                    <Message.Content>
                      <Message.Header>Aucun SMS trouvé !</Message.Header>
                      <p>
                        Vous n'avez envoyé aucune confirmation SMS en &nbsp;
                        {this.state.allMonths[this.state.mois].text +
                          " " +
                          this.state.currentYear}
                      </p>
                    </Message.Content>
                  </Message>
                ) : (
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
                                  <p
                                    style={{ fontSize: "12px", color: "grey" }}
                                  >
                                    Envoyé le{" "}
                                    {moment(message.creationDatetime).format(
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
                          <div
                            style={{ textAlign: "center", paddingTop: "20%" }}
                          >
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
                                  style={{ cursor: "pointer" }}
                                  name="window close"
                                  color="grey"
                                  size="large"
                                  onClick={() =>
                                    this.setState({ openedMessage: -1 })
                                  }
                                />
                              </div>
                              <span>
                                <strong>
                                  {telFormat(
                                    this.state.messages[
                                      this.state.openedMessage
                                    ].receiver
                                  )}
                                </strong>
                              </span>
                              <br />
                              <span>
                                Envoyé{" "}
                                {_.upperFirst(
                                  rdvDateTime(
                                    this.state.messages[
                                      this.state.openedMessage
                                    ].creationDatetime
                                  )
                                )}
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
                              <br />
                              <span>
                                <strong>
                                  {
                                    this.state.messages[
                                      this.state.openedMessage
                                    ].messageLength
                                  }
                                </strong>
                                &nbsp;caractères&nbsp;-&nbsp;
                                <strong>
                                  {
                                    this.state.messages[
                                      this.state.openedMessage
                                    ].numberOfSms
                                  }
                                </strong>
                                &nbsp;SMS
                              </span>
                              <Divider />
                              <span>Contenu du message : </span>
                              <Divider hidden={true} />
                              <div
                                style={{ overflowY: "scroll", height: "140px" }}
                              >
                                <p style={{ paddingRight: "15%" }}>
                                  {
                                    this.state.messages[
                                      this.state.openedMessage
                                    ].message
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                )}
              </div>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.props.sms) {
                  node.firstChild.parentElement.focus();
                }
              }}
            >
              <Button
                primary={true}
                content="Fermer"
                onClick={() => this.props.smsHistoryOpen(false)}
              />
            </Ref>
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
