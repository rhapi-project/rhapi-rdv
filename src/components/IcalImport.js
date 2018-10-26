import React from "react";

import {
  Button,
  Checkbox,
  Form,
  Icon,
  Message,
  Modal,
  Ref
} from "semantic-ui-react";

export default class IcalImport extends React.Component {
  // TODO : Ajouter les retours utilisateurs d'erreurs si par exemple l'utilisateur veut importer
  // un fichier qui n'est pas au bon format.
  // Ou bien si aucun fichier n'a été importé...

  state = {
    open: false,
    planningId: -1, // aucun planning
    planningTitre: "",
    deleteAllRdv: true, // tous les rdv sur le planning d'id "planningId" seront supprimés
    finChargement: false
  };

  componentWillReceiveProps(next) {
    this.setState({
      open: next.open,
      planningId: next.planningId,
      planningTitre: next.planningTitre
    });
  }

  close = () => {
    this.props.modalIcalImportOpen(false);
  };

  deleteAllRdv = () => {
    // changer l'état de la checkbox de suppression de tous les rdv sur le planning courant
    this.setState({
      deleteAllRdv: !this.state.deleteAllRdv
    });
  };

  // Import des rendez-vous sans suppression de ceux qui figuraient sur le planning
  // TODO : Ajouter la possibiliter de supprimer d'abord les rendez-vous qui étaient sur le planning
  import = () => {
    let form = document.getElementById("import-form");
    form.setAttribute(
      "action",
      this.props.client.baseUrl +
        "/Plannings/" +
        this.state.planningId +
        "/importIcal"
    );
    document.getElementById(
      "import-form-token"
    ).value = this.props.client.token;
    form.submit();
  };

  onLoad = () => {
    // fin du chargement
    this.setState({ finChargement: true });
  };

  render() {
    return (
      <React.Fragment>
        <Modal
          size="small"
          open={this.state.open}
          closeIcon={true}
          onClose={(e, d) => this.close()}
        >
          <Modal.Header>Import des rendez-vous</Modal.Header>
          <Modal.Content>
            <p>
              Sélectionner le fichier à importer.
              <br />
              Le fichier à importer doit être de type "
              <strong>iCalendar (.ics)</strong>
              ".
            </p>
            {/* Import au format iCalendar (*.ics) => à placer dans une modal */}
            <iframe // iframe masquée comme cible du formulaire
              name="import-form-frame"
              title="import-form-frame"
              onLoad={this.onLoad}
              /*onLoad={() => {
              alert("Fichier transmis");
              // fin du chargement
              // afficher un rendu (par exemple le nombre de rendez-vous pour ce planning)
              }}*/
              style={{ display: "none" }}
            />
            <Form
              id="import-form"
              target="import-form-frame"
              method="post"
              encType="multipart/form-data"
            >
              <Form.Input name="ical" type="file" />
              <Form.Input id="import-form-token" name="token" type="hidden" />
            </Form>
            <Checkbox
              toggle={true}
              label={
                <label>
                  Tous les rendez-vous existants sur le planning "
                  <strong>{this.state.planningTitre}</strong>" seront supprimés
                  !
                </label>
              }
              checked={this.state.deleteAllRdv}
              onChange={(e, d) => this.deleteAllRdv()}
            />
          </Modal.Content>
          <Modal.Actions>
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
