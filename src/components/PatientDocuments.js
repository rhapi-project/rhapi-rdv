import React from "react";
import { Documents } from "rhapi-ui-react";
import { Menu } from "semantic-ui-react";

export default class PatientDocuments extends React.Component {
  state = {
    indexTab: 0
  };

  handleChangeTab = index => {
    this.setState({ indexTab: index });
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
        <React.Fragment>
          <Menu pointing={true} secondary={true}>
            <Menu.Item
              name="ARCHIVES"
              active={this.state.indexTab === 0}
              onClick={() => {
                if (this.state.indexTab !== 0) {
                  this.handleChangeTab(0);
                }
              }}
            />
            <Menu.Item
              name="MODELES"
              active={this.state.indexTab === 1}
              onClick={() => {
                if (this.state.indexTab !== 1) {
                  this.handleChangeTab(1);
                }
              }}
            />
          </Menu>

          {this.state.indexTab === 0 ? (
            <Documents.DocumentArchives
              client={this.props.client}
              idPatient={this.props.idPatient}
            />
          ) : (
            <Documents.DocumentModeles client={this.props.client} />
          )}
        </React.Fragment>
      );
  }
}
