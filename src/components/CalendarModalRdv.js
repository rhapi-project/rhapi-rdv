import React from "react";

import _ from "lodash";

import {
  Button,
  Header,
  Modal,
  Icon,
  Image,
  Segment,
  Form,
  Label,
  Dropdown,
  Ref
} from "semantic-ui-react";

import TimeField from "react-simple-timefield";

import moment from "moment";

import { imageSize, maxWidth /*, hsize, fsize*/ } from "./Settings";

import PatientSearch from "./PatientSearch";

import ColorPicker from "./ColorPicker";

class FromTo extends React.Component {
  componentWillMount() {
    this.setState({ hfrom: this.props.hfrom, hto: this.props.hto });
  }

  componentWillReceiveProps(next) {
    this.setState({ hfrom: next.hfrom, hto: next.hto });
  }

  handleChange = (value, name) => {
    let { hfrom, hto } = this.state;

    if (name === "hfrom") {
      hfrom = value;
    }

    if (name === "hto") {
      hto = value;
    }
    this.props.handleChange(hfrom, hto);
  };

  render() {
    let { hfrom, hto } = this.state;

    return (
      <div>
        <Label size="large" style={{ marginTop: 5 }} content="De" />
        <TimeField
          value={hfrom} // {String}   required, format '00:00' or '00:00:00'
          onChange={value => this.handleChange(value, "hfrom")}
          input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
        <Label size="large" style={{ marginTop: 5 }} content="à" />
        <TimeField
          value={hto} // {String}   required, format '00:00' or '00:00:00'
          onChange={value => this.handleChange(value, "hto")}
          //input={<input type="text" />}
          //colon=":" // {String}   default: ":"
          //showSeconds={false} // {Boolean}  default: false
          style={{ minWidth: maxWidth / 5, maxWidth: maxWidth / 5 }}
        />
      </div>
    );
  }
}

/*
 * Travailler sur la gestion des motifs et le changement des plannings dans la modal
 *
 */

export default class CalendarModalRdv extends React.Component {
  //plannings = [];

  componentWillMount() {
    this.reload(this.props);
  }

  componentWillReceiveProps(next) {
    if (next.open) {
      this.reload(next);
    }
    this.setState({ image: "" });
  }

  imageLoad = idPatient => {
    this.props.client.Patients.read(
      idPatient,
      {},
      patient => {
        // success
        this.setState({ image: patient.profilJO.base64 });
      },
      data => {
        // error
        console.log("Error lecture patient");
        this.setState({ image: "" });
      }
    );
  };

  reload = next => {
    const event = next.event;

    const isNewOne = _.isUndefined(event.title);

    let rdv = {};
    if (isNewOne) {
      rdv = { planningJO: { id: this.props.planning } };
      if (next.isExternal) {
        rdv.startAt = event.startAt;
        rdv.endAt = event.endAt;
      } else {
        rdv.startAt = _.isUndefined(next.selectStart)
          ? ""
          : next.selectStart.toISOString();
        rdv.endAt = _.isUndefined(next.selectEnd)
          ? rdv.startAt
          : next.selectEnd.toISOString();
      }
    } else {
      // (re)lire le rdv depuis le client
      this.props.client.RendezVous.read(
        event.id,
        { planning: this.props.planning },
        rdv => {
          console.log(rdv);
          this.imageLoad(rdv.idPatient);
          this.setState({ rdv: rdv });
        },
        () => {}
      );
    }
    this.planningsSelect();
    this.setState({ isNewOne: isNewOne, rdv: rdv });
  };

  close = () => {
    this.props.close();
  };

  handleOk = () => {
    let pushToExternal = id => {
      this.props.client.RendezVous.listeAction(
        id,
        {
          action: "push",
          planning: this.props.planning,
          liste: 1
        },
        () => this.close()
      );
    };

    let rdv = this.state.rdv;

    /*
    let motifId = rdv.planningJO.motif;
    
    if (motifId < 0) {
        rdv.couleur = this.props.options.reservation.motifs[
                   -motifId - 1
                  ].couleur
    }
    */

    if (this.state.isNewOne) {
      this.props.client.RendezVous.create(
        rdv,
        result => {
          if (this.props.isExternal) {
            pushToExternal(result.id);
          } else {
            this.close();
          }
        },
        () => this.close()
      );
    } else {
      this.props.client.RendezVous.update(
        rdv.id,
        rdv,
        () => this.close(),
        () => this.close()
      );
    }
  };

  handleRemove = () => {
    if (this.state.isNewOne) {
      this.close();
      return;
    }

    let destroy = () => {
      this.props.client.RendezVous.destroy(
        this.props.event.id,
        () => this.close(),
        () => this.close()
      );
    };

    if (this.props.isExternal) {
      this.props.client.RendezVous.listeAction(
        this.props.event.id,
        {
          action: "remove",
          planning: this.props.planning,
          liste: 1
        },
        () => destroy(),
        () => destroy()
      );
    } else {
      destroy();
    }
  };

  patientChange = (id, title) => {
    let rdv = this.state.rdv;
    rdv.idPatient = id;
    rdv.titre = title;
    this.setState({ rdv: rdv });
    this.imageLoad(rdv.idPatient);
  };

  planningsSelect = () => {
    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        // success
        let plannings = [];
        for (let i = 0; i < result.results.length; i++) {
          let pl = {};
          pl.text = result.results[i].titre;
          pl.value = i;
          plannings.push(pl);
        }
        this.setState({
          plannings: plannings,
          currentPlanning: this.props.planning - 1,
          rdvIsOnCurrentPlanning: true
        });
      },
      data => {
        // error
        console.log("Erreur chargement mesPlannings");
        console.log(data);
        this.setState({
          plannings: [],
          currentPlanning: -1,
          rdvIsOnCurrentPlanning: false
        });
      }
    );
  };

  onPlanningChange = (e, d) => {
    this.setState({ currentPlanning: d.value });
    if (this.rdvIsOnCurrentPlanning(d.value)) {
      this.setState({ rdvIsOnCurrentPlanning: true });
      // modification de plannigJO si le rdv existe sur ce planning
      let rdv = this.state.rdv;
      for (let i = 0; i < rdv.planningsJA.length; i++) {
        if (rdv.planningsJA[i].id === d.value + 1) {
          rdv.planningJO = rdv.planningsJA[i];
        }
      }
      this.setState({ rdv: rdv });
    } else {
      this.setState({ rdvIsOnCurrentPlanning: false });
    }
  };

  rdvIsOnCurrentPlanning = currentPlanning => {
    // le rendez-vous existe sur le planning courant
    let rdv = this.state.rdv;
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (rdv.planningsJA[i].id === currentPlanning + 1) {
        return true;
      }
    }
    return false;
  };

  addPlanning = currentPlanning => {
    let rdv = this.state.rdv;
    let newPlanning = {
      id: currentPlanning + 1,
      liste1: 0,
      liste2: 0,
      motif: -1
    };
    rdv.planningsJA.push(newPlanning);
    this.setState({ rdv: rdv, rdvIsOnCurrentPlanning: true });
  };

  removePlanning = currentPlanning => {
    let newPlanningsJA = [];
    let rdv = this.state.rdv;
    for (let i = 0; i < rdv.planningsJA.length; i++) {
      if (rdv.planningsJA[i].id !== currentPlanning + 1) {
        newPlanningsJA.push(rdv.planningsJA[i]);
      }
    }
    rdv.planningsJA = newPlanningsJA;
    console.log(rdv.planningsJA);
    this.setState({ rdv: rdv, rdvIsOnCurrentPlanning: false });
  };

  render() {
    if (!this.props.open) {
      return "";
    }

    let rdv = this.state.rdv;

    if (_.isUndefined(rdv.planningJO)) {
      return "";
    }

    let motifId = rdv.planningJO.motif;
    let motifs = this.props.options.reservation.motifs;

    let autorisationMinAgenda = this.props.options.reservation
      .autorisationMinAgenda;

    let couleur = "";
    if (motifId) {
      couleur = motifs[Math.abs(motifId) - 1].couleur;
    }

    if (!this.props.isExternal && _.isUndefined(rdv.startAt)) {
      return "";
    }
    //console.log(this.state.rdv.planningJO);
    //console.log(this.state.rdv.planningsJA);
    return (
      <Modal size="small" open={this.props.open}>
        <Segment clearing={true}>
          <Label circular={true} style={{ background: couleur }} />
          <Header size="large" floated="left">
            {this.state.isNewOne ? (
              <PatientSearch
                client={this.props.client}
                patientChange={this.patientChange}
                format={this.props.denominationFormat}
              />
            ) : (
              this.state.rdv.titre
            )}
          </Header>
          <Header size="large" floated="right">
            {this.props.isExternal
              ? "Rendez-vous en attente"
              : moment(this.state.rdv.startAt).format("LL")}
          </Header>
        </Segment>
        <Modal.Content image={true}>
          <Form>
            <Form.Group>
              {_.isEmpty(this.state.image) ? (
                <Icon name="user" size="massive" style={{ marginTop: "5%" }} />
              ) : (
                <Image
                  src={this.state.image}
                  width={imageSize.width}
                  height={imageSize.height}
                  alt="Photo de profil"
                  style={{
                    marginRight: "4%",
                    marginLeft: "5%",
                    marginTop: "5%"
                  }}
                />
              )}
              <div>
                {this.props.isExternal ? (
                  ""
                ) : (
                  <Form.Group>
                    <Form.Input label="Horaire">
                      <FromTo
                        hfrom={rdv.startAt.split("T")[1]}
                        hto={rdv.endAt.split("T")[1]}
                        handleChange={(hfrom, hto) => {
                          rdv.startAt = rdv.startAt.split("T")[0] + "T" + hfrom;
                          rdv.endAt = rdv.endAt.split("T")[0] + "T" + hto;
                          this.setState({ rdv: rdv });
                        }}
                      />
                    </Form.Input>
                    <Form.Input label="Couleur">
                      <ColorPicker
                        color={this.state.rdv.couleur}
                        onChange={color => {
                          let rdv = this.state.rdv;
                          rdv.couleur = color;
                          this.setState({ rdv: rdv });
                        }}
                      />
                      <Button
                        icon="remove"
                        onClick={() => {
                          let rdv = this.state.rdv;
                          rdv.couleur = "";
                          this.setState({ rdv: rdv });
                        }}
                      />
                    </Form.Input>
                    <Form.Input label="Origine" floated="right">
                      <span>
                        <strong>#masteruser</strong>
                        {/* il faut rentrer la bonne valeur... l'identifiant de la personne qui a ajouté le rdv*/}
                      </span>
                    </Form.Input>
                  </Form.Group>
                )}

                <Form.Group>
                  <Form.Dropdown
                    label="Plannings"
                    selection={true}
                    value={this.state.currentPlanning}
                    options={this.state.plannings}
                    onChange={this.onPlanningChange}
                  />

                  {this.props.planning !== this.state.currentPlanning + 1 ? (
                    <Form.Input label="RDV sur ce planning">
                      {this.state.rdvIsOnCurrentPlanning ? (
                        <Button
                          content="Supprimer"
                          onClick={() =>
                            this.removePlanning(this.state.currentPlanning)
                          }
                        />
                      ) : (
                        <Button
                          content="Ajouter"
                          onClick={() =>
                            this.addPlanning(this.state.currentPlanning)
                          }
                        />
                      )}
                    </Form.Input>
                  ) : (
                    ""
                  )}
                </Form.Group>

                {motifId < 0 ? (
                  <Form.Input label="Motif du RDV pris en ligne">
                    <p>{motifs[-motifId - 1].motif}</p>
                  </Form.Input>
                ) : (
                  <Form.Input label="Motif du RDV">
                    <Dropdown
                      style={{ minWidth: 450 /*, maxWidth: maxWidth*/ }}
                      fluid={true}
                      selection={true}
                      options={_.filter(
                        _.map(motifs, (motif, i) => {
                          return {
                            text: motif.motif,
                            value: i,
                            motif: motif
                          };
                        }),
                        (item, i) => {
                          return (
                            item.motif.autorisationMin >= autorisationMinAgenda
                          );
                        }
                      )}
                      value={rdv.planningJO.motif - 1}
                      onChange={(e, d) => {
                        rdv.planningJO.motif = d.value + 1;
                        this.setState({ rdv: rdv });
                      }}
                    />
                    <Button icon="remove" />
                  </Form.Input>
                )}
              </div>
            </Form.Group>
            <div
              style={{
                paddingLeft: "5%",
                minWidth: 600 /*, maxWidth: maxWidth*/
              }}
            >
              <Form.Group widths="equal">
                <Form.TextArea
                  label="Description"
                  placeholder="Description du rendez-vous"
                  value={this.state.rdv.description}
                  onChange={(e, d) => {
                    let rdv = this.state.rdv;
                    rdv.description = e.target.value;
                    this.setState({ rdv: rdv });
                  }}
                />
                <Form.TextArea
                  label="Commentaire"
                  placeholder="Ajouter un commentaire"
                  value={this.state.rdv.commentaire}
                  onChange={(e, d) => {
                    let rdv = this.state.rdv;
                    rdv.commentaire = e.target.value;
                    this.setState({ rdv: rdv });
                  }}
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button negative={true} onClick={this.handleRemove}>
            {this.state.isNewOne ? "Annuler" : "Supprimer"}
          </Button>
          <Ref innerRef={node => node.firstChild.parentElement.focus()}>
            <Button primary={true} onClick={this.handleOk}>
              OK
            </Button>
          </Ref>
        </Modal.Actions>
      </Modal>
    );
  }
}
