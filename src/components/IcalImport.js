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
  Loader,
  Dimmer,
  Ref,
  Dropdown
} from "semantic-ui-react";

export default class IcalImport extends React.Component {
  state = {
    open: false,
    selectedPlannings: [], // les id des plannings sélectionnés
    motifs: {},
    clearRdv: false, // les rdv préexistants sur les plannings sélectionnés seront supprimés
    fileLoaded: false, // fin du chargement du fichier de rdv
    fileReady: false // le fichier a été bien sélectionné et les rdv peuvent être chargés
  };

  componentWillReceiveProps(next) {
    this.setState({
      clearRdv: false, // les rdv préexistants sur les plannings sélectionnés seront supprimés
      fileLoaded: false, // fin du chargement du fichier de rdv
      fileReady: false, // le fichier a été bien sélectionné et les rdv peuvent être chargés
      open: next.open,
      motifs: {},
      selectedPlannings: this.initSelectedPlannings() // une valeur au début
    });
  }

  // le planning courant est sélectionné par défaut
  initSelectedPlannings = () => {
    let selPl = []; // = this.state.selectedPlannings;
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

  planningMotifChange = d => {
    let motifs = this.state.motifs;
    _.set(motifs, d.planning, d.value);
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
    let motifs = this.state.motifs;

    let idMotifs = _.map(this.state.selectedPlannings, planning => {
      return planning + "_" + _.get(motifs, planning, 0);
    });

    let param = idMotifs.join("-");

    if (this.state.clearRdv) {
      param += "-clear";
    }
    console.log(param);
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
    inputFile.name = "ical";
    inputFile.type = "file";
    inputFile.accept = "text/calendar";
    form.appendChild(inputFile);

    let inputToken = document.createElement("input");
    inputToken.name = "token";
    inputToken.type = "hidden";

    inputFile.onchange = () => {
      if (_.isEmpty(inputFile.files)) {
        return;
      } else {
        inputToken.value = this.props.client.token;
        form.appendChild(inputToken);
        form.submit();
        this.setState({ fileReady: true });
      }
    };

    inputFile.click();
  };

  onLoad = () => {
    // fin du chargement
    if (this.state.fileReady) {
      this.setState({ fileLoaded: true });
    }
  };

  render() {
    if (!this.state.open) return "";
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
              <strong>{this.props.planningTitre}</strong> et fusionnés avec ceux
              préexistants sur ce planning.
            </p>
            <Form>
              <Checkbox
                label="Effacer tous les rendez-vous préexistants sur le(s) planning(s) de destination."
                toggle={true}
                checked={this.state.clearRdv}
                onChange={(e, d) => this.clearRdvChange()}
              />
              <Divider />

              {_.map(this.props.plannings, (planning, i) => {
                let motifsOptions = [{ value: 0, text: "Aucun motif défini" }];

                _.forEach(planning.optionsJO.reservation.motifs, (m, i) => {
                  if (!m.hidden) {
                    motifsOptions.push({
                      value: i + 1,
                      text: m.motif
                    });
                  }
                });

                return (
                  <Form.Group widths="equal" key={planning.id}>
                    <Form.Input>
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
                    <Form.Input>
                      <Dropdown
                        fluid={true}
                        planning={planning.id}
                        selection={true}
                        options={motifsOptions}
                        onChange={(e, d) => {
                          this.planningMotifChange(d);
                        }}
                      />
                    </Form.Input>
                  </Form.Group>
                );
              })}
            </Form>
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
          <Dimmer active={this.state.fileReady}>
            <Loader>Chargement en cours...</Loader>
          </Dimmer>
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
