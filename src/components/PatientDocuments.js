import React from "react";
//import { Actes } from "rhapi-ui-react";
import {
  //Button,
  //Divider,
  //Header,
  //Input,
  Menu
  //Message,
  //Modal
} from "semantic-ui-react";

//import moment from "moment";
//import _ from "lodash";

//import site from "./SiteSettings";

export default class PatientDocuments extends React.Component {
  state = {
    indexTab: 0
  };

  componentDidMount() {
    this.reload();
  }

  componentDidUpdate() {
    this.reload();
  }

  reload = () => {
    // - Si on est en indexTab 0 (Archives) on doit remonter tous les
    //   documents avec un idPatient renseigné (et différent de 0)
    // - Si on est en indexTab 1 (Modèles)  on doit remonter tous les
    //   documents dont le mimeType 'text/x-html-template' et idPatient à 0
    //   (les modèles sont ceux du praticien et non du patient)
    // - Il faudra par la suite filtrer également sur origine
    //   (identifiant du praticien)
    // - Il est important d'exclure le contenu du document par exfields
    //   (pour les requêtes n'ayant pas besoin de télécharger le contenu)
    let params = {};
    if (this.state.indexTab === 0) {
      // archives
      params = { _idPatient: this.props.idPatient, exfields: "document" };
    } else if (this.state.indexTab === 1) {
      // modèles du praticien
      params = {
        _idPatient: 0,
        _mimeType: "text/x-html-template",
        exfields: "document"
      };
    }
    this.props.client.Documents.readAll(
      params,
      result => {
        console.log(result); // voir sortie console sur Langlois Franck (id 3)
      },
      error => {
        console.log(error);
      }
    );
  };

  handleChangeTab = index => {
    this.setState({ indexTab: index });
  };

  render() {
    if (!this.props.idPatient) {
      return <div style={{ minHeight: "400px" }} />;
    } else
      return (
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
      );
  }
}
