import React from "react";

import { Button, Divider, Icon, List, Message, Modal } from "semantic-ui-react";

export default class RdvPassCardHelp extends React.Component {
  render() {
    return (
      <Modal size="small" open={this.props.open}>
        <Modal.Header>Impression d'une carte de rendez-vous</Modal.Header>
        <Modal.Content>
          {navigator.userAgent.indexOf("Chrome") !== -1 ? (
            // chrome
            <div>
              <Icon name="chrome" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>Google Chrome</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  Cliquer sur le bouton &nbsp;&nbsp;<strong>
                    "<Icon name="print" />Carte de RDV"
                  </strong>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Choix de l'imprimante</span>
                    <div style={{ marginTop: "5px" }}>
                      Destination : &nbsp;&nbsp;
                      <span style={{ color: "blue" }}>
                        DYMO LabelWriter 450 Turbo
                      </span>
                      <br />
                      Cliquer sur <strong>"Modifier"</strong> pour changer
                      l'imprimante cible.
                    </div>
                    <div style={{ marginTop: "5px" }}>
                      <Message warning={true} icon={true}>
                        <Icon name="warning" />
                        <Message.Content>
                          <Message.Header>
                            Imprimante à étiquette introuvable
                          </Message.Header>
                          <p>
                            Si aucune imprimante à étiquette n'est repérée,
                            veuillez consulter l'<a
                              onClick={() =>
                                alert(
                                  "TODO: Renvoyer sur la doc principale de l'application"
                                )
                              }
                            >
                              aide
                            </a>{" "}
                            de l'application pour en savoir plus sur
                            l'installation d'une imprimante à étiquette.
                          </p>
                        </Message.Content>
                      </Message>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <span>
                    "<Icon name="add" /> Plus de paramètres"
                  </span>
                  <div style={{ marginTop: "5px" }}>
                    <table>
                      <tbody>
                        <tr>
                          <td>Taille du papier</td>
                          <td> - </td>
                          <td>
                            <strong>30374 Appointment Card</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>Marges</td>
                          <td> - </td>
                          <td>
                            <strong>Par défaut</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>Qualité</td>
                          <td> - </td>
                          <td>
                            <strong>300 PPP</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>Mise à l'échelle</td>
                          <td> - </td>
                          <td>
                            <strong>100</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Options</span>
                    <div style={{ marginTop: "5px" }}>
                      Décocher <strong>"En-têtes et pieds de page"</strong>{" "}
                      <br />
                      Décocher <strong>"Graphiques d'arrière-plan"</strong>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"Imprimer"</strong> pour lancer
                      l'impression de la carte de rendez-vous
                    </span>
                  </List.Content>
                </List.Item>
              </List>
            </div>
          ) : navigator.userAgent.indexOf("Firefox") !== -1 ? (
            // Firefox
            <div>
              <Icon name="firefox" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>Mozilla Firefox</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  <List.Content>
                    <span>
                      Configuration des paramètres d'impression sur le
                      navigateur (la 1ère fois seulement)
                    </span>
                    <div style={{ marginTop: "5px" }}>
                      Ces paramètres sont accessibles à partir du menu{" "}
                      <span>
                        <strong>
                          "Paramètres <Icon name="sidebar" />"
                        </strong>
                      </span>&nbsp;puis&nbsp;<span>
                        <strong>
                          "<Icon name="print" /> Imprimer"
                        </strong>
                      </span>
                      <br />
                      <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                        <span>
                          <strong>"Mise en page"</strong>&nbsp;<Icon name="arrow right" />&nbsp;<strong
                          >
                            "Marges, en-têtes et pieds de page"
                          </strong>
                        </span>
                        <br />
                        <br />
                        Donner une valeur nulle à toutes les marges.
                        <br />
                        Selectionner <strong>"--vide--"</strong> sur tous les
                        champs d'en-têtes et pieds de page
                      </div>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur le bouton &nbsp;&nbsp;<strong>
                        "<Icon name="print" />Carte de RDV"
                      </strong>
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Choix de l'imprimante</span>
                    <div>
                      Nom :&nbsp;&nbsp;
                      <span style={{ color: "blue" }}>
                        DYMO LabelWriter 450 Turbo
                      </span>
                      <div style={{ marginTop: "5px" }}>
                        <Message warning={true} icon={true}>
                          <Icon name="warning" />
                          <Message.Content>
                            <Message.Header>
                              Imprimante à étiquette introuvable
                            </Message.Header>
                            <p>
                              Si aucune imprimante à étiquette n'est repérée,
                              veuillez consulter l'<a
                                onClick={() =>
                                  alert(
                                    "TODO: Renvoyer sur la doc principale de l'application"
                                  )
                                }
                              >
                                aide
                              </a>{" "}
                              de l'application pour en savoir plus sur
                              l'installation d'une imprimante à étiquette.
                            </p>
                          </Message.Content>
                        </Message>
                      </div>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Propriétés</span>
                    <div style={{ marginTop: "5px" }}>
                      <span>
                        Disposition &nbsp;
                        <Icon name="arrow right" />
                        &nbsp; Orientation : <strong>Paysage</strong>
                      </span>
                      <br />
                      <span>Avancées : </span>
                      <br />
                      <span>
                        Format du papier :{" "}
                        <strong>30374 Appointment Card</strong>
                      </span>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"OK"</strong> pour enregistrer
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"OK"</strong> pour lancer l'impression
                      de la carte de rendez-vous
                    </span>
                  </List.Content>
                </List.Item>
              </List>
            </div>
          ) : navigator.userAgent.indexOf("Edge/") !== -1 ? (
            <div>Edge</div>
          ) : navigator.userAgent.indexOf("MSIE") !== -1 ? (
            <div>Internet Explorer</div>
          ) : navigator.userAgent.indexOf("Safari") !== -1 ? (
            <div>Safari</div>
          ) : (
            <div>Autre navigateur</div>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button
            primary={true}
            content="Fermer"
            onClick={() => this.props.openHelp(false)}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}
