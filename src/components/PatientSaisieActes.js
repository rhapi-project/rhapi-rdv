import React from "react";
import { Actes } from "rhapi-ui-react";
import { Menu } from "semantic-ui-react";

import _ from "lodash";

import site from "./SiteSettings";

export default class PatientSaisieActes extends React.Component {
  state = {
    typeActe: ""
  };

  componentDidMount() {
    if (!_.isNull(this.props.idActe)) {
      this.props.client.Actes.read(
        this.props.idActe,
        {},
        result => {
          this.setState({ typeActe: result.code });
        },
        error => {
          console.log(error);
          this.setState({ typeActe: "#FSE" });
        }
      );
    } else {
      this.setState({ typeActe: "#FSE" });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Menu pointing={true} secondary={true}>
          <Menu.Item
            name="FSE"
            active={this.state.typeActe === "#FSE"}
            onClick={() => this.setState({ typeActe: "#FSE" })}
          />
          <Menu.Item
            name="PROJET"
            active={this.state.typeActe === "#DEVIS"}
            onClick={() => this.setState({ typeActe: "#DEVIS" })}
          />
        </Menu>

        <Actes.SaisieValidation
          client={this.props.client}
          idPatient={this.props.idPatient}
          idActe={this.props.idActe}
          acteCopy={this.props.acteCopy}
          typeActe={this.state.typeActe}
          acteTitre={
            this.state.typeActe === "#FSE"
              ? site.evolution.actes.fseTitre
              : this.state.typeActe === "#DEVIS"
              ? site.evolution.actes.devisTitre
              : "Titre par défaut"
          }
          codGrille={13}
          executant="D1"
          specialite={19}
          lignes={15}
          actions={[]}
          onForceChangeType={type => this.setState({ typeActe: type })}
        />
      </React.Fragment>
    );
  }
}
