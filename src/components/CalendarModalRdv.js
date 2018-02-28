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
  Form
} from "semantic-ui-react";

import moment from "moment";
//import { maxWidth, hsize, fsize } from "./Settings";

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
      return;
    }
    this.setState({ isLoading: true, value });

    this.props.client.Patients.completion(
      {
        texte: value,
        format: "np",
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

export default class CalendarModalRdv extends React.Component {
  componentWillMount() {
    this.reload(this.props);
  }

  componentWillReceiveProps(next) {
    this.reload(next);
  }

  reload = next => {
    const event = next.event;
    //if (_.isEmpty(event)) {
    //    return;
    //}
    const isNewOne = _.isUndefined(event.title);

    let rdv = {};
    if (isNewOne) {
      rdv.startAt = _.isUndefined(next.selectStart)
        ? ""
        : next.selectStart.format();
      rdv.endAt = _.isUndefined(next.selectEnd)
        ? rdv.startAt
        : next.selectEnd.format();
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

  handleOk = () => {
    if (this.state.isNewOne) {
      this.props.client.RendezVous.create(
        this.state.rdv,
        () => {
          this.props.close();
        },
        () => {
          //console.log("erreur")
          this.props.close();
        }
      );
    } else {
      this.props.close();
    }
  };

  handleRemove = () => {
    if (!this.state.isNewOne) {
      this.props.client.RendezVous.destroy(
        this.props.event.id,
        () => this.props.close(),
        () => this.props.close()
      );
    } else {
      this.props.close();
    }
  };

  patientChange = (id, title) => {
    let rdv = this.state.rdv;
    rdv.idPatient = id;
    rdv.titre = title;
    rdv.idPlanningsJA = [this.props.planning];
    rdv.startAt = this.props.selectStart;
    rdv.endAt = this.props.selectEnd;
    this.setState({ rdv: rdv });
  };

  render() {
    if (!this.props.open) {
      return "";
    }

    if (!this.props.isExternal && _.isUndefined(this.state.rdv.startAt)) {
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
            {this.props.isExternal
              ? ""
              : "de " +
                moment(this.state.rdv.startAt).format("HH:mm") +
                " à " +
                moment(this.state.rdv.endAt).format("HH:mm")}
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
