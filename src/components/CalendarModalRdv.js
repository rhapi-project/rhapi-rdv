//import _ from 'lodash'
import React from "react";
import ReactDOM from "react-dom";

import _ from "lodash";

import {
  Button,
  Header,
  Modal,
  Image,
  Search,
  Segment,
  Form,
  Label
} from "semantic-ui-react";

import TimeField from "react-simple-timefield";

import moment from "moment";

import { maxWidth, hsize, fsize } from "./Settings";

export class PatientSearch extends React.Component {
  componentWillMount() {
    this.setState({ isLoading: false, results: [], value: "" });
  }

  componentDidMount() {
    if (this.state.value === "") {
      ReactDOM.findDOMNode(this)
        .getElementsByTagName("input")[0]
        .focus();
    } else {
      ReactDOM.findDOMNode(this)
        .getElementsByTagName("button")[0]
        .focus();
    }
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ value: result.title });
    this.props.patientChange(result.id, result.title);
  };

  handleSearchChange = (e, { value }) => {
    if (value === "") {
      this.setState({
        isLoading: false,
        results: [],
        value
      });
      this.props.patientChange(0, "");
      return;
    }
    this.setState({ isLoading: true, value });

    this.props.client.Patients.completion(
      {
        texte: value,
        format: this.props.format,
        limit: 10
      },
      patients => {
        const results = [];

        // refact results
        let prev, dupsCount;
        _.forEach(patients, patient => {
          let title = patient.completion;
          if (title === prev) {
            title += ` (${++dupsCount})`;
          } else {
            dupsCount = 1;
          }
          prev = title;
          var result = {
            id: patient.id,
            title: title,
            description: _.isEmpty(patient.naissance)
              ? ""
              : new Date(patient.naissance).toLocaleDateString("fr-FR")
            /*image: faker.internet.avatar()*/
          };
          results.push(result);
        });

        this.setState({
          isLoading: false,
          results: results
        });
      },
      () => {} // error
    );
  };

  searchClear = () => {
    this.setState({ isLoading: false, results: [], value: "" });
    this.props.patientsChange(0, "");
    ReactDOM.findDOMNode(this)
      .getElementsByTagName("input")[0]
      .focus();
  };

  render() {
    const { isLoading, value, results } = this.state;

    return (
      <Search
        size="large"
        fluid={true}
        loading={isLoading}
        onResultSelect={this.handleResultSelect}
        onSearchChange={this.handleSearchChange}
        results={results}
        placeholder="Recherche d'un patient..."
        showNoResults={false}
        value={value}
      />
    );
  }
}

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
  }

  reload = next => {
    const event = next.event;

    const isNewOne = _.isUndefined(event.title);

    let rdv = {};
    if (isNewOne) {
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
        {},
        rdv => {
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
    if (this.state.isNewOne) {
      this.props.client.RendezVous.create(
        this.state.rdv,
        () => {
          this.close();
        },
        () => {
          //console.log("erreur")
          this.close();
        }
      );
    } else {
      this.props.client.RendezVous.update(
        this.state.rdv.id,
        this.state.rdv,
        () => {
          this.close();
        },
        () => {
          //console.log("erreur")
          this.close();
        }
      );
    }
  };

  handleRemove = () => {
    if (!this.state.isNewOne) {
      this.props.client.RendezVous.destroy(
        this.props.event.id,
        () => this.close(),
        () => this.close()
      );
    } else {
      this.close();
    }
  };

  patientChange = (id, title) => {
    let rdv = this.state.rdv;
    rdv.idPatient = id;
    rdv.titre = title;
    rdv.idPlanningsJA = [this.props.planning];
    this.setState({ rdv: rdv });
  };

  render() {
    if (!this.props.open) {
      return "";
    }

    let rdv = this.state.rdv;

    if (!this.props.isExternal && _.isUndefined(rdv.startAt)) {
      return "";
    }

    return (
      <Modal size="large" open={this.props.open}>
        <Segment clearing={true}>
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
          <Image wrapped={true} size="medium" src="images/patient.png" />
          <Form>
            {this.props.isExternal ? (
              ""
            ) : (
              <FromTo
                hfrom={rdv.startAt.split("T")[1]}
                hto={rdv.endAt.split("T")[1]}
                handleChange={(hfrom, hto) => {
                  rdv.startAt = rdv.startAt.split("T")[0] + "T" + hfrom;
                  rdv.endAt = rdv.endAt.split("T")[0] + "T" + hto;
                  this.setState({ rdv: rdv });
                }}
              />
            )}
            {// TODO corriger la doc idObjet correspond à un motif commun à tous les plannings partagé par ce RDV ??
            rdv.idObjet < 0 ? (
              <Label
                //circular={true}
                style={{
                  background: this.props.options.reservation.motifs[
                    -rdv.idObjet - 1
                  ].couleur
                }}
                content={
                  "Rendez-pris en ligne. Motif : " +
                  this.props.options.reservation.motifs[-rdv.idObjet - 1].motif
                }
              />
            ) : (
              "Rendez-vous pris depuis cet agenda"
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button negative={true} onClick={this.handleRemove}>
            {this.state.isNewOne ? "Annuler" : "Supprimer"}
          </Button>
          <Button primary={true} onClick={this.handleOk}>
            OK
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}
