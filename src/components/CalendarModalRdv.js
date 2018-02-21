//import _ from 'lodash'
import React from "react";
import ReactDOM from "react-dom";

import _ from "lodash";

import { Button, Header, Modal, Image, Search } from "semantic-ui-react";

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
    const isNewOne = _.isUndefined(event.title);

    let rdv = {};
    if (isNewOne) {
      rdv.startAt = next.date;
    } else {
      // TODO : reload rendez-vous from client.RendezVous !!!!
      rdv.titre = next.event.title;
      rdv.startAt = event.start;
      rdv.endAt = event.end;
    }

    this.setState({ isNewOne: isNewOne, rdv: rdv });
  };

  handleClose = () => {
    if (this.state.isNewOne) {
      this.props.client.RendezVous.create(
        this.state.rdv,
        () => this.props.close(),
        () => alert("erreur")
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
    rdv.startAt = this.props.date;
    let end = new Date(rdv.startAt);
    console.log(end);
    end = new Date(end.getTime() + 30 * 60000); // + 30 mn
    console.log(end);
    rdv.endAt = end.toISOString();
    this.setState({ rdv: rdv });
  };

  render() {
    return (
      <Modal open={this.props.open}>
        <Modal.Header>
          {this.state.isNewOne ? (
            <PatientSearch
              client={this.props.client}
              patientChange={this.patientChange}
            />
          ) : (
            this.state.rdv.titre
          )}
        </Modal.Header>
        <Modal.Content image={true}>
          <Image wrapped={true} size="medium" src="images/patient.png" />
          <Modal.Description>
            <Header>Description du rendez-vous.....</Header>
            <p>
              Définition du rendez-vous (pour l'instant juste la date de début)
              {/*this.state.rdv.startAt*/}
            </p>
            <p>Is it okay to use this photo?</p>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleClose}>OK</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}
