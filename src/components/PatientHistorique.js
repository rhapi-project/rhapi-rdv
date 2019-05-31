import React from "react";
import { Actes } from "rhapi-ui-react";
import { Divider } from "semantic-ui-react";

export default class PatientHistorique extends React.Component {
  componentWillMount() {
    this.setState({
      idPatient: 0
    });
  }

  onPatientChange = id => {
    this.setState({ idPatient: id });
  };

  onActeClick = (e, id) => {
    console.log(`onActeClick ${id}`);

    // client.Actes.destroy(
    //   id,
    //   result => {
    //     console.log(result);
    //   },
    //   error => {
    //     console.log(error);
    //   }
    // )
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
        <React.Fragment>
          <Divider hidden={true} />
          <Actes.Historique
            client={this.props.client}
            idPatient={this.props.idPatient}
            onHandleRow={this.onActeClick}
          />
        </React.Fragment>
      );
  }
}
