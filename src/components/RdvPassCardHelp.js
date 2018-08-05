import React from "react";

//import _ from "lodash";

import {
  Button,
  Divider,
  Icon,
  List,
  Message,
  Modal,
  Ref
} from "semantic-ui-react";

export default class RdvPassCardHelp extends React.Component {
  browser = () => {
    if (
      navigator.userAgent.indexOf("Chrome") !== -1 &&
      !(navigator.userAgent.indexOf("Edge/") !== -1)
    ) {
      return "Chrome";
    } else if (navigator.userAgent.indexOf("Firefox") !== -1) {
      return "Firefox";
    } else if (navigator.userAgent.indexOf("Edge/") !== -1) {
      return "Edge";
    } else if (navigator.userAgent.indexOf("Trident") !== -1) {
      // l'attribut "Trident" de navigator.userAgent existe
      // uniquement sur les navigateurs IE (pas Edge)
      return "MSIE";
    } else if (navigator.userAgent.indexOf("Safari") !== -1) {
      return "Safari";
    } else {
      // TODO : définir les autres navigateurs si besoin
      return "";
    }
  };

  render() {
    let browser = this.browser();
    return (
      <Modal size="small" open={this.props.open}>
        <Modal.Header>Impression d'une carte de rendez-vous</Modal.Header>
        <Modal.Content>
          {browser === "Chrome" ? (
            // chrome
            <div>
              <Icon name="chrome" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>Google Chrome</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  Cliquer sur le bouton &nbsp;&nbsp;
                  <strong>
                    "<Icon name="print" />
                    Carte de RDV"
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
                            veuillez consulter l'
                            <a
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
          ) : browser === "Firefox" ? (
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
                      </span>
                      &nbsp;puis&nbsp;
                      <span>
                        <strong>
                          "<Icon name="print" /> Imprimer"
                        </strong>
                      </span>
                      <br />
                      <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                        <span>
                          <strong>"Mise en page"</strong>
                          &nbsp;
                          <Icon name="arrow right" />
                          &nbsp;
                          <strong>"Marges, en-têtes et pieds de page"</strong>
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
                      Cliquer sur le bouton &nbsp;&nbsp;
                      <strong>
                        "<Icon name="print" />
                        Carte de RDV"
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
                              veuillez consulter l'
                              <a
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
          ) : browser === "Edge" ? (
            <div>
              <Icon name="edge" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>"Microsoft Edge"</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur le bouton &nbsp;&nbsp;
                      <strong>
                        "<Icon name="print" />
                        Carte de RDV"
                      </strong>
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Imprimante</span>
                    <div style={{ marginTop: "5px" }}>
                      Choisir : &nbsp;&nbsp;
                      <span style={{ color: "blue" }}>
                        DYMO LabelWriter 450 Turbo
                      </span>
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
                            veuillez consulter l'
                            <a
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
                  <List.Content>
                    <span>Préférences d'impression</span>
                    <div>
                      <table>
                        <tbody>
                          <tr>
                            <td>Orientation</td>
                            <td> : </td>
                            <td>
                              <strong>Paysage</strong>
                            </td>
                          </tr>
                          <tr>
                            <td>Mise à l'échelle</td>
                            <td> : </td>
                            <td>
                              <strong>Ajuster</strong>
                            </td>
                          </tr>
                          <tr>
                            <td>Marges</td>
                            <td> : </td>
                            <td>
                              <strong>Normales</strong>
                            </td>
                          </tr>
                          <tr>
                            <td>En-têtes et pieds de page</td>
                            <td> : </td>
                            <td>
                              <strong>Désactivés</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Autres paramètres</span>
                    <div>
                      <span>
                        Papier et qualité &nbsp;
                        <Icon name="arrow right" />
                        &nbsp; Format du papier :{" "}
                        <strong>30374 Appointment Card</strong>
                      </span>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"OK"</strong> pour valider
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"Imprimer"</strong> pour lancer
                      l'impression
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Après l'impression, fermer la nouvelle fenêtre qui s'est
                      ouverte spécialement pour l'impression
                    </span>
                  </List.Content>
                </List.Item>
              </List>
            </div>
          ) : browser === "MSIE" ? (
            <div>
              <Icon name="internet explorer" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>Internet Explorer</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  <List.Content>
                    <span>
                      Configuration de la mise en page sur le navigateur (la
                      1ère fois seulement)
                    </span>
                    <div style={{ marginTop: "5px" }}>
                      L'option <strong>"Mise en page"</strong> est accessible à
                      partir du menu
                      <span>
                        <strong>
                          "Paramètres <Icon name="setting" />"
                        </strong>
                      </span>
                      &nbsp;puis&nbsp;
                      <span>
                        <strong>"Imprimer"</strong>
                      </span>
                      <br />
                      <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                        <span>
                          <strong>"Mise en page"</strong>
                          &nbsp;
                          <Icon name="arrow right" />
                          &nbsp;
                          <strong>"En-têtes et pieds de page"</strong>
                        </span>
                        <br />
                        <br />
                        <span>
                          <strong>Options de papier</strong> et{" "}
                          <strong>Marges (millimètres)</strong> par défaut.
                        </span>
                        <br />
                        Selectionner <strong>"--vide--"</strong> sur tous les
                        champs d'en-têtes et pieds de page
                        <br />
                        <span>
                          <strong>OK</strong> pour sauvegarder les modifications
                        </span>
                      </div>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur le bouton &nbsp;&nbsp;
                      <strong>
                        "<Icon name="print" />
                        Carte de RDV"
                      </strong>
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Sélectionnez une imprimante</span>
                    <div>
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
                              veuillez consulter l'
                              <a
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
                    <span>Préférences</span>
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
                <List.Item>
                  <List.Content>
                    <span>
                      Après l'impression, fermer la nouvelle fenêtre qui s'est
                      ouverte spécialement pour l'impression
                    </span>
                  </List.Content>
                </List.Item>
              </List>
            </div>
          ) : browser === "Safari" ? (
            <div>
              {/* TODO : CSS pour Safari */}
              <Icon name="safari" size="big" />
              Impression de la carte de rendez-vous sur{" "}
              <strong>"Safari"</strong>
              <Divider hidden={true} />
              <List ordered={true}>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur le bouton &nbsp;&nbsp;
                      <strong>
                        "<Icon name="print" />
                        Carte de RDV"
                      </strong>
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>Imprimante</span>
                    <div style={{ marginTop: "5px" }}>
                      Choisir : &nbsp;&nbsp;
                      <span style={{ color: "blue" }}>
                        DYMO LabelWriter 450 Turbo
                      </span>
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
                            veuillez consulter l'
                            <a
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
                  <List.Content>
                    <span>Préréglages d'impression</span>
                    <div>
                      <table>
                        <tbody>
                          <tr>
                            <td>Taille du papier</td>
                            <td> : </td>
                            <td>
                              <strong>30374 Appointment Card</strong>
                            </td>
                          </tr>
                          <tr>
                            <td>Orientation</td>
                            <td> : </td>
                            <td>
                              <strong>Paysage (voir icône)</strong>
                            </td>
                          </tr>
                          <tr>
                            <td>Echelle</td>
                            <td> : </td>
                            <td>
                              <strong>100</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: "5px" }}>
                      <span>
                        <u>Autres réglages</u>
                      </span>
                      <br />
                      <br />
                      <span>
                        <strong>Safari</strong>
                      </span>
                      <br />
                      <span>
                        <Icon name="circle" size="tiny" /> Décocher{" "}
                        <strong>"Imprimer arrière-plan"</strong>
                      </span>
                      <br />
                      <span>
                        <Icon name="circle" size="tiny" /> Décocher{" "}
                        <strong>
                          "Impression : en-têtes et pieds de page"
                        </strong>
                      </span>
                      <br />
                      <br />
                      <span>
                        <strong>Mise en page</strong> (les paramètres restent
                        par défaut)
                      </span>
                      <br />
                      <br />
                      <span>
                        <strong>Gestion du papier</strong>
                      </span>
                      <br />
                      <span>
                        <Icon name="circle" size="tiny" /> Cocher{" "}
                        <strong>"Adapter à la taille du papier"</strong>
                      </span>
                      <br />
                      <span>
                        <Icon name="circle" size="tiny" /> Taille du papier de
                        destination : <strong>30374 Appointment Card</strong>
                      </span>
                      <br />
                      <br />
                      <span>
                        <strong>Page de garde</strong> et{" "}
                        <strong>Fonctions d'imprimante</strong> (les paramètres
                        restent par défaut)
                      </span>
                    </div>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Enregistrement des préréglages pour l'imprimante à
                      étiquette
                    </span>
                    <br />
                    <span>
                      <Icon name="circle" size="tiny" />
                      Préréglages &nbsp;&nbsp;
                      <Icon name="arrow right" />
                      &nbsp; Enregistrer les réglages actuels comme préréglages
                    </span>
                    <br />
                    <span>
                      <Icon name="circle" size="tiny" />
                      Nouveau nom du préréglage
                    </span>
                    <br />
                    <span>
                      <Icon name="circle" size="tiny" />
                      Sélectionner <strong>"Seulement cette imprimante"</strong>
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      <strong>"OK"</strong> pour sauvegarder
                    </span>
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <span>
                      Cliquer sur <strong>"imprimer"</strong> pour lancer
                      l'impression de la carte de rendez-vous
                    </span>
                  </List.Content>
                </List.Item>
              </List>
            </div>
          ) : (
            <div>Autre navigateur</div>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Ref innerRef={node => node.focus()}>
            <Button
              primary={true}
              content="Fermer"
              onClick={() => this.props.openHelp(false)}
            />
          </Ref>
        </Modal.Actions>
      </Modal>
    );
  }
}
