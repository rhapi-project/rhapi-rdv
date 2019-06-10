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

  onActeClick = id => {
    // l'id de l'acte en paramètre
    console.log(`onActeClick ${id}`);
  };

  onActeDoubleClick = id => {
    // l'id de l'acte en paramètre
    console.log(`onActeDoubleClick ${id}`);
  };

  onSelectionChange = ids => {
    // array des id des actes en paramètre
    let actes = ids.join(",");
    console.log(`onSelectionChange ${actes}`);
  };

  onActionTest = id => {
    // l'id de l'acte en paramètre
    console.log(`onActionTest ${id}`);
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
            onActeClick={this.onActeClick}
            onActeDoubleClick={this.onActeDoubleClick}
            onSelectionChange={this.onSelectionChange}
            actions={[
              {
                // Cette action sera ajoutée aux actions par défaut (Supprimer, Éditer)
                action: this.onActionTest,
                text: "Une action de test",
                icon: "code"
              }
            ]}
          />
        </React.Fragment>
      );
  }
}
