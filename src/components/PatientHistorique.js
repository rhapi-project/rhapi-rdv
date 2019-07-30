import React from "react";
import { Actes } from "rhapi-ui-react";
import { Button, Checkbox, Divider, Form, Modal } from "semantic-ui-react";

import _ from "lodash";

export default class PatientHistorique extends React.Component {
  componentWillMount() {
    this.setState({
      //idPatient: 0
      acteEdition: null,
      actionEdition: null
    });
  }

  /*onPatientChange = id => {
    this.setState({ idPatient: id });
  };*/

  onActeClick = id => {
    // l'id de l'acte en paramètre
    //console.log(`onActeClick ${id}`);
  };

  onActeDoubleClick = id => {
    // l'id de l'acte en paramètre
    //console.log(`onActeDoubleClick ${id}`);
  };

  onSelectionChange = ids => {
    // array des id des actes en paramètre
    let actes = ids.join(",");
    console.log(`onSelectionChange ${actes}`);
  };

  onActionTest1 = id => {
    // l'id de l'acte en paramètre
    console.log(`onActionTest1 ${id}`);
  };

  onActionTest2 = id => {
    // l'id de l'acte en paramètre
    console.log(`onActionTest2 ${id}`);
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
        <React.Fragment>
          <Divider hidden={true} />
          <div style={{ height: "500px", overflow: "auto" }}>
            <Actes.Historique
              client={this.props.client}
              idPatient={this.props.idPatient}
              onActeClick={this.onActeClick}
              onActeDoubleClick={this.onActeDoubleClick}
              onEditActeClick={idActe => this.setState({ acteEdition: idActe })}
              onSelectionChange={this.onSelectionChange}
              limit={20}
              actions={[
                // Ces actions seront ajoutées aux actions par défaut (Supprimer, Éditer)
                {
                  action: this.onActionTest1,
                  text: "Action de test 1",
                  icon: "code"
                },
                {
                  action: this.onActionTest2,
                  text: "Action de test 2",
                  icon: "code"
                }
              ]}
            />
          </div>

          {/* Choix à faire Rééditer ou Reprendre comme nouveau */}
          <Modal size="tiny" open={!_.isNull(this.state.acteEdition)}>
            <Modal.Header>Edition d'un acte</Modal.Header>
            <Modal.Content>
              <p>
                Vous pouvez <strong>rééditer</strong> cet acte ou bien le{" "}
                <strong>reprendre comme étant un nouveau</strong>.
              </p>
              <Form>
                <Form.Field>
                  <Checkbox
                    label="Rééditer"
                    value={1}
                    checked={this.state.actionEdition === 1}
                    onChange={(e, d) =>
                      this.setState({
                        actionEdition:
                          d.value === this.state.actionEdition ? null : d.value
                      })
                    }
                    toggle={true}
                  />
                </Form.Field>
                <Form.Field>
                  <Checkbox
                    label="Reprendre comme nouveau"
                    value={2}
                    checked={this.state.actionEdition === 2}
                    onChange={(e, d) =>
                      this.setState({
                        actionEdition:
                          d.value === this.state.actionEdition ? null : d.value
                      })
                    }
                    toggle={true}
                  />
                </Form.Field>
              </Form>
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="Annuler"
                onClick={() =>
                  this.setState({ acteEdition: null, actionEdition: null })
                }
              />
              <Button
                primary={!_.isNull(this.state.actionEdition)}
                content="Valider"
                onClick={() => {
                  if (this.state.actionEdition === 1) {
                    this.props.onReedition(this.state.acteEdition);
                  }
                  if (this.state.actionEdition === 2) {
                    this.props.onCopy(this.state.acteEdition);
                  }
                }}
              />
            </Modal.Actions>
          </Modal>
        </React.Fragment>
      );
  }
}
