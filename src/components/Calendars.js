import _ from "lodash";

import React from "react";

import { Dropdown, Grid, Button, Divider } from "semantic-ui-react";

import Calendar from "./Calendar";

import CalendarPanel from "./CalendarPanel";

export default class Calendars extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1, print: false });
    this.reload();
  }

  componentDidUpdate() {
    setTimeout(() => {
      if (this.state.print) {
        window.print();
        this.setState({ print: false });
      }
    }, 1000);
  }

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

  print = () => {
    this.setState({ print: true });
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
    if (this.state.print) {
      return (
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
            this.state.index < 0
              ? "0"
              : this.state.plannings[this.state.index].id
          }
          externalRefetch={this.state.externalRefetch}
        />
      );
    }

    let width =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    let withPanel = width > 1340;

    let dropDownStyle = withPanel ? {} : { fontSize: "0.7rem" };

    return (
      <React.Fragment>
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column
              width={withPanel ? 3 : 2}
              style={{ maxWidth: "300px" }}
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
                style={dropDownStyle}
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
              {withPanel ? (
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
              ) : (
                ""
              )}
            </Grid.Column>
            <Grid.Column width={withPanel ? 13 : 14}>
              {this.state.index < 0 ? (
                ""
              ) : (
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
                    this.state.index < 0
                      ? "0"
                      : this.state.plannings[this.state.index].id
                  }
                  externalRefetch={this.state.externalRefetch}
                />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  }
}
