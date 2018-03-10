import React from "react";

import { Label, Popup } from "semantic-ui-react";

import { SketchPicker } from "react-color";

export default class ColorPicker extends React.Component {
  componentWillMount() {
    this.setState({
      color: this.props.color
    });
  }

  componentWillReceiveProps(next) {
    this.setState({
      color: next.color
    });
  }

  handleChange = color => {
    this.setState({ color: color.hex });
    this.props.onChange(color.hex);
  };

  render() {
    let { color } = this.state;
    return (
      <Popup
        trigger={
          <Label style={{ background: color, minWidth: 56, minHeight: 28 }} />
        }
        content={<SketchPicker color={color} onChange={this.handleChange} />}
        on="click"
        position="top left"
        style={{ padding: 0 }}
      />
    );
  }
}
