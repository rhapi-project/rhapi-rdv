//import _ from 'lodash'
import React from "react";
import ReactDOM from "react-dom";

import _ from "lodash";

import { Search } from "semantic-ui-react";

export default class PatientSearch extends React.Component {
  componentWillMount() {
    this.setState({ isLoading: false, results: [], value: "" });
  }

  componentWillReceiveProps(next) {
    if (next.clear) {
      this.setState({ isLoading: false, results: [], value: "" });
      ReactDOM.findDOMNode(this)
        .getElementsByTagName("input")[0]
        .focus();
    }
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
