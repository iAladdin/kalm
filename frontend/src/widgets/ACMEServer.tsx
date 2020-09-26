import React from "react";
import {
  Box,
  Button,
  createStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  withStyles,
} from "@material-ui/core";
import { WithStyles } from "@material-ui/styles";
import { Expansion } from "forms/Route/expansion";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import DomainStatus from "widgets/DomainStatus";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import copy from "copy-to-clipboard";
import { setSuccessNotificationAction } from "actions/notification";
import { CopyIcon } from "widgets/Icon";
import { Body } from "widgets/Label";
import { RootState } from "reducers";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { BlankTargetLink } from "widgets/BlankTargetLink";

const styles = (_theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState, ownProps: any) => {
  const acmeServer = state.certificates.acmeServer;
  return {
    acmeServer: acmeServer,
  };
};

interface ACMEServerGuideProps extends ReturnType<typeof mapStateToProps>, TDispatchProp, WithStyles<typeof styles> {
  defaultUnfold?: boolean;
}

class ACNEServerRaw extends React.PureComponent<ACMEServerGuideProps> {
  public render() {
    const { acmeServer, defaultUnfold } = this.props;

    if (!acmeServer) {
      return null;
    }

    let title: React.ReactNode = "";
    if (
      acmeServer.acmeDomain.length === 0 &&
      acmeServer.ipForNameServer.length === 0 &&
      acmeServer.nsDomain.length === 0 &&
      !acmeServer.ready
    ) {
      title = <PendingBadge text="ACME DNS is pending." />;
    }

    if (acmeServer.ready) {
      title = <SuccessBadge text="ACME DNS Server is running" />;
    }

    return (
      <Expansion title={title} defaultUnfold={defaultUnfold}>
        <Box p={2}>
          <Body>
            ACME dns server can help you apply and renew wildcard certificates from Let's Encrypt. This only needs to be
            configured once. <BlankTargetLink href="https://kalm.dev/docs">Learn More (TODO)</BlankTargetLink>
          </Body>

          <>
            <DNSConfigItems
              items={[
                {
                  domain: acmeServer.acmeDomain,
                  type: "NS",
                  nsRecord: acmeServer.nsDomain,
                },
                {
                  domain: acmeServer.nsDomain,
                  type: "A",
                  nsRecord: acmeServer.ipForNameServer,
                },
              ]}
            />
            <Box mt={2}>
              <Button color="primary" variant="outlined" size="small" component={Link} to={`/acme/edit`}>
                Edit
              </Button>
            </Box>
          </>
        </Box>
      </Expansion>
    );
  }
}

export const ACMEServer = connect(mapStateToProps)(withStyles(styles)(ACNEServerRaw));

interface DNSConfigGuideProps extends TDispatchProp {
  items: {
    type: string;
    domain: string;
    nsRecord?: string;
    cnameRecord?: string;
    aRecord?: string;
  }[];
}

export const DNSConfigItems = connect()((props: DNSConfigGuideProps) => {
  const { items, dispatch } = props;
  return (
    <>
      <Body>Please update the following records in your DNS provider.</Body>
      <Table size="small" aria-label="Envs-Table">
        <TableHead key="title">
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Domain</TableCell>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const { domain, type, nsRecord, cnameRecord, aRecord } = item;
            const record = nsRecord || cnameRecord || aRecord || "";
            return (
              <TableRow key={index}>
                <TableCell>
                  <DomainStatus domain={domain} nsDomain={nsRecord} cnameDomain={cnameRecord} ipAddress={aRecord} />
                </TableCell>
                <TableCell>{type}</TableCell>
                <TableCell>
                  {domain}
                  <IconButtonWithTooltip
                    tooltipTitle="Copy"
                    aria-label="copy"
                    onClick={() => {
                      copy(domain);
                      dispatch(setSuccessNotificationAction("Copied successful!"));
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButtonWithTooltip>
                </TableCell>
                <TableCell>
                  {record}
                  <IconButtonWithTooltip
                    tooltipTitle="Copy"
                    aria-label="copy"
                    onClick={() => {
                      copy(record);
                      dispatch(setSuccessNotificationAction("Copied successful!"));
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButtonWithTooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
});
