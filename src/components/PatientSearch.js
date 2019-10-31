//import _ from 'lodash'
import React from "react";
import ReactDOM from "react-dom";

import _ from "lodash";

import { Search } from "semantic-ui-react";

export default class PatientSearch extends React.Component {
  state = {
    isLoading: false,
    results: [],
    value: ""
  };

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

  // TODO : Corriger le bug d'après la suppression
  // Après la suppression il est impossible de re-saisir quelque chose dans l'input
  // Tester ça dans ProfilsPatients
  static getDerivedStateFromProps(props, state) {
    if (props.clear) {
      return {
        isLoading: false,
        results: [],
        value: ""
      };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.clear) {
      ReactDOM.findDOMNode(this)
        .getElementsByTagName("input")[0]
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
        value,
        edited: false // new
      });
      this.props.patientChange(0, "");
      return;
    }

    if (_.isFunction(this.props.onTextChange)) {
      this.props.onTextChange(value);
    }

    this.setState({ isLoading: true, value, edited: true });

    this.props.client.Patients.completion(
      {
        texte: value,
        format: this.props.format,
        limit: 100
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
          prev = patient.completion;
          var result = {
            id: patient.id,
            title: title,
            description: _.isEmpty(patient.naissance)
              ? ""
              : new Date(patient.naissance.split("T")[0]).toLocaleDateString(
                  "fr-FR"
                )
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

  render() {
    const { isLoading, value, results } = this.state;
    return (
      <Search
        size="small"
        fluid={true}
        loading={isLoading}
        onResultSelect={this.handleResultSelect}
        onSearchChange={this.handleSearchChange}
        results={results}
        placeholder="Recherche d'un patient..."
        showNoResults={false}
        value={value}
        style={{
          minWidth: this.props.minWidth ? this.props.minWidth : 0,
          maxWidth: this.props.maxWidth ? this.props.maxWidth : 9999
        }}
      />
    );
  }
}
