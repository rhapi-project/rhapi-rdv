import React from "react";

import _ from "lodash";

import {
  Header,
  Dropdown,
  Accordion,
  Form,
  Button,
  Divider,
  Popup,
  Icon,
  Checkbox,
  Message,
  Table,
  Confirm,
  Portal
} from "semantic-ui-react";

import { maxWidth, fsize, hsize, defaultPlanning } from "./Settings";

import HorairesSemaine from "./HorairesSemaine";
import Conges from "./Conges";

import ColorPicker from "./ColorPicker";

export default class Configuration extends React.Component {
  componentWillMount() {
    this.setState({
      plannings: [],
      index: -1,
      reservationActiveIndex: -1,
      saved: true
    });
    this.reload(0);
  }

  reload = index => {
    if (_.isUndefined(index)) {
      index = this.state.index;
    }

    console.log("test lecture/écriture : " + this.props.user);

    // lecture/écriture
    /*
    this.props.client.MonCompte.read(
      monCompte => {
        console.log(monCompte);
        // écriture
        monCompte.currentName = "Nom courant 2";
        //monCompte.userPassword = "masteruser";
        //delete monCompte.userName;
        this.props.client.MonCompte.update(
            monCompte,
            data => {
                console.log("ok");
                console.log(data);
            },
            (data, result) => {
                console.log("ko");
                console.log(data);
                console.log(data);
            }
        )
        //
      },
      data => {
        console.log("erreur");
        console.log(data);
      }
    );
    */

    this.props.client.Plannings.mesPlannings(
      { admin: true },
      result => {
        this.setState({
          plannings: result.results,
          index: index < result.results.length ? index : -1,
          saved: true
        });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  cancel = () => {
    /*
    if (!this.state.saved) {
      this.setState({
        confirmationMessage:
          "Certaines modifications ne sont pas sauvegardées. Souhaitez-vous les annuler ?",
        confirmationAction: this.reload
      });
    } else {
    */
    this.reload();
    //}
  };

  defaults = () => {
    let plannings = this.state.plannings;
    plannings[this.state.index] = defaultPlanning;
    this.setState({ plannings: plannings, saved: false });
  };

  save = () => {
    if (this.saveProcessing) {
      return;
    }
    this.saveProcessing = true;
    let last = this.state.plannings.length - 1;
    _.forEach(this.state.plannings, (planning, i) => {
      this.props.client.Plannings.update(
        planning.id,
        planning,
        result => {
          planning.lockRevision++;
          this.setState({ saved: true });
          if (i === last) {
            this.saveProcessing = false;
          }
        },
        datas => {
          if (i === last) {
            this.saveProcessing = false;
          }
          console.log("erreur sur save() :");
          console.log(datas);
          if (datas.networkError === 409) {
            this.setState({
              confirmationMessage:
                "Les données ont été modifiées depuis un autre poste. Vous devez les recharger.",
              confirmationAction: this.reload
            });
          }
        }
      );
    });
  };

  supprimer = () => {
    let supprimerAction = () => {
      const id = this.state.plannings[this.state.index].id;
      this.props.client.Plannings.destroy(
        id,
        () => {
          let index = this.state.index;
          this.reload(
            index === this.state.plannings.length - 1 ? index - 1 : index
          );
        },
        datas => {
          console.log("erreur sur supprimer() :");
          console.log(datas);
        }
      );
    };

    this.setState({
      confirmationMessage: this.state.saved
        ? "Souhaitez-vous supprimer définitivement ce planning ?"
        : "Souhaitez-vous supprimer définitivement ce planning sans sauvegarde préalable des modifications  ?",
      confirmationAction: supprimerAction
    });
  };

  ajouter = () => {
    let ajouterAction = () => {
      this.props.client.Plannings.create(
        defaultPlanning,
        () => {
          this.reload(this.state.plannings.length);
        },
        datas => {
          console.log("erreur sur ajouter() :");
          console.log(datas);
        }
      );
    };
    if (!this.state.saved) {
      this.setState({
        confirmationMessage:
          "Certaines modifications ne sont pas sauvegardées. Vous confirmez l'ajout d'un nouveau planning sans sauvegarde préalable des modifications ?",
        confirmationAction: ajouterAction
      });
    } else {
      ajouterAction();
    }
  };

  dupliquer = () => {
    let dupliquerAction = () => {
      let planning = this.state.plannings[this.state.index];
      planning.titre += " (copie)";
      this.props.client.Plannings.create(
        planning,
        () => {
          this.reload(this.state.plannings.length);
        },
        datas => {
          console.log("erreur sur ajouter() :");
          console.log(datas);
        }
      );
    };
    if (!this.state.saved) {
      this.setState({
        confirmationMessage:
          "Certaines modifications ne sont pas sauvegardées. Vous confirmez la duplication de ce planning sans sauvegarde préalable des modifications ?",
        confirmationAction: dupliquerAction
      });
    } else {
      dupliquerAction();
    }
  };

  transferer = () => {
    this.props.client.Plannings.mesPlannings(
      { transfer: true },
      result => {
        let transfers = result.results;
        let transfererAction = () => {
          let n = transfers.length;
          for (let i = 0; i < n; i++) {
            let transfer = transfers[i];
            transfer.optionsJO.acl.admin = transfer.optionsJO.acl.transfer;
            transfer.optionsJO.acl.transfer = "";
            this.props.client.Plannings.update(
              transfer.id,
              { optionsJO: transfer.optionsJO },
              () => {
                if (i === n - 1) {
                  this.setState({
                    messageOkAction:
                      "Le transfert des droits administrateur a bien été effectué."
                  });
                  this.reload();
                }
              },
              () => {}
            );
          }
        };

        if (transfers.length) {
          let s = transfers.length > 1 ? "s" : "";
          this.setState({
            confirmationMessage:
              "Les droits administrateurs vous sont proposés pour le" +
              s +
              " planning" +
              s +
              " suivant" +
              s +
              " : " +
              _.map(transfers, t => t.titre).join(", ") +
              ". Acceptez-vous le transfert de ce" +
              s +
              " planning" +
              s +
              " sur votre compte ?",
            confirmationAction: transfererAction
          });
        }
      },
      datas => {
        // erreur
        console.log(datas);
      }
    );
  };

  onHorairesChange = () => {
    this.setState({ saved: false });
  };

  onHorairesReservationChange = () => {
    this.setState({ saved: false });
  };

  render() {
    let { index, plannings, saved } = this.state;
    let form = "";

    if (index >= 0) {
      let planning = plannings[index];
      let options = planning.optionsJO;
      let horaires = options.plages.horaires;
      let horairesReservation = options.reservation.horaires;
      let congesPrevus = options.reservation.conges;

      const Plages = (
        <React.Fragment>
          <Form.Group>
            <Form.Input
              label="Durée par défaut d'un RDV (en mn)"
              style={{ maxWidth: maxWidth / 5 }}
              placeholder="Durée par défaut"
              value={options.plages.duree}
              type="number"
              onChange={(e, d) => {
                options.plages.duree = _.toNumber(d.value);
                this.setState({ /*plannings: plannings,*/ saved: false });
              }}
            />
            <Form.Input
              label="Durée minimale d'un RDV (plus petit créneau visible sur l'agenda en mn)"
              style={{ maxWidth: maxWidth / 5 }}
              placeholder="Durée minimale"
              value={options.plages.dureeMin}
              type="number"
              onChange={(e, d) => {
                options.plages.dureeMin = _.toNumber(d.value);
                this.setState({ /*plannings: plannings,*/ saved: false });
              }}
            />
          </Form.Group>
          <HorairesSemaine
            horaires={horaires}
            onHorairesChange={this.onHorairesChange}
          />
        </React.Fragment>
      );

      const HorairesReserves = (
        <React.Fragment>
          <Form.Group>
            <Form.Input
              label="Niveau minimum d'autorisation requis pour la prise de RDV en ligne"
              style={{ maxWidth: maxWidth / 5 }}
            >
              <Dropdown
                fluid={false}
                selection={true}
                error={
                  options.reservation.autorisationMin !== 4 &&
                  options.reservation.autorisationMin >
                    options.reservation.autorisationMax
                }
                options={[
                  {
                    text: "Niveau d'autorisation 0",
                    value: 0
                  },
                  {
                    text: "Niveau d'autorisation 1",
                    value: 1
                  },
                  {
                    text: "Niveau d'autorisation 2",
                    value: 2
                  },
                  {
                    text: "Niveau d'autorisation 3",
                    value: 3
                  },
                  {
                    text: "RDV en ligne désactivés (4)",
                    value: 4
                  }
                ]}
                value={options.reservation.autorisationMin}
                onChange={(e, d) => {
                  options.reservation.autorisationMin = d.value;
                  plannings[index].optionsJO = options;
                  this.setState({ saved: false /*, plannings: plannings*/ });
                }}
              />
            </Form.Input>
            <Form.Input
              label="Niveau maximum accepté pour un RDV en ligne"
              style={{ maxWidth: maxWidth / 5 }}
            >
              <Dropdown
                disabled={options.reservation.autorisationMin === 4}
                error={
                  options.reservation.autorisationMin !== 4 &&
                  options.reservation.autorisationMin >
                    options.reservation.autorisationMax
                }
                fluid={false}
                selection={true}
                options={[
                  {
                    text: "Niveau d'autorisation 0",
                    value: 0
                  },
                  {
                    text: "Niveau d'autorisation 1",
                    value: 1
                  },
                  {
                    text: "Niveau d'autorisation 2",
                    value: 2
                  },
                  {
                    text: "Niveau d'autorisation 3",
                    value: 3
                  }
                ]}
                value={options.reservation.autorisationMax}
                onChange={(e, d) => {
                  options.reservation.autorisationMax = d.value;
                  plannings[index].optionsJO = options;
                  this.setState({ saved: false /*, plannings: plannings*/ });
                }}
              />
            </Form.Input>
          </Form.Group>
          <Form.Group>
            <Form.Input
              label="Niveau d'autorisation minimum des motifs proposés pour la prise de RDV depuis l'agenda"
              style={{ maxWidth: maxWidth / 5 }}
            >
              <Dropdown
                fluid={false}
                selection={true}
                options={[
                  {
                    text: "Niveau d'autorisation 0",
                    value: 0
                  },
                  {
                    text: "Niveau d'autorisation 1",
                    value: 1
                  },
                  {
                    text: "Niveau d'autorisation 2",
                    value: 2
                  },
                  {
                    text: "Niveau d'autorisation 3",
                    value: 3
                  },
                  {
                    text: "Niveau d'autorisation 4",
                    value: 4
                  }
                ]}
                value={options.reservation.autorisationMinAgenda}
                onChange={(e, d) => {
                  options.reservation.autorisationMinAgenda = d.value;
                  plannings[index].optionsJO = options;
                  this.setState({ saved: false /*, plannings: plannings*/ });
                }}
              />
            </Form.Input>
          </Form.Group>
          <Form.Input label="Plages horaires ouvertes par niveau d'autorisation">
            <Accordion.Accordion>
              {_.map(horairesReservation, (horaireReservation, i) => {
                return (
                  <React.Fragment key={i}>
                    <Accordion.Title
                      active={this.state.reservationActiveIndex === i}
                      index={i}
                      onClick={(e, d) =>
                        this.setState({
                          reservationActiveIndex:
                            this.state.reservationActiveIndex === d.index
                              ? -1
                              : d.index
                        })
                      }
                      icon="dropdown"
                      content={"Niveau d'autorisation " + i}
                    />

                    <Accordion.Content
                      active={this.state.reservationActiveIndex === i}
                    >
                      <HorairesSemaine
                        horaires={horaireReservation}
                        onHorairesChange={this.onHorairesReservationChange}
                      />
                    </Accordion.Content>
                  </React.Fragment>
                );
              })}
            </Accordion.Accordion>
          </Form.Input>
        </React.Fragment>
      );

      const MotifsRDV = (
        <React.Fragment>
          <Table basic={true}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Motif</Table.HeaderCell>
                <Table.HeaderCell collapsing={true}>
                  Niveau d'autorisation minimum requis
                </Table.HeaderCell>
                <Table.HeaderCell collapsing={true}>
                  Durée par défaut (en mn)
                </Table.HeaderCell>
                <Table.HeaderCell>Couleur</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {_.map(options.reservation.motifs, (motif, i) => {
                if (!_.isEmpty(motif) && !motif.hidden)
                  return (
                    <Table.Row key={i}>
                      <Table.Cell>
                        <Form.Input
                          type="text"
                          value={motif.motif}
                          onChange={(e, d) => {
                            options.reservation.motifs[i].motif = d.value;
                            this.setState({ saved: false });
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown
                          fluid={true}
                          selection={true}
                          options={[
                            {
                              text: "Niveau d'autorisation 0",
                              value: 0
                            },
                            {
                              text: "Niveau d'autorisation 1",
                              value: 1
                            },
                            {
                              text: "Niveau d'autorisation 2",
                              value: 2
                            },
                            {
                              text: "Niveau d'autorisation 3",
                              value: 3
                            },
                            {
                              text: "RDV en ligne désactivés (4)",
                              value: 4
                            }
                          ]}
                          value={motif.autorisationMin}
                          onChange={(e, d) => {
                            options.reservation.motifs[i].autorisationMin =
                              d.value;
                            this.setState({ saved: false });
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Form.Input
                          style={{ maxWidth: maxWidth / 5 }}
                          type="number"
                          value={motif.duree}
                          onChange={(e, d) => {
                            options.reservation.motifs[i].duree = _.toNumber(
                              d.value
                            );
                            this.setState({ saved: false });
                          }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Form.Input>
                          <ColorPicker
                            color={motif.couleur}
                            onChange={color => {
                              options.reservation.motifs[i].couleur = color;
                              this.setState({ saved: false });
                            }}
                          />
                        </Form.Input>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="tiny"
                          icon="minus"
                          circular={true}
                          onClick={() => {
                            // never remove : hide only
                            // options.reservation.motifs.splice(i, 1);
                            options.reservation.motifs[i].hidden = true;
                            this.setState({ saved: false });
                          }}
                        />
                      </Table.Cell>
                    </Table.Row>
                  );
              })}
            </Table.Body>
          </Table>
          <Button
            size="tiny"
            icon="add"
            circular={true}
            onClick={() => {
              options.reservation.motifs.push({
                motif: "Nouveau motif",
                autorisationMin: 4,
                duree: options.plages.duree,
                couleur: "#4A90E2"
              });
              this.setState({ saved: false });
            }}
          />
        </React.Fragment>
      );

      const reservationsPanels = [
        {
          title: "Congés",
          content: {
            content: (
              <React.Fragment>
                <Form.Input
                  label="Les jours fériés légaux sont pris en compte automatiquement"
                  style={{ maxWidth: maxWidth / 10 }}
                >
                  <Checkbox
                    checked={options.reservation.congesFeries}
                    onChange={(e, d) => {
                      options.reservation.congesFeries = d.checked;
                      plannings[index].optionsJO = options;
                      this.setState({ /*plannings: plannings*/ saved: false });
                    }}
                  />
                </Form.Input>
                <Form.Group>
                  <Form.Input
                    label="Les périodes de congés sont affichées sur l'agenda"
                    style={{ maxWidth: maxWidth / 10 }}
                  >
                    <Checkbox
                      checked={options.reservation.congesVisibles}
                      onChange={(e, d) => {
                        options.reservation.congesVisibles = d.checked;
                        plannings[index].optionsJO = options;
                        this.setState({
                          /*plannings: plannings*/ saved: false
                        });
                      }}
                    />
                  </Form.Input>
                  <Form.Input label="avec la couleur">
                    <ColorPicker
                      color={options.reservation.congesCouleur}
                      onChange={color => {
                        options.reservation.congesCouleur = color;
                        plannings[index].optionsJO = options;
                        this.setState({
                          /*plannings: plannings*/ saved: false
                        });
                      }}
                    />
                  </Form.Input>
                </Form.Group>
                <Popup
                  trigger={
                    <Form.Group>
                      <Header size="tiny">Liste des congés&nbsp;</Header>
                      <Icon name="help circle" />
                    </Form.Group>
                  }
                  inverted={true}
                >
                  Chaque période est définie par des dates de début et de fin
                  (de manière inclusive).<br />
                  L'intitulé de la période sera repris sur l'agenda, si l'option
                  d'affichage ci-dessus est cochée.<br />
                  Les périodes ainsi définies seront exclues lors d'une prise de
                  rendez-vous en ligne.<br />
                  Les jours fériés légaux, peuvent être pris en compte
                  automatiquement (cocher ci-dessus l'option correspondante).<br />
                  Les périodes passées les plus anciennes pourront être
                  supprimées.
                </Popup>

                <Conges
                  plagesConges={congesPrevus}
                  onChange={() => this.setState({ saved: false })}
                />
              </React.Fragment>
            ),
            key: "0"
          }
        },
        {
          title: "Niveaux d'autorisation",
          content: { content: HorairesReserves, key: "1" }
        },
        {
          title: "Motifs des rendez-vous",
          content: { content: MotifsRDV, key: "2" }
        }
      ];

      const Reservations = (
        <React.Fragment>
          <Form.Group>
            <Form.Input
              label="Délai maximum pour un RDV (en jours)"
              style={{ maxWidth: maxWidth / 5 }}
              placeholder="Délai maximum"
              value={options.reservation.delaiMax}
              type="number"
              onChange={(e, d) => {
                plannings[index].optionsJO.reservation.delaiMax = _.toNumber(
                  d.value
                );
                this.setState({ /*plannings: plannings,*/ saved: false });
              }}
            />
            <Form.Input
              label="Délai de prévenance pour annuler un RDV (en heures)"
              style={{ maxWidth: maxWidth / 5 }}
              placeholder="Délai de prévenance"
              value={options.reservation.delaiPrevenance}
              type="number"
              onChange={(e, d) => {
                plannings[
                  index
                ].optionsJO.reservation.delaiPrevenance = _.toNumber(d.value);
                this.setState({ /*plannings: plannings,*/ saved: false });
              }}
            />
          </Form.Group>
          <Form.Group>
            <Form.Input
              label="Format pour la dénomination des patients"
              style={{ maxWidth: maxWidth / 5 }}
            >
              <Dropdown
                fluid={false}
                selection={true}
                options={[
                  {
                    text: "NOM + PRÉNOM",
                    value: "NP"
                  },
                  {
                    text: "NOM + Prénom",
                    value: "Np"
                  },
                  {
                    text: "Nom + Prénom",
                    value: "np"
                  },
                  {
                    text: "PRÉNOM + NOM",
                    value: "PN"
                  },
                  {
                    text: "Prénom + NOM",
                    value: "pN"
                  },
                  {
                    text: "Prénom + Nom",
                    value: "pn"
                  }
                ]}
                value={options.reservation.denominationFormat}
                onChange={(e, d) => {
                  plannings[index].optionsJO.reservation.denominationFormat =
                    d.value;
                  this.setState({ saved: false /*, plannings: plannings */ });
                }}
              />
            </Form.Input>
            <Form.Input
              label="Dénomination par défaut (si patient non identifié)"
              placeholder="Dénomination par défaut"
              value={options.reservation.denominationDefaut}
              onChange={(e, d) => {
                plannings[index].optionsJO.reservation.denominationDefaut =
                  d.value;
                this.setState({ saved: false /*, plannings: plannings*/ });
              }}
            />
          </Form.Group>
          <Accordion.Accordion panels={reservationsPanels} />
        </React.Fragment>
      );

      const Acl = (
        <React.Fragment>
          <Form.Group widths={2}>
            <Form.Input
              label="Propriétaires"
              placeholder="Identifiants séparés par des espaces"
              value={options.acl.owners.join(" ")}
              onChange={(e, d) => {
                options.acl.owners = d.value.split(" ");
                this.setState({ /* plannings: plannings, */ saved: false });
              }}
            />
          </Form.Group>
          <Form.Group widths={2}>
            <Form.Input
              error={
                _.isString(options.acl.transfer) &&
                options.acl.transfer !== "" &&
                !saved
              }
              loading={
                _.isString(options.acl.transfer) &&
                options.acl.transfer !== "" &&
                saved
              }
              label="Transfert des droits administrateur"
              placeholder="Utilisateur vers lequel transférer les droits"
              value={
                _.isString(options.acl.transfer) ? options.acl.transfer : ""
              }
              onChange={(e, d) => {
                options.acl.transfer = d.value;
                this.setState({ /*plannings: plannings,*/ saved: false });
              }}
            />
          </Form.Group>
        </React.Fragment>
      );

      const rootPanels = [
        {
          title: "Utilisateurs et droits d'accès",
          content: { content: Acl, key: "1" }
        },
        {
          title: "Plages horaires d'ouverture",
          content: { content: Plages, key: "2" }
        },
        {
          title: "Prise de rendez-vous",
          content: { content: Reservations, key: "3" }
        }
      ];

      form = (
        <React.Fragment>
          <Divider hidden={true} />
          <Form size={fsize}>
            <Form.Group widths={2}>
              <Form.Input
                label="Titre"
                placeholder="Titre du planning / Nom du praticien / Nom de la ressource"
                value={planning.titre}
                onChange={(e, d) => {
                  plannings[index].titre = d.value;
                  this.setState({ /* plannings: plannings, */ saved: false });
                }}
              />
              <Form.Input
                label="Description"
                placeholder="Description du planning"
                value={planning.description}
                onChange={(e, d) => {
                  plannings[index].description = d.value;
                  this.setState({ /*plannings: plannings,*/ saved: false });
                }}
              />
              <Form.Input label="Couleur">
                <ColorPicker
                  color={planning.couleur}
                  onChange={color => {
                    plannings[index].couleur = color;
                    this.setState({ /*plannings: plannings,*/ saved: false });
                  }}
                />
              </Form.Input>
            </Form.Group>
            <Accordion
              defaultActiveIndex={-1}
              panels={rootPanels}
              styled={true}
              fluid={true}
            />
            <Divider hidden={true} />
            <Button negative={true} onClick={this.supprimer}>
              Supprimer
            </Button>
            <Button onClick={this.ajouter}>Nouveau</Button>
            <Button
              onClick={() => {
                if (
                  _.isString(options.acl.transfer) &&
                  options.acl.transfer !== "" &&
                  !saved
                ) {
                  this.save();
                } else {
                  this.transferer();
                }
              }}
            >
              Transférer
            </Button>
            <Button onClick={this.dupliquer}>Dupliquer</Button>
            <Button onClick={this.defaults}>Valeurs par défaut</Button>
            <Button onClick={this.cancel}>Annuler / Actualiser</Button>
            <Button primary={!saved} onClick={this.save}>
              Sauvegarder
            </Button>
          </Form>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <Header size={hsize}>Configuration</Header>
        {saved ? (
          <Message
            header={
              plannings.length +
              " planning" +
              (plannings.length > 1 ? "s" : "") +
              " à configurer"
            }
            content="Chaque planning correspond à une ressource humaine ou matérielle distincte"
          />
        ) : (
          <Message
            warning={true}
            header="Modifications non sauvegardées"
            content={
              "Les dernières modifications effectuées ne sont pas sauvegardées. Vous pouvez annuler pour revenir à la version précédente."
            }
          />
        )}

        {plannings.length ? (
          <React.Fragment>
            <Dropdown
              value={index}
              onChange={(e, d) => this.setState({ index: d.value })}
              placeholder="Choisir le planning à configurer"
              fluid={false}
              selection={true}
              options={_.map(plannings, (planning, i) => {
                return {
                  text: planning.titre,
                  value: i
                };
              })}
            />
            <b>
              {this.state.index >= 0
                ? " #" + this.state.plannings[this.state.index].id
                : ""}
            </b>
            {form}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button onClick={this.ajouter}>Créer un nouveau planning</Button>
            <Button onClick={this.transferer}>Transférer un planning</Button>
          </React.Fragment>
        )}

        <Confirm
          open={
            _.isString(this.state.confirmationMessage) &&
            _.isFunction(this.state.confirmationAction)
          }
          cancelButton="Annuler"
          header="Confirmation"
          content={this.state.confirmationMessage}
          onCancel={() =>
            this.setState({
              confirmationMessage: null,
              confirmationAction: null
            })
          }
          onConfirm={() => {
            this.state.confirmationAction();
            this.setState({
              confirmationMessage: null,
              confirmationAction: null
            });
          }}
        />
        <Portal
          open={_.isString(this.state.messageOkAction)}
          closeOnTriggerClick={true}
          closeOnEscape={true}
          onClose={() => this.setState({ messageOkAction: null })}
        >
          <Message
            success={true}
            icon="checkmark"
            header="OK"
            content={this.state.messageOkAction}
          />
        </Portal>

        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
