import _ from "lodash";

import React from "react";

import { Dropdown, Button, Divider, Popup } from "semantic-ui-react";

import Calendar from "./Calendar";

import CalendarPanel from "./CalendarPanel";

import { helpPopup } from "./Settings";

export default class Calendars extends React.Component {
  componentWillMount() {
    let hidePanel =
      localStorage.getItem("calendarPanelHide") === "true" ? true : false;
    this.setState({
      plannings: [],
      index: -1,
      print: 0,
      hidePanel: _.isNull(hidePanel) ? false : hidePanel
    });
  }

  componentDidMount() {
    // cross browser window.print callback
    // window.onafterprint is not defined on Safari
    if (_.isUndefined(window.onafterprint) && window.matchMedia) {
      let mediaQueryList = window.matchMedia("print");
      mediaQueryList.addListener(mql => {
        //console.log(mql);
        if (!mql.matches) {
          this.afterPrint();
        }
      });
    } else {
      window.addEventListener("afterprint", () => this.afterPrint());
    }

    // ajust panel & calendar widths
    window.addEventListener("resize", () => this.setState({}));

    this.reload();

    // commande pour masquer le panel
    document.addEventListener("keydown", this.handleHiddingPanel);
  }

  componentDidUpdate() {
    //console.log(document.getElementById("calendars"));
    setTimeout(() => {
      if (this.state.print) {
        window.print();
      }
    }, 1000);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleHiddingPanel); // ne marchera pas avec une fonction anonyme
  }

  afterPrint = () => {
    //console.log("Functionality to run after printing");
    this.setState({ print: false });
  };

  print = () => {
    this.setState({ print: true });
  };

  reload = () => {
    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        let index = _.toInteger(localStorage.getItem("calendarPlanningIndex"));
        if (_.isNull(index) || index >= result.results.length) {
          index = result.results.length > 0 ? 0 : -1;
          localStorage.setItem("calendarPlanningIndex", index);
        }
        //let index = result.results.length > 0 ? 0 : -1;
        this.setState({ plannings: result.results, index: index });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  onPlanningChange = (e, d) => {
    localStorage.setItem("calendarPlanningIndex", d.value);
    this.setState({ index: d.value });
  };

  zoomOut = () => {
    let id =
      this.state.index < 0 ? "0" : this.state.plannings[this.state.index].id;
    let h = localStorage.getItem("calendarSlotHeight_" + id);
    if (_.isNull(h)) {
      h = 20;
    }
    if (h < 14) {
      return;
    }
    localStorage.setItem("calendarSlotHeight_" + id, --h);
    this.setState({});
  };

  zoomIn = () => {
    let id =
      this.state.index < 0 ? "0" : this.state.plannings[this.state.index].id;
    let h = localStorage.getItem("calendarSlotHeight_" + id);
    if (_.isNull(h)) {
      h = 20;
    }
    localStorage.setItem("calendarSlotHeight_" + id, ++h);
    this.setState({});
  };

  hidePanel = bool => {
    this.setState({
      hidePanel: bool
    });
    localStorage.setItem("calendarPanelHide", bool ? "true" : "false");
  };

  handleHiddingPanel = event => {
    // CTRL + ESPACE pour masquer le panel
    // Ecoute d'une suite de touches sur le clavier
    // -> https://www.yosko.net/article33/snippet-06-javascript-capturer-des-raccourcis-clavier-utilises-par-votre-navigateur
    if (event.ctrlKey && event.keyCode === 32) {
      this.hidePanel(!this.state.hidePanel);
    }
  };

  render() {
    let calendar = (
      <Calendar
        client={this.props.client}
        couleur={
          this.state.index < 0
            ? ""
            : this.state.plannings[this.state.index].couleur
        }
        options={
          this.state.index < 0
            ? {}
            : this.state.plannings[this.state.index].optionsJO
        }
        planning={
          this.state.index < 0 ? "0" : this.state.plannings[this.state.index].id
        }
        externalRefetch={this.state.externalRefetch}
      />
    );

    if (this.state.print) {
      return calendar;
    }

    // panel & calendar widths
    let width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    let panelWidth = 280;
    let calendarWidth = width - 320;

    let panelStyle = {
      width: panelWidth,
      float: "left",
      marginLeft: 10,
      marginTop: 5
    };
    /*if (this.state.hidePanel) {
      panelStyle["display"] = "none";
    }*/

    //console.log(this.state.plannings[this.state.index]);
    return (
      <React.Fragment>
        {!this.state.hidePanel ? (
          <div style={panelStyle}>
            <div style={{ textAlign: "right" }}>
              <Button.Group basic={true} size="mini">
                <Popup
                  trigger={<Button icon="print" onClick={this.print} />}
                  content="Imprimer l'agenda"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
              </Button.Group>
              &nbsp;
              <Button.Group basic={true} size="mini">
                <Popup
                  trigger={<Button icon="zoom out" onClick={this.zoomOut} />}
                  content="Réduire la hauteur des créneaux horaires"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
                <Popup
                  trigger={<Button icon="zoom in" onClick={this.zoomIn} />}
                  content="Augmenter la hauteur des créneaux horaires"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
              </Button.Group>
              &nbsp;
              <Button.Group basic={true} size="mini">
                <Popup
                  trigger={
                    <Button
                      icon="caret left"
                      onClick={() => this.hidePanel(!this.state.hidePanel)}
                    />
                  }
                  content="Masquer le panneau latéral gauche (Ctrl + Espace)"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
              </Button.Group>
            </div>
            <Divider fitted={true} hidden={true} />
            <Dropdown
              style={{ fontSize: "0.8rem" }}
              value={this.state.index}
              onChange={this.onPlanningChange}
              fluid={true}
              selection={true}
              multiple={false}
              options={_.map(this.state.plannings, (planning, i) => {
                return {
                  text: planning.titre,
                  value: i
                };
              })}
            />
            <CalendarPanel
              client={this.props.client}
              couleur={
                this.state.index < 0
                  ? ""
                  : this.state.plannings[this.state.index].couleur
              }
              planning={
                this.state.index < 0
                  ? "0"
                  : this.state.plannings[this.state.index].id
              }
              options={
                this.state.index < 0
                  ? {}
                  : this.state.plannings[this.state.index].optionsJO
              }
              handleExternalRefetch={externalRefetch =>
                this.setState({ externalRefetch: externalRefetch })
              }
            />
          </div>
        ) : (
          ""
        )}
        <div
          style={{
            width: this.state.hidePanel ? "98%" : calendarWidth,
            float: "right",
            marginRight: 10,
            marginTop: 5,
            display: "flex"
          }}
        >
          {this.state.hidePanel ? (
            <div>
              <Popup
                trigger={
                  <Button
                    basic={true}
                    size="mini"
                    icon="caret right"
                    onClick={() => this.hidePanel(!this.state.hidePanel)}
                  />
                }
                content="Afficher le panneau latéral gauche (Ctrl + Espace)"
                on={helpPopup.on}
                size={helpPopup.size}
                inverted={helpPopup.inverted}
              />
            </div>
          ) : (
            ""
          )}
          {this.state.index < 0 ? "" : calendar}
        </div>
      </React.Fragment>
    );
  }
}
