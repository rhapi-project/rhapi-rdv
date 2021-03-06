import React from "react";
import { Actes, Shared } from "rhapi-ui-react";
import { Button, Divider, Form, Icon, Message, Modal } from "semantic-ui-react";

import _ from "lodash";

import site from "./SiteSettings";

export default class PatientHistorique extends React.Component {
  state = {
    idNoteTodo: 0,
    acteEdition: null,
    actionEdition: null,
    acteCorrespondante: false,
    fse: {},
    startAt: "",
    endAt: "",
    localisation: "",
    openLocalisations: false,
    openNoteTodo: false,
    typeNoteTodo: ""
  };

  read = idActe => {
    this.props.client.Actes.read(
      idActe,
      {},
      result => {
        if (_.startsWith(result.code, "#")) {
          this.setState({
            fse: result,
            acteEdition: idActe
          });
        } else {
          this.props.client.Actes.read(result.idDocument, {}, res => {
            this.setState({
              acteCorrespondante: true,
              fse: res,
              acteEdition: res.id
            });
          });
        }
      },
      error => {
        console.log(error);
        this.setState({ fse: {} });
      }
    );
  };

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
    //let actes = ids.join(",");
    //console.log(`onSelectionChange ${actes}`);
  };

  onActionTest1 = id => {
    // l'id de l'acte en paramètre
    //console.log(`onActionTest1 ${id}`);
  };

  onActionTest2 = id => {
    // l'id de l'acte en paramètre
    //console.log(`onActionTest2 ${id}`);
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
        <React.Fragment>
          <Divider hidden={true} />
          <Form>
            <Form.Group>
              <Shared.Periode
                labelDate="Période"
                labelYear="&nbsp;"
                startYear={site.evolution.periode.startingYear}
                onPeriodeChange={(startAt, endAt) => {
                  if (startAt && endAt) {
                    this.setState({
                      startAt: startAt,
                      endAt: endAt
                    });
                  } else {
                    //console.log("Durée indéterminée");
                    this.setState({
                      startAt: "",
                      endAt: ""
                    });
                  }
                }}
              />
              <Form.Input
                label="Localisation"
                width={3}
                placeholder="Localisation"
                onClick={() => this.setState({ openLocalisations: true })}
                value={this.state.localisation}
              />
              <Form.Input label="Note et TODO">
                <span>
                  <Button
                    animated
                    //size="large"
                    color="yellow"
                    onClick={() => {
                      this.setState({
                        idNoteTodo: 0,
                        typeNoteTodo: "note",
                        openNoteTodo: true
                      });
                    }}
                  >
                    <Button.Content visible={true}>
                      <Icon name="sticky note outline" />
                    </Button.Content>
                    <Button.Content hidden={true}>Note</Button.Content>
                  </Button>
                  <Button
                    animated
                    //size="large"
                    color="red"
                    onClick={() => {
                      this.setState({
                        idNoteTodo: 0,
                        typeNoteTodo: "todo",
                        openNoteTodo: true
                      });
                    }}
                  >
                    <Button.Content visible={true}>
                      <Icon name="list" />
                    </Button.Content>
                    <Button.Content hidden={true}>Todo</Button.Content>
                  </Button>
                </span>
              </Form.Input>
            </Form.Group>
          </Form>
          <div style={{ height: "550px", overflow: "auto" }}>
            <Actes.Historique
              client={this.props.client}
              idPatient={this.props.idPatient}
              id={this.state.idNoteTodo}
              onActeClick={this.onActeClick}
              onActeDoubleClick={this.onActeDoubleClick}
              onEditActeClick={idActe => {
                this.read(idActe);
              }}
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
              localisation={this.state.localisation}
              startAt={this.state.startAt}
              endAt={this.state.endAt}
              openNoteTodo={this.state.openNoteTodo}
              typeNoteTodo={this.state.typeNoteTodo}
              onOpenNoteTodo={(id, type) => {
                this.setState({
                  idNoteTodo: id,
                  openNoteTodo: true,
                  typeNoteTodo: type
                });
              }}
              onCloseNoteTodo={() => {
                this.setState({
                  openNoteTodo: false,
                  typeNoteTodo: ""
                });
              }}
            />
          </div>

          {/* Choix à faire Rééditer ou Reprendre comme nouveau */}
          <Modal
            size="tiny"
            open={
              !_.isNull(this.state.acteEdition) && !_.isEmpty(this.state.fse)
            }
          >
            <Modal.Header>
              {this.state.fse.code === "#FSE"
                ? "Édition d'une feuille de soins"
                : this.state.fse.code === "#DEVIS"
                ? "Édition d'un projet/devis"
                : null}
            </Modal.Header>
            <Modal.Content>
              {this.state.acteCorrespondante ? (
                <Message>
                  <Message.Content>
                    FSE correspondante à cet acte
                  </Message.Content>
                </Message>
              ) : null}
              <Button
                fluid={true}
                content={
                  this.state.fse.code === "#FSE"
                    ? "Afficher le duplicata"
                    : this.state.fse.code === "#DEVIS"
                    ? "Modifier ce projet/devis"
                    : null
                }
                onClick={() => {
                  this.props.onReedition(this.state.acteEdition);
                }}
              />
              <Button
                style={{ marginTop: "20px" }}
                fluid={true}
                content={
                  this.state.fse.code === "#FSE"
                    ? "Éditer comme une nouvelle FSE"
                    : this.state.fse.code === "#DEVIS"
                    ? "Éditer comme un nouveau projet"
                    : null
                }
                onClick={() => {
                  this.props.onCopy(this.state.acteEdition);
                }}
              />
            </Modal.Content>
            <Modal.Actions>
              <Button
                content="Annuler"
                onClick={() =>
                  this.setState({
                    acteEdition: null,
                    acteCorrespondante: false
                  })
                }
              />
            </Modal.Actions>
          </Modal>

          {/* Grille des localisations */}
          <Shared.Localisations
            localisation={this.state.localisation}
            onSelection={localisation => {
              this.setState({ localisation: localisation });
            }}
            modal={{
              size: "large",
              open: this.state.openLocalisations,
              onClose: () => {
                this.setState({ openLocalisations: false });
              }
            }}
          />
        </React.Fragment>
      );
  }
}
