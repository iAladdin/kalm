import React from "react";
import { Switch, FormControlLabel, Tooltip } from "@material-ui/core";
import { RootState } from "../../reducers";
import { DispatchProp, connect } from "react-redux";
import { setSettingsAction } from "../../actions/settings";

const mapStateToProps = (state: RootState) => {
  return {
    open: state.get("settings").get("isDisplayingHelpers")
  };
};

class HelperSwitchRaw extends React.PureComponent<
  ReturnType<typeof mapStateToProps> & DispatchProp
> {
  private handleChange = () => {
    const { open } = this.props;

    this.props.dispatch(
      setSettingsAction({
        isDisplayingHelpers: !open
      })
    );
  };

  public render() {
    const { open } = this.props;
    return (
      <FormControlLabel
        label={open ? "Detail Mode" : "Concise Mode"}
        labelPlacement="start"
        control={
          <Switch checked={open} onChange={this.handleChange} color="primary" />
        }
      />
    );
  }
}

export const HelperSwitch = connect(mapStateToProps)(HelperSwitchRaw);
