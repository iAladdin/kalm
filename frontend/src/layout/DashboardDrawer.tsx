import { createStyles, List, ListItem, ListItemIcon, ListItemText, Theme } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import AppsIcon from "@material-ui/icons/Apps";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { BaseDrawer } from "./BaseDrawer";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 40
      }
    },
    listItemSeleted: {
      backgroundColor: `${blue[50]} !important`,
      borderRight: `4px solid ${blue[700]}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important"
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

class DashboardDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuData() {
    const { activeNamespaceName } = this.props;
    return [
      {
        text: "Applications",
        to: "/applications"
      },
      {
        text: "Configs",
        to: "/configs?namespace=" + activeNamespaceName
      },
      {
        text: "Nodes",
        to: "/cluster/nodes"
      },
      {
        text: "Volumes",
        to: "/cluster/volumes"
      }
    ];
  }

  render() {
    const { classes } = this.props;
    const menuData = this.getMenuData();
    const pathname = window.location.pathname;

    return (
      <BaseDrawer>
        <List>
          {menuData.map((item, index) => (
            <ListItem
              className={classes.listItem}
              classes={{
                selected: classes.listItemSeleted
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={pathname.startsWith(item.to.split("?")[0])}>
              <ListItemIcon>
                <AppsIcon />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </BaseDrawer>
    );
  }
}

export const DashboardDrawer = connect(mapStateToProps)(withStyles(styles)(DashboardDrawerRaw));
