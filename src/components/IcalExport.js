import React from "react";

import { Button, Message, Modal, Ref } from "semantic-ui-react";

export default class IcalExport extends React.Component {
  state = {
    open: false,
    planningId: -1, // aucun planning
    planningTitre: "",
    error: false // modal d'erreur
  };

  componentWillReceiveProps(next) {
    this.setState({
      open: next.open,
      planningId: next.planningId,
      planningTitre: next.planningTitre
    });
  }

  close = () => {
    this.props.modalIcalExportOpen(false);
  };

  export = () => {
    let a = document.createElement("a");
    //let myHeaders = new Headers();
    //myHeaders.append("Content-type", "application/octet-stream");

    let params = { titre: this.state.planningTitre };
    this.props.client.Plannings.exportIcal(
      this.state.planningId,
      params,
      result => {
        //console.log(result);
        a.href = result.url;
        a.click(); // Warning
        this.close();
      },
      error => {
        this.setState({ error: true });
      }
    );

    // Warning : Resource interpreted as Document but transferred with MIME type application/octet-stream: ...lien
    // Warning qui survient à la fin du téléchargement du fichier ics
  };

  render() {
    return (
      <React.Fragment>
        <Modal size="small" open={this.state.open}>
          <Modal.Header>Export des rendez-vous</Modal.Header>
          <Modal.Content>
            <p>
              Les rendez-vous du planning "
              <strong>{this.state.planningTitre}</strong>" seront sauvegardés
              dans un fichier au format <strong>iCalendar (*.ics)</strong>,
              nommé "{this.state.planningTitre}
              .ics" et placé dans le dossier des téléchargements.
            </p>
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
            <Button content="Exporter" onClick={this.export} />
          </Modal.Actions>
        </Modal>

        {/* Modal Erreur de sauvegarde */}

        <Modal size="small" open={this.state.error}>
          <Modal.Header>Erreur de sauvegarde</Modal.Header>
          <Modal.Content>
            <Message error={true}>
              <Message.Content>
                <Message.Header>
                  Le téléchargement du fichier{" "}
                  <strong>
                    {this.state.planningTitre}
                    .ics
                  </strong>{" "}
                  a échoué !
                </Message.Header>
                Vérifiez votre connexion réseau et recommencez la sauvegarde.
              </Message.Content>
            </Message>
          </Modal.Content>
          <Modal.Actions>
            <Ref
              innerRef={node => {
                if (this.state.error) {
                  node.focus();
                }
              }}
            >
              <Button
                content="OK"
                onClick={() => {
                  this.setState({ error: false });
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
