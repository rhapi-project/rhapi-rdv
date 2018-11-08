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
  Portal,
  Modal
} from "semantic-ui-react";

import { maxWidth, fsize, hsize, darkPopup, defaultPlanning } from "./Settings";

import HorairesSemaine from "./HorairesSemaine";
import Conges from "./Conges";
import Recurrents from "./Recurrents";
import ColorPicker from "./ColorPicker";
import IcalExport from "./IcalExport";
import IcalImport from "./IcalImport";

export default class Configuration extends React.Component {
  componentWillMount() {
    this.setState({
      plannings: [],
      index: -1,
      reservationActiveIndex: -1,
      saved: true, // current config saved
      save: false, // modal save configs
      load: false, // modal load configs
      modalIcalExport: false,
      modalIcalImport: false
    });

    this.reload(0);
  }

  reload = (index, id) => {
    if (_.isUndefined(index)) {
      index = this.state.index;
    }

    this.props.client.MonCompte.read(
      monProfil => {
        this.setState({
          organisation: monProfil.organisation
        });
      },
      data => {
        console.log("erreur");
        console.log(data);
      }
    );

    this.props.client.Plannings.mesPlannings(
      { admin: true },
      result => {
        // se placer sur le planning d'id id ?
        if (!_.isUndefined(id)) {
          let i = _.findIndex(result.results, { id: id });
          index = i < 0 ? index : i;
        } else {
          index = index < result.results.length ? index : -1;
        }
        this.setState({
          plannings: result.results,
          index: index,
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
    _.each(this.state.plannings, (planning, i) => {
      //
      planning.optionsJO.organisation = this.state.organisation;
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
        pl => {
          this.reload(this.state.plannings.length, pl.id);
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

  saveAll = () => {
    // Click sur la balise <a> dans firefox : a.click() -> ne fonctionne pas.
    // Mettre l'élément <a> dans le DOM pour résoudre ce problème
    // https://stackoverflow.com/questions/32225904/programmatical-click-on-a-tag-not-working-in-firefox
    let a = document.createElement("a");
    a.type = "hidden";
    let plannings = [...this.state.plannings];
    _.each(plannings, pl => {
      delete pl.lockRevision;
    });
    console.log(this.state.plannings);
    let file = new Blob(
      [
        JSON.stringify(plannings, null, 2) // pretty/2 spaces
      ],
      { type: "application/json" }
    );
    a.href = URL.createObjectURL(file);
    a.download = "config-plannings.json";
    document.body.appendChild(a); // "a" dans le DOM -> nécessaire sur Firefox
    a.click();
  };

  loadAll = onLoad => {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    //input.click(); // input.click() avant input.onchange -> sur Microsoft Edge la configuration n'est pas chargée
    input.onchange = () => {
      let file = input.files[0];
      var reader = new FileReader();
      let plannings = null;
      reader.onload = () => {
        try {
          plannings = JSON.parse(reader.result);
          if (
            !(
              _.isArray(plannings) &&
              plannings.length &&
              _.isNumber(plannings[0].id)
            )
          ) {
            // basic check fails
            plannings = null;
          }
        } catch (e) {}
        if (!plannings) {
          this.setState({ errorJson: true });
        }
        onLoad(plannings);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  loadAllAsBackup = () => {
    this.loadAll(plannings => {
      if (!plannings) {
        return;
      }
      this.setState({ plannings: plannings, saved: false });
    });
  };

  loadAllAsConfig = () => {
    let reindexPlannings = plannings => {
      this.props.client.Plannings.mesPlannings(
        { admin: true },
        result => {
          let reindexMap = {};
          let originalAcl = [];

          _.each(result.results, (pl, i) => {
            reindexMap["" + plannings[i].id] = pl.id;
            originalAcl.push(pl.optionsJO.acl);
          });

          _.each(plannings, (planning, p) => {
            planning.id = reindexMap["" + planning.id];

            // une acl correcte est définie lors du create planning
            // elle est replacée comme acl par défaut
            planning.optionsJO.acl = originalAcl[p];

            // organisation sera corrigée par save()
            planning.optionsJO.organisation = "";

            // ràz sms (textes de rappels etc...)
            planning.optionsJO.sms = defaultPlanning.optionsJO.sms;

            let reservation = planning.optionsJO.reservation;

            _.each(reservation.planningsAssocies, associe => {
              // reindexation des plannings associés
              associe.planning2 = reindexMap["" + associe.planning2];
            });

            _.each(reservation.motifs, (motif, i) => {
              // simplification des motifs masqués
              if (motif.hidden) {
                reservation.motifs[i] = { hidden: true };
              }
            });
          });
          this.setState({ plannings: plannings, saved: false, index: 0 });
        },
        datas => {
          console.log("erreur mesPlannings");
          console.log(datas);
        }
      );
    };

    let addPlannings = (plannings, n) => {
      if (n > 0) {
        this.props.client.Plannings.create(
          defaultPlanning,
          pl => {
            //plannings.push(pl);
            addPlannings(plannings, --n);
          },
          datas => {
            console.log("erreur sur addPlannings() :");
            console.log(datas);
          }
        );
      } else {
        reindexPlannings(plannings);
      }
    };

    let removePlannings = (plannings, n) => {
      if (n > 0) {
        this.props.client.Plannings.destroy(
          this.state.plannings[n - 1].id,
          () => {
            removePlannings(plannings, --n);
          },
          datas => {
            console.log("erreur sur removePlannings() :");
            console.log(datas);
          }
        );
      } else {
        reindexPlannings(plannings);
      }
    };

    this.loadAll(plannings => {
      if (!plannings) {
        return;
      }
      let delta = plannings.length - this.state.plannings.length;

      console.log(delta);

      if (delta > 0) {
        addPlannings(plannings, delta);
      } else if (delta < 0) {
        removePlannings(plannings, -delta);
      } else {
        // ---
        reindexPlannings(plannings);
      }
    });
  };

  modalIcalExportOpen = bool => {
    this.setState({ modalIcalExport: bool });
  };

  modalIcalImportOpen = bool => {
    this.setState({ modalIcalImport: bool });
  };

  render() {
    let { index, plannings, saved } = this.state;
    let form = "";
    let planning = {};

    if (index >= 0 && index < plannings.length) {
      planning = plannings[index];
      //console.log(planning.organisation);
      let options = planning.optionsJO;
      let horaires = options.plages.horaires;
      let horairesReservation = options.reservation.horaires;
      let congesPrevus = options.reservation.conges;

      if (_.isUndefined(options.reservation.planningsAssocies)) {
        // si ancienne version du Settings
        options.reservation.planningsAssocies = [];
      }
      let planningsAssocies = options.reservation.planningsAssocies;

      if (_.isUndefined(options.recurrents)) {
        // si ancienne version du Settings
        options.recurrents = [];
      }

      if (_.isUndefined(options.sms)) {
        options.sms = {
          rappel1: false,
          rappel24: false,
          rappel48: false,
          rappelTexte:
            "Nous vous rappelons votre RDV {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}",
          confirmationTexte:
            "RDV le {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}"
        };
      }

      if (_.isUndefined(options.sms.site)) {
        options.sms.site = window.location.origin + window.location.pathname;
      }

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
              label="Niveau d'autorisation minimum des motifs exposés aux menus l'agenda"
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
                      <Dropdown
                        style={{ floating: "right" }}
                        text={"Action pour le niveau d'autorisation " + i}
                        options={[
                          {
                            key: 1,
                            text:
                              "Supprimer toutes les plages horaires réservées",
                            value: -2
                          },
                          {
                            key: 2,
                            text:
                              "Reprendre toutes les plages horaires d'ouverture",
                            value: -1
                          },
                          {
                            key: 3,
                            text: "Reprendre les plages horaires du dimanche",
                            value: 0
                          },
                          {
                            key: 4,
                            text: "Reprendre les plages horaires du lundi",
                            value: 1
                          },
                          {
                            key: 5,
                            text: "Reprendre les plages horaires du mardi",
                            value: 2
                          },
                          {
                            key: 6,
                            text: "Reprendre les plages horaires du mercredi",
                            value: 3
                          },
                          {
                            key: 7,
                            text: "Reprendre les plages horaires du jeudi",
                            value: 4
                          },
                          {
                            key: 8,
                            text: "Reprendre les plages horaires du vendredi",
                            value: 5
                          },
                          {
                            key: 9,
                            text: "Reprendre les plages horaires du samedi",
                            value: 6
                          }
                        ]}
                        item={true}
                        onChange={(e, d) => {
                          if (d.value === -2) {
                            // aucune plage
                            horairesReservation[i] = [
                              [],
                              [],
                              [],
                              [],
                              [],
                              [],
                              []
                            ];
                          } else if (d.value === -1) {
                            // tous les horaires d'ouvertures
                            horairesReservation[i] = horaires;
                          } else {
                            // les horaires du jour d.value
                            horairesReservation[i][d.value] = horaires[d.value];
                          }
                          this.onHorairesReservationChange();
                        }}
                      />
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
                <Table.HeaderCell>
                  Niveau d'autorisation minimum requis
                </Table.HeaderCell>
                <Table.HeaderCell>Durée par défaut (en mn)</Table.HeaderCell>
                <Table.HeaderCell>Couleur</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {_.map(options.reservation.motifs, (motif, i) => {
                if (!motif.hidden)
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

      const PlanningsAssocies = (
        <React.Fragment>
          <Table basic={true}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Motif</Table.HeaderCell>
                <Table.HeaderCell>Planning associé</Table.HeaderCell>
                <Table.HeaderCell>
                  Motif dans le planning associé
                </Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {_.map(planningsAssocies, (associe, i) => {
                let index = _.findIndex(
                  plannings,
                  o => o.id === associe.planning2
                );
                let optionsMotifs =
                  index !== -1
                    ? _.filter(
                        _.map(
                          plannings[index].optionsJO.reservation.motifs,
                          (motif, i) => {
                            return {
                              text: motif.motif,
                              value: motif.hidden ? -1 : i
                            };
                          }
                        ),
                        o => o.value !== -1
                      )
                    : [];
                optionsMotifs.unshift({
                  value: -1,
                  text: "Aucun motif défini"
                });
                return (
                  <Table.Row key={i}>
                    <Table.Cell>
                      <Dropdown
                        value={associe.motif}
                        onChange={(e, d) => {
                          associe.motif = d.value;
                          this.setState({ saved: false });
                        }}
                        fluid={true}
                        selection={true}
                        options={_.filter(
                          _.map(options.reservation.motifs, (motif, i) => {
                            return {
                              text: motif.motif,
                              value: motif.hidden ? -1 : i
                            };
                          }),
                          o => o.value !== -1
                        )}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        value={associe.planning2}
                        onChange={(e, d) => {
                          associe.planning2 = d.value;
                          this.setState({ saved: false });
                        }}
                        fluid={true}
                        selection={true}
                        options={_.filter(
                          _.map(plannings, pl => {
                            return {
                              text: pl.titre,
                              value: pl.id === planning.id ? -1 : pl.id
                            };
                          }),
                          o => o.value !== -1
                        )}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        value={associe.motif2}
                        onChange={(e, d) => {
                          associe.motif2 = d.value;
                          this.setState({ saved: false });
                        }}
                        fluid={true}
                        selection={true}
                        options={optionsMotifs}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="tiny"
                        icon="minus"
                        circular={true}
                        onClick={() => {
                          planningsAssocies.splice(i, 1);
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
              planningsAssocies.push({
                motif: -1,
                planning2: -1,
                motif2: -1
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
                    toggle={true}
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
                      toggle={true}
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
                  inverted={darkPopup}
                >
                  Chaque période est définie par des dates de début et de fin
                  (de manière inclusive).
                  <br />
                  L'intitulé de la période sera repris sur l'agenda, si l'option
                  d'affichage ci-dessus est cochée.
                  <br />
                  Les périodes ainsi définies seront exclues lors d'une prise de
                  rendez-vous en ligne.
                  <br />
                  Les jours fériés légaux, peuvent être pris en compte
                  automatiquement (cocher ci-dessus l'option correspondante).
                  <br />
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
        },
        {
          title: "Plannings et motifs associés",
          content: { content: PlanningsAssocies, key: "3" }
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
              value={
                _.isUndefined(options.acl.owners)
                  ? ""
                  : options.acl.owners.join(" ")
              }
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
          <Form.Group widths={2}>
            <Form.Input
              label="Organisation @"
              value={this.state.organisation}
            />
          </Form.Group>
        </React.Fragment>
      );

      const SMS = (
        <React.Fragment>
          <Form.Group>
            <Form.Input
              label="Émettre des rappels par SMS"
              style={{ maxWidth: maxWidth / 10 }}
            >
              <Checkbox
                toggle={true}
                checked={
                  options.sms.rappel1 ||
                  options.sms.rappel24 ||
                  options.sms.rappel48
                }
                onChange={(e, d) => {
                  options.sms.rappel1 = d.checked;
                  options.sms.rappel24 = d.checked;
                  options.sms.rappel48 = d.checked;
                  plannings[index].optionsJO = options;
                  this.setState({ /*plannings: plannings*/ saved: false });
                }}
              />
            </Form.Input>
            <Form.Input
              label="48 heures avant le RDV"
              style={{ maxWidth: maxWidth / 10 }}
            >
              <Checkbox
                toggle={true}
                checked={options.sms.rappel48}
                onChange={(e, d) => {
                  options.sms.rappel48 = d.checked;
                  plannings[index].optionsJO = options;
                  this.setState({
                    /*plannings: plannings*/ saved: false
                  });
                }}
              />
            </Form.Input>
            <Form.Input
              label="24 heures avant le RDV"
              style={{ maxWidth: maxWidth / 10 }}
            >
              <Checkbox
                toggle={true}
                checked={options.sms.rappel24}
                onChange={(e, d) => {
                  options.sms.rappel24 = d.checked;
                  plannings[index].optionsJO = options;
                  this.setState({
                    /*plannings: plannings*/ saved: false
                  });
                }}
              />
            </Form.Input>
            <Form.Input
              label="1 heure avant le RDV"
              style={{ maxWidth: maxWidth / 10 }}
            >
              <Checkbox
                toggle={true}
                checked={options.sms.rappel1}
                onChange={(e, d) => {
                  options.sms.rappel1 = d.checked;
                  plannings[index].optionsJO = options;
                  this.setState({
                    /*plannings: plannings*/ saved: false
                  });
                }}
              />
            </Form.Input>
          </Form.Group>
          <Form.Group widths="equal">
            <Form.Input
              label="URL du site (lien présent sur les rappels)"
              value={options.sms.site}
              onChange={(e, d) => {
                options.sms.site = e.target.value;
                this.setState({
                  /*plannings: plannings*/ saved: false
                });
              }}
            />
            <Form.Input label="Reprendre l'URL de ce site">
              <Button
                style={{ marginTop: 7 }}
                size="tiny"
                icon="arrow left"
                circular={true}
                onClick={() => {
                  options.sms.site =
                    window.location.origin + window.location.pathname;
                  this.setState({
                    /*plannings: plannings*/ saved: false
                  });
                }}
              />
            </Form.Input>
          </Form.Group>
          <Form.Group widths="equal">
            <Form.TextArea
              style={{ resize: "none" }}
              label="Texte pour la confirmation initiale (e-mail et SMS)"
              value={options.sms.confirmationTexte}
              onChange={(e, d) => {
                options.sms.confirmationTexte = e.target.value;
                plannings[index].optionsJO = options;
                this.setState({
                  /*plannings: plannings*/ saved: false
                });
              }}
            />
            <Form.TextArea
              style={{ resize: "none" }}
              label="Texte pour les rappels (SMS)"
              value={options.sms.rappelTexte}
              onChange={(e, d) => {
                options.sms.rappelTexte = e.target.value;
                plannings[index].optionsJO = options;
                this.setState({
                  /*plannings: plannings*/ saved: false
                });
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
          title: "Évènement récurrents",
          content: {
            content: (
              <Recurrents
                recurrents={options.recurrents}
                onChange={() => this.setState({ saved: false })}
              />
            ),
            key: "3"
          }
        },
        {
          title: "Prise de rendez-vous",
          content: { content: Reservations, key: "4" }
        },
        {
          title: "Rappels",
          content: { content: SMS, key: "5" }
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
            <div style={{ paddingRight: "5px" }}>
              {/*Accordion right margin*/}
              <Accordion
                defaultActiveIndex={-1}
                panels={rootPanels}
                styled={true}
                fluid={true}
              />
            </div>
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
      <div
        id="configuration"
        className={window.qWebChannel ? "qwebchannel" : ""}
      >
        {window.qWebChannel ? "" : <Header size={hsize}>Configuration</Header>}
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
            <span>
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
              &nbsp;
              <Popup
                trigger={
                  <Dropdown
                    icon="recycle"
                    floating={true}
                    button={true}
                    basic={true}
                    className="icon"
                  >
                    <Dropdown.Menu>
                      <Dropdown.Header
                        icon="recycle"
                        content="Réutilisation des configurations"
                      />
                      <Dropdown.Item
                        onClick={() => this.setState({ save: true })}
                      >
                        {"Sauvegarder cette configuration de " +
                          plannings.length +
                          " planning" +
                          (plannings.length > 1 ? "s" : "")}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => this.setState({ load: true })}
                      >
                        {"Charger une configuration (remplacera ce" +
                          (plannings.length > 1 ? "s" : "") +
                          " " +
                          plannings.length +
                          " planning" +
                          (plannings.length > 1 ? "s" : "") +
                          ")"}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                }
                //header="Réutilisation des configurations"
                position="bottom left"
                //wide={true}
                inverted={darkPopup}
                size="small"
              >
                {/*<Popup.Header>Réutilisation des configurations</Popup.Header>*/}
                <Popup.Content>
                  Sauvegarder la configuration en cours ou charger une nouvelle
                  configuration
                </Popup.Content>
              </Popup>
              &nbsp;
              <Popup
                trigger={
                  <Dropdown
                    icon="exchange"
                    floating={true}
                    button={true}
                    basic={true}
                    className="icon"
                  >
                    <Dropdown.Menu>
                      <Dropdown.Header
                        icon="exchange"
                        content="Export / Import au format iCalendar (*.ics)"
                      />
                      <Dropdown.Item
                        onClick={() => this.modalIcalExportOpen(true)}
                      >
                        {"Exporter les rendez-vous inscrits sur le planning " +
                          planning.titre}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => this.modalIcalImportOpen(true)}
                      >
                        {"Importer des rendez-vous et les inscrire sur le planning " +
                          planning.titre}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                }
                content="Import/Export des rendez-vous au format iCalendar"
                position="bottom left"
                inverted={darkPopup}
                size="small"
              />
              &nbsp;&nbsp;
              <b>
                {this.state.index >= 0
                  ? " #" + this.state.plannings[this.state.index].id
                  : ""}
              </b>
            </span>
            {form}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button onClick={this.ajouter}>Créer un nouveau planning</Button>
            <Button onClick={this.transferer}>Transférer un planning</Button>
            <Button onClick={() => this.setState({ load: true })}>
              Importer une configuration
            </Button>
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
        <Modal
          open={this.state.errorJson}
          onClose={() => {
            this.setState({ errorJson: false });
          }}
          closeOnDimmerClick={false}
          header="Erreur en lecture du fichier"
          content="Le format de ce fichier de configuration n'est pas conforme à celui attendu !"
          actions={[{ key: "done", content: "OK", primary: true }]}
        />
        <Modal
          open={this.state.save}
          onClose={() => {
            this.setState({ save: false });
          }}
          header={
            "Sauvegarder cette configuration de " +
            plannings.length +
            " planning" +
            (plannings.length > 1 ? "s" : "")
          }
          content={
            "La configuration des plannings sera sauvegardée dans un fichier au format JSON, " +
            'nommé "config-plannings.json" et placé dans le dossier des téléchargements.\n'
          }
          actions={[
            { key: "done", content: "Annuler", primary: true },
            {
              key: "save",
              content: "Sauvegarder",
              onClick: this.saveAll
            }
          ]}
        />
        <Modal
          open={this.state.load}
          onClose={() => {
            this.setState({ load: false });
          }}
          header={
            "Restaurer une configuration (remplacera ce" +
            (plannings.length > 1 ? "s" : "") +
            " " +
            plannings.length +
            " planning" +
            (plannings.length > 1 ? "s" : "") +
            ")"
          }
          content={
            <Modal.Content>
              <p>
                <b>Pour restaurer un configuration</b> à partir d'une
                sauvegarde, cliquer sur le bouton{" "}
                <b>
                  <i>Restauration</i>
                </b>{" "}
                puis sélectionner le fichier de backup (par défaut{" "}
                <b>
                  <i>config-plannings.json</i>
                </b>
                ). Si ce fichier est conforme à la configuration courante, cette
                restauration préservera les différents états des rendez-vous
                déjà pris.
              </p>
              <p>
                <b>Pour configurer de nouveaux plannings</b>, cliquer sur le
                bouton{" "}
                <b>
                  <i>Nouvelle configuration</i>
                </b>{" "}
                puis sélectionner le fichier de configuration (par défaut{" "}
                <b>
                  <i>config-plannings.json</i>
                </b>
                ).{" "}
                <span style={{ background: "yellow" }}>
                  Cette restauration ne préservera pas les différents états des
                  rendez-vous déjà pris. Les textes personnalisables (comme les
                  rappels SMS...) seront remis à leur état initial et devront
                  être saisis à nouveau.
                </span>
              </p>
              <p>
                La restauration (ou nouvelle configuration) ne sera active que
                lorsque qu'elle sera définitivement validée (bouton{" "}
                <b>
                  <i>Sauvegarder</i>
                </b>{" "}
                en bas à droite). Tant que la configuration n'est pas
                sauvegardée, il est possible de revenir à la configuration
                précédente en cliquant sur le bouton{" "}
                <b>
                  <i>Annuler/Actualiser</i>
                </b>
                .
              </p>
            </Modal.Content>
          }
          actions={[
            { key: "done", content: "Annuler", primary: true },
            {
              key: "load-backup",
              content: "Restauration",
              onClick: this.loadAllAsBackup
            },
            {
              key: "load-config",
              content: "Nouvelle configuration",
              onClick: this.loadAllAsConfig
            }
          ]}
        />
        <Divider hidden={true} />

        {/* IcalExport */}
        <IcalExport
          client={this.props.client}
          open={this.state.modalIcalExport}
          modalIcalExportOpen={this.modalIcalExportOpen}
          planningId={
            _.isUndefined(this.state.plannings[this.state.index])
              ? -1
              : this.state.plannings[this.state.index].id
          }
          planningTitre={
            _.isUndefined(this.state.plannings[this.state.index])
              ? ""
              : this.state.plannings[this.state.index].titre
          }
        />

        {/* IcalImport */}
        <IcalImport
          client={this.props.client}
          open={this.state.modalIcalImport}
          modalIcalImportOpen={this.modalIcalImportOpen}
          planningId={
            _.isUndefined(this.state.plannings[this.state.index])
              ? -1
              : this.state.plannings[this.state.index].id
          }
          planningTitre={
            _.isUndefined(this.state.plannings[this.state.index])
              ? ""
              : this.state.plannings[this.state.index].titre
          }
          plannings={this.state.plannings}
        />
      </div>
    );
  }
}
