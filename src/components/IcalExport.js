import React from "react";

import { Button, Modal, Ref } from "semantic-ui-react";

export default class IcalExport extends React.Component {
  // TODO : Ajouter les retours utilisateurs d'erreurs si l'export a échoué par exemple

  state = {
    open: false,
    planningId: -1, // aucun planning
    planningTitre: ""
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
      error => {}
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
              Voulez-vous exporter les rendez-vous du planning "{" "}
              <strong>{this.state.planningTitre}</strong> " ?
            </p>
          </Modal.Content>
          <Modal.Actions>
            <Button content="Non" onClick={this.close} />
            <Ref
              innerRef={node => {
                if (this.state.open) {
                  node.focus();
                }
              }}
            >
              <Button content="Oui" primary={true} onClick={this.export} />
            </Ref>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
