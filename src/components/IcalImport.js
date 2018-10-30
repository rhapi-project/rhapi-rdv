import React from "react";

import _ from "lodash";

import {
  Button,
  Checkbox,
  Divider,
  Form,
  Icon,
  Message,
  Modal,
  Ref
} from "semantic-ui-react";

export default class IcalImport extends React.Component {
  state = {
    open: false,
    planningId: -1, // aucun planning
    planningTitre: "",
    plannings: [], // tous les plannings
    selectPlannings: false,
    selectedPlannings: [], // id plannings
    clearRdv: true, //
    finChargement: false
  };

  componentWillReceiveProps(next) {
    this.setState({
      open: next.open,
      planningId: next.planningId,
      planningTitre: next.planningTitre,
      plannings: next.plannings,
      selectedPlannings: this.initSelectedPlannings() // une valeur au début
    });
  }

  // le planning courant est sélectionné par défaut
  initSelectedPlannings = () => {
    let selPl = this.state.selectedPlannings;
    if (
      this.state.planningId !== -1 &&
      !_.includes(this.state.plannings, this.state.planningId) &&
      _.isEmpty(selPl)
    ) {
      selPl.push(this.state.planningId);
    }
    return selPl;
  };

  addRemovePlanning = planningId => {
    let selPl = this.state.selectedPlannings;
    if (_.includes(selPl, planningId)) {
      // remove planningId
      let newArray = [];
      _.forEach(selPl, id => {
        if (id !== planningId) {
          newArray.push(id);
        }
      });
      selPl = newArray;
    } else {
      selPl.push(planningId);
    }
    this.setState({ selectedPlannings: selPl });
  };

  close = () => {
    this.props.modalIcalImportOpen(false);
  };

  clearRdvChange = () => {
    // changer l'état de la checkbox de suppression de tous les rdv sur le planning courant
    this.setState({
      clearRdv: !this.state.clearRdv
    });
  };

  requestParameters = () => {
    let param = "";
    let selectedPlannings = this.state.selectedPlannings;
    for (let i = 0; i < selectedPlannings.length; i++) {
      if (i === selectedPlannings.length - 1) {
        param = param + "" + selectedPlannings[i];
      } else {
        param = param + "" + selectedPlannings[i] + "-";
      }
    }
    if (this.state.clearRdv) {
      param += "-clear";
    }
    return param;
  };

  import = () => {
    let form = document.getElementById("import-form");
    form.action =
      this.props.client.baseUrl +
      "/Plannings/" +
      this.requestParameters() +
      "/importIcal";

    let inputFile = document.createElement("input");
    inputFile.id = "import-form";
    inputFile.name = "ical";
    inputFile.type = "file";
    inputFile.accept = "text/calendar";
    form.appendChild(inputFile);

    let inputToken = document.createElement("input");
    inputToken.id = "import-form-token";
    inputToken.type = "hidden";

    document.body.appendChild(form); // pour ne pas afficher l'input dans la modal...

    inputFile.click();

    inputFile.onchange = () => {
      if (_.isEmpty(inputFile.files)) {
        return;
      } else {
        inputToken.value = this.props.client.token;
        form.appendChild(inputToken);
        form.submit();
      }
      document.body.removeChild(form);
    };
  };

  onLoad = () => {
    // fin du chargement
    this.setState({ finChargement: true });
  };

  render() {
    //console.log(this.requestParameters());
    return (
      <React.Fragment>
        <Modal size="small" open={this.state.open}>
          <Modal.Header>Import des rendez-vous</Modal.Header>
          <Modal.Content>
            <p>
              <strong>Pour importer des rendez-vous</strong> à partir d'un
              fichier au format <strong>iCalendar</strong>, cliquer sur le
              bouton{" "}
              <strong>
                <i>Importer</i>
              </strong>{" "}
              puis sélectionner un fichier de rendez-vous.
              <br />
              Par défaut, les rendez-vous seront importés sur{" "}
              <strong>{this.state.planningTitre}</strong> et ceux déjà existants
              sur ce planning seront supprimés.
            </p>

            <Form>
              <Form.Input
                label={
                  <label>
                    Tous les rendez-vous existants sur les plannings
                    sélectionnés seront supprimés !
                  </label>
                }
              >
                <Checkbox
                  toggle={true}
                  checked={this.state.clearRdv}
                  onChange={(e, d) => this.clearRdvChange()}
                />
              </Form.Input>

              {_.size(this.state.plannings) !== 1 &&
              !_.isEmpty(this.state.plannings) ? (
                <Form.Input label="Importer les rendez-vous sur d'autres plannings.">
                  <Checkbox
                    toggle={true}
                    checked={this.state.selectPlannings}
                    onChange={() =>
                      this.setState({
                        selectPlannings: !this.state.selectPlannings
                      })
                    }
                  />
                </Form.Input>
              ) : (
                ""
              )}
            </Form>

            {/* Sélection d'autres plannings */}
            {this.state.selectPlannings ? (
              <div>
                <Divider />
                <Form>
                  {_.map(this.state.plannings, planning => (
                    <Form.Input key={planning.id}>
                      <Checkbox
                        toggle={true}
                        label={<label>{planning.titre}</label>}
                        checked={_.includes(
                          this.state.selectedPlannings,
                          planning.id
                        )}
                        onChange={() => this.addRemovePlanning(planning.id)}
                      />
                    </Form.Input>
                  ))}
                </Form>
              </div>
            ) : (
              ""
            )}

            {/* Import au format iCalendar (*.ics) => à placer dans une modal */}
            <iframe // iframe masquée comme cible du formulaire
              name="import-form-frame"
              title="import-form-frame"
              onLoad={this.onLoad}
              style={{ display: "none" }}
            />

            <Form
              id="import-form"
              target="import-form-frame"
              method="post"
              encType="multipart/form-data"
            />
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.state.open) {
                  node.focus();
                }
              }}
            >
              <Button content="Annuler" primary={true} onClick={this.close} />
            </Ref>
            <Button content="Importer" onClick={this.import} />
          </Modal.Actions>
        </Modal>
        {/* Fin du chargement */}
        <Modal size="small" open={this.state.finChargement}>
          <Modal.Header>Chargement du fichier terminé</Modal.Header>
          <Modal.Content>
            <Message icon={true} positive={true}>
              <Icon name="check" />
              <Message.Content>
                <Message.Header>
                  Tous les rendez-vous ont été chargés
                </Message.Header>
                <p>
                  {/* à remplir : nb de rdv supprimés, nombre de rdv ajoutés et total des rdv */}
                </p>
              </Message.Content>
            </Message>
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.state.finChargement) {
                  node.focus();
                }
              }}
            >
              <Button
                content="OK"
                primary={true}
                onClick={() => {
                  this.setState({ finChargement: false });
                  this.close();
                }}
              />
            </Ref>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
