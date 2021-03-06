import _ from "lodash";
import React from "react";
import { Dropdown, Button, Divider, Popup } from "semantic-ui-react";
import moment from "moment";
import Calendar from "./Calendar";
import CalendarPanel from "./CalendarPanel";
import SmsGroupes from "./SmsGroupes";
import { helpPopup } from "./Settings";
import { print } from "../lib/Helpers";

export default class Calendars extends React.Component {
  state = {
    plannings: [],
    index: -1,
    print: 0,
    hidePanel: false,
    currentDate: moment(),
    modalSMSGroupes: false
  };

  componentDidMount() {
    let hidePanel =
      localStorage.getItem("calendarPanelHide") === "true" ? true : false;
    this.setState({
      hidePanel: _.isNull(hidePanel) ? false : hidePanel
    });
    // ajust panel & calendar widths
    window.addEventListener("resize", this.onResize);

    this.reload();

    // commande pour masquer le panel
    document.addEventListener("keydown", this.handleHiddingPanel);
  }

  isPrinting = false;

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("keydown", this.handleHiddingPanel); // ne marchera pas avec une fonction anonyme
  }

  onResize = () => {
    this.setState({});
  };

  afterPrint = () => {
    this.setState({ print: false });
  };

  print = () => {
    let printStatus = status => {
      this.isPrinting = status;
    };
    this.setState({ print: true });
    print(
      this,
      window,
      this.afterPrint,
      undefined,
      this.isPrinting,
      printStatus
    );
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
        currentDate={this.state.currentDate}
        couleur={
          this.state.index < 0
            ? ""
            : this.state.plannings[this.state.index].couleur
        }
        planning={
          this.state.index < 0 ? "0" : this.state.plannings[this.state.index].id
        }
        options={
          this.state.index < 0
            ? {}
            : this.state.plannings[this.state.index].optionsJO
        }
        todayClick={() => {
          this.setState({ todayClicked: true, currentDate: moment() });
        }}
        externalRefetch={this.state.externalRefetch}
      />
    );

    // panel & calendar widths
    let width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    let panelWidth = 285;
    let calendarWidth = width - panelWidth - (window.qWebChannel ? 25 : 40);

    let panelStyle = {
      width: panelWidth,
      float: "left",
      marginLeft: 10,
      marginTop: 5
    };
    let hidePanel = this.state.hidePanel || this.state.print;
    return (
      <React.Fragment>
        {!hidePanel ? (
          <div style={panelStyle}>
            <div style={{ textAlign: "right" }}>
              <Button.Group basic={true} size="mini">
                <Popup
                  trigger={
                    <Button
                      icon="send"
                      onClick={() => this.setState({ modalSMSGroupes: true })}
                    />
                  }
                  content="Envoi groupé de SMS"
                  on={helpPopup.on}
                  size={helpPopup.size}
                  inverted={helpPopup.inverted}
                />
              </Button.Group>
              &nbsp;
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
              currentDate={this.state.currentDate} // new
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
              onDateChange={date =>
                this.setState({ currentDate: moment(date) })
              } // new
              handleExternalRefetch={externalRefetch => {
                this.setState({ externalRefetch: externalRefetch });
              }}
              todayClicked={this.state.todayClicked}
            />
          </div>
        ) : (
          ""
        )}
        <div
          style={{
            width: hidePanel ? "98%" : calendarWidth,
            float: "right",
            marginRight: 10,
            marginTop: 5,
            display: "flex"
          }}
        >
          {hidePanel ? (
            <div>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Popup
                trigger={
                  <Button
                    style={{
                      position: "fixed",
                      top: 80,
                      left: 1
                    }}
                    color="blue"
                    size="tiny"
                    compact={true}
                    icon="caret right"
                    onClick={() => {
                      this.hidePanel(false);
                      this.setState({ print: false });
                    }}
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

        {/* modal SMS groupés */}
        <SmsGroupes
          client={this.props.client}
          idPlanning={
            this.state.index < 0
              ? null
              : this.state.plannings[this.state.index].id
          }
          open={this.state.modalSMSGroupes}
          onClose={() => {
            this.setState({ modalSMSGroupes: false });
          }}
        />
      </React.Fragment>
    );
  }
}
