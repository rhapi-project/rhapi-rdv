import React from "react";
import { Header, Button, Divider } from "semantic-ui-react";

import _ from "lodash";

import PriseRdv from "./PriseRdv";

// TODO: améliorer ce Component MonRdv
// => afficher le détail de chaque rendez-vous
// => ajouter des boutons "Annulation" "Modification" et gérer ces actions
class MonRdv extends React.Component {
  handleClick = () => {
    alert(
      "TODO : Ici je dois pouvoir :" +
        "\n- Afficher le détail du rendez-vous avec Reservation.read et l'id " +
        this.props.rdv.id +
        "\n- Annuler le rendez-vous avec Reservation.annuler et l'id du RDV " +
        this.props.rdv.id +
        "\n- Modifier le rendez-vous avec Reservation.update et l'id du RDV " +
        this.props.rdv.id +
        "\n\nPour l'instant l'action implémentée est 'Annuler'..."
    );
    const params = this.props.patient;
    const id = this.props.rdv.id;
    this.props.client.Reservation.annuler(
      id,
      params,
      () => {
        this.props.updateMesRdv();
      },
      datas => {
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
      }
    );
  };

  render() {
    // Provisoirement on n'affiche que la date, l'heure et la description (le motif) => à enrichir (voir TODOS )
    return (
      <div>
        <Button onClick={this.handleClick}>{this.props.rdv.startAt}</Button>
        <br />
        {this.props.rdv.description}
        <Divider />
      </div>
    );
  }
}
export default class MesRdv extends React.Component {
  componentWillMount() {
    this.setState({ nouveauRdv: false, mesRdv: [] }); // default state
    this.updateMesRdv();
  }

  updateMesRdv = () => {
    this.props.client.Reservation.mesRendezVous(
      {
        ipp: this.props.patient.ipp,
        password: this.props.patient.password
      },
      result => {
        // Attention on récupère ici des rendez-vous sans distinction de planning
        // Il peut donc y avoir des RDV pour lesquels le patient n'a aucune autorisation
        // d'annulation ou de modification
        console.log(result);
        this.setState({ mesRdv: result.results });
      },
      datas => {
        // ? erreur d'auth
        // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
        console.log(datas);
        alert(datas.internalMessage + " : " + datas.userMessage);
        window.history.back();
      }
    );
  };

  render() {
    // Prendre un nouveau RDV ?
    if (this.state.nouveauRdv) {
      return (
        <PriseRdv
          patient={this.props.patient}
          identified={true}
          client={this.props.client}
        />
      );
    }
    // Sinon
    // TODO afficher les rendez-vous et proposer pour chacun 'annuler' ou 'modifier'
    // Attention on récupère ici des rendez-vous sans distinction de planning
    // Il peut donc y avoir des RDV pour lesquels le patient n'a aucune autorisation
    // d'annulation ou de modification
    return (
      <React.Fragment>
        <Header size="medium">
          {this.state.mesRdv.length === 0
            ? "Aucun rendez-vous"
            : this.state.mesRdv.length === 1
              ? "Mon prochain rendez-vous"
              : "Mes prochains rendez-vous"}
        </Header>
        <Divider />
        {_.map(this.state.mesRdv, (rdv, i) => {
          return (
            <MonRdv
              rdv={rdv}
              client={this.props.client}
              patient={this.props.patient}
              updateMesRdv={this.updateMesRdv}
              key={"" + i}
            />
          );
        })}
        <Button
          secondary={true}
          fluid={true}
          onClick={() => this.setState({ nouveauRdv: true })}
        >
          Prendre un nouveau RDV
        </Button>
        <Divider hidden={true} />
        <Button
          onClick={() => window.location.reload()}
          fluid={true}
          secondary={true}
        >
          Déconnexion
        </Button>
      </React.Fragment>
    );
  }
}
