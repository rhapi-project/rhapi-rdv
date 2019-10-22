import React from "react";

import { Label, Popup } from "semantic-ui-react";

import { SketchPicker } from "react-color";

import _ from "lodash";

export default class ColorPicker extends React.Component {
  state = {
    color: null
  };

  componentDidMount() {
    this.setState({ color: this.props.color });
  }

  static getDerivedStateFromProps(props, state) {
    if (props.color !== state.color) {
      return { color: props.color };
    }
    return null;
  }

  handleChange = color => {
    this.setState({ color: color.hex });
    this.props.onChange(color.hex);
  };

  render() {
    let { color } = this.state;
    if (!_.isNull(color)) {
      return (
        <Popup
          trigger={
            <Label
              style={{
                background: color,
                minWidth: 56,
                minHeight: 28,
                cursor: "pointer"
              }}
            />
          }
          content={<SketchPicker color={color} onChange={this.handleChange} />}
          on="click"
          position="top left"
          style={{ padding: 0 }}
        />
      );
    } else {
      return null;
    }
  }
}
