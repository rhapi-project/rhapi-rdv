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
    selectPlannings: false, // sélectionner d'autres plannings sur lesquels écrire les rdv
    selectedPlannings: [], // les id des plannings sélectionnés
    clearRdv: false, // les rdv préexistants sur les plannings sélectionnés seront supprimés
    fileLoaded: false, // fin du chargement du fichier de rdv
    fileReady: false // le fichier a été bien sélectionné et les rdv peuvent être chargés
  };

  componentWillReceiveProps(next) {
    this.setState({
      open: next.open,
      selectedPlannings: this.initSelectedPlannings() // une valeur au début
    });
  }

  // le planning courant est sélectionné par défaut
  initSelectedPlannings = () => {
    let selPl = this.state.selectedPlannings;
    if (
      this.props.planningId !== -1 &&
      !_.includes(this.props.plannings, this.props.planningId) &&
      _.isEmpty(selPl)
    ) {
      selPl.push(this.props.planningId);
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
    let param = this.state.selectedPlannings.join("-");
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

    inputFile.onchange = () => {
      if (_.isEmpty(inputFile.files)) {
        return;
      } else {
        inputToken.value = this.props.client.token;
        form.appendChild(inputToken);
        form.submit();
      }
    };

    inputFile.click();
    this.setState({ fileReady: true });
  };

  onLoad = () => {
    // fin du chargement
    if (this.state.fileReady) {
      this.setState({ fileLoaded: true });
    }
  };

  render() {
    //console.log(this.props.plannings);
    return (
      <React.Fragment>
        <Modal size="small" open={this.state.open}>
          <Modal.Header>Import des rendez-vous</Modal.Header>
          <Modal.Content>
            <p>
              <strong>Import des rendez-vous</strong> à partir d'un fichier au
              format <strong>iCalendar (.ics)</strong>.
            </p>
            <p>
              Par défaut les nouveaux rendez-vous seront importés sur{" "}
              <strong>{this.props.planningTitre}</strong> et ceux préexistants
              sur ce planning seront supprimés.
            </p>
            <Form>
              <Form.Input
                label={
                  <label>
                    Effacer tous les rendez-vous préexistants sur le(s)
                    planning(s) de destination.
                  </label>
                }
              >
                <Checkbox
                  toggle={true}
                  checked={this.state.clearRdv}
                  onChange={(e, d) => this.clearRdvChange()}
                />
              </Form.Input>

              {_.size(this.props.plannings) !== 1 &&
              !_.isEmpty(this.props.plannings) ? (
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
                  {_.map(this.props.plannings, planning => (
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
              id="import-form-frame"
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
              style={{ display: "none" }}
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
        <Modal size="small" open={this.state.fileLoaded}>
          <Modal.Header>Import terminé</Modal.Header>
          <Modal.Content>
            <Message icon={true} positive={true}>
              <Icon name="check" />
              <Message.Header>L'import a été effectué.</Message.Header>
            </Message>
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.state.fileLoaded) {
                  node.focus();
                }
              }}
            >
              <Button
                content="OK"
                primary={true}
                onClick={() => {
                  this.setState({ fileLoaded: false, fileReady: false });
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
