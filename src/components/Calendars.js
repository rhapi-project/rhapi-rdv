import _ from "lodash";

import React from "react";

import { Dropdown, Button, Divider } from "semantic-ui-react";

import Calendar from "./Calendar";

import CalendarPanel from "./CalendarPanel";

export default class Calendars extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1, print: 0 });
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
  }

  componentDidUpdate() {
    //console.log(document.getElementById("calendars"));
    setTimeout(() => {
      if (this.state.print) {
        window.print();
      }
    }, 1000);
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
        let index = result.results.length > 0 ? 0 : -1;
        this.setState({ plannings: result.results, index: index });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  onPlanningChange = (e, d) => {
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
    let calendarWidth = width - 330;

    return (
      <React.Fragment>
        <div
          style={{
            width: panelWidth,
            float: "left",
            marginLeft: 10,
            marginTop: 5
          }}
        >
          <div style={{ textAlign: "right" }}>
            <Button.Group basic={true} size="mini">
              <Button icon="print" onClick={this.print} />
            </Button.Group>
            &nbsp;
            <Button.Group basic={true} size="mini">
              <Button icon="zoom out" onClick={this.zoomOut} />
              <Button icon="zoom in" onClick={this.zoomIn} />
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
        <div
          style={{
            width: calendarWidth,
            float: "right",
            marginRight: 10,
            marginTop: 5
          }}
        >
          {this.state.index < 0 ? "" : calendar}
        </div>
      </React.Fragment>
    );
  }
}
