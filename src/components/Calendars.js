import _ from "lodash";

import React from "react";

import { Dropdown, Grid, Button } from "semantic-ui-react";

import Calendar from "./Calendar";

import CalendarPanel from "./CalendarPanel";

export default class Calendars extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1 });
    this.reload();
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

  zoomOut = () => {
    let id =
      this.state.index < 0 ? "0" : this.state.plannings[this.state.index].id;
    let h = localStorage.getItem("calendarSlotHeight_" + id);
    if (_.isNull(h)) {
      h = 20;
    }
    if (h < 4) return;
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
    return (
      <React.Fragment>
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={3}>
              <Dropdown
                style={{ width: "70%" }}
                value={this.state.index}
                onChange={this.onPlanningChange}
                placeholder="Choisir le(s) planning(s) à afficher"
                fluid={false}
                selection={true}
                multiple={false}
                options={_.map(this.state.plannings, (planning, i) => {
                  return {
                    text: planning.titre,
                    value: i
                  };
                })}
              />
              <Button.Group basic={true} size="tiny" floated="right">
                <Button icon="zoom out" onClick={this.zoomOut} />
                <Button icon="zoom in" onClick={this.zoomIn} />
              </Button.Group>
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
            </Grid.Column>
            <Grid.Column width={13}>
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
