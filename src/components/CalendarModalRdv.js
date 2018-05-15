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

import { maxWidth /*, hsize, fsize*/ } from "./Settings";

import PatientSearch from "./PatientSearch";

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

export default class CalendarModalRdv extends React.Component {
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
          //console.log(rdv);
          this.imageLoad(rdv.idPatient);
          this.setState({ rdv: rdv });
        },
        () => {}
      );
    }

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
          {_.isEmpty(this.state.image) ? (
            <Icon name="user" size="massive" />
          ) : (
            <Image src={this.state.image} centered={true} />
          )}
          <Form>
            {this.props.isExternal ? (
              ""
            ) : (
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
            )}
            {motifId < 0 ? (
              <Form.Input label="Motif du RDV pris en ligne">
                <p>{motifs[-motifId - 1].motif}</p>
              </Form.Input>
            ) : (
              <Form.Input label="Motif du RDV">
                <Dropdown
                  style={{ minWidth: maxWidth, maxWidth: maxWidth }}
                  //fluid={true}
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
              </Form.Input>
            )}
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
