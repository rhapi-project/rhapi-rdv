import React from "react";

import { Button, Message, Modal, Ref } from "semantic-ui-react";

export default class IcalExport extends React.Component {
  state = {
    open: false,
    planningId: -1, // aucun planning
    planningTitre: "",
    error: false // modal d'erreur
  };

  static getDerivedStateFromProps(props, state) {
    if (
      props.open !== state.open ||
      props.planningId !== state.planningId ||
      props.planningTitre !== state.planningTitre
    ) {
      return {
        open: props.open,
        planningId: props.planningId,
        planningTitre: props.planningTitre
      };
    }
    return null;
  }

  close = () => {
    this.props.modalIcalExportOpen(false);
  };

  export = () => {
    // Click sur la balise <a> dans firefox : a.click() -> ne fonctionne pas.
    // Mettre l'élément <a> dans le DOM pour résoudre ce problème
    // https://stackoverflow.com/questions/32225904/programmatical-click-on-a-tag-not-working-in-firefox
    let a = document.createElement("a");
    a.type = "hidden";

    let params = { titre: this.state.planningTitre };
    this.props.client.Plannings.exportIcal(
      this.state.planningId,
      params,
      result => {
        //console.log(result);
        a.href = result.url;
        document.body.appendChild(a); // "a" dans le DOM -> nécessaire sur Firefox
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
