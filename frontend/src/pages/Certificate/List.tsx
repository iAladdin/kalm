import { Box, createStyles, Theme, WithStyles, withStyles } from "@material-ui/core";
import { BasePage } from "pages/BasePage";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { addCertificateDialogId, NewModal } from "./New";
import { CustomizedButton } from "widgets/Button";
import { H4 } from "widgets/Label";
import { Loading } from "widgets/Loading";
import {
  deleteCertificateAction,
  loadCertificateIssuers,
  loadCertificates,
  setEditCertificateModal
} from "actions/certificate";
import { customSearchForImmutable } from "utils/tableSearch";
import { Certificate } from "types/certificate";
import { ConfirmDialog } from "widgets/ConfirmDialog";
import { setErrorNotificationAction, setSuccessNotificationAction } from "actions/notification";
import { openDialogAction } from "actions/dialog";
import { PendingBadge, SuccessBadge } from "widgets/Badge";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { DeleteIcon, EditIcon } from "widgets/Icon";
import { FlexRowItemCenterBox } from "widgets/Box";
import { CertificateDataWrapper, WithCertificatesDataProps } from "./DataWrapper";
import { blinkTopProgressAction } from "actions/settings";
import { KTable } from "widgets/Table";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {
    isLoading: state.get("certificates").get("isLoading"),
    isFirstLoaded: state.get("certificates").get("isFirstLoaded"),
    certificates: state.get("certificates").get("certificates"),
  };
};

interface Props
  extends WithCertificatesDataProps,
    WithStyles<typeof styles>,
    ReturnType<typeof mapStateToProps>,
    TDispatchProp {}

interface State {
  isDeleteConfirmDialogOpen: boolean;
  deletingCertificate: Certificate | null;
}

interface RowData extends Certificate {
  index: number;
}

class CertificateListPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null,
    };
  }

  componentDidMount() {
    this.props.dispatch(loadCertificates());
    this.props.dispatch(loadCertificateIssuers());
  }

  private renderName = (rowData: RowData) => {
    return rowData.get("name");
  };

  private renderDomains = (rowData: RowData) => {
    return (
      <>
        {rowData.get("domains")?.map((domain) => {
          return <div key={domain}>{domain}</div>;
        })}
      </>
    );
  };

  private renderMoreActions = (rowData: RowData) => {
    const { dispatch } = this.props;
    return (
      <>
        {rowData.get("isSelfManaged") && (
          <IconButtonWithTooltip
            tooltipTitle="Edit"
            aria-label="edit"
            size="small"
            onClick={() => {
              blinkTopProgressAction();
              dispatch(openDialogAction(addCertificateDialogId));
              dispatch(setEditCertificateModal(rowData));
            }}
          >
            <EditIcon />
          </IconButtonWithTooltip>
        )}
        <IconButtonWithTooltip
          tooltipTitle="Delete"
          aria-label="delete"
          size="small"
          onClick={() => {
            blinkTopProgressAction();
            this.showDeleteConfirmDialog(rowData);
          }}
        >
          <DeleteIcon />
        </IconButtonWithTooltip>
      </>
    );
  };

  private renderDeleteConfirmDialog = () => {
    const { isDeleteConfirmDialogOpen } = this.state;

    return (
      <ConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={this.closeDeleteConfirmDialog}
        title="Are you sure to delete this Certificate?"
        content=""
        onAgree={this.confirmDelete}
      />
    );
  };

  private closeDeleteConfirmDialog = () => {
    this.setState({
      isDeleteConfirmDialogOpen: false,
      deletingCertificate: null,
    });
  };

  private showDeleteConfirmDialog = (deletingCertificate: Certificate) => {
    this.setState({
      isDeleteConfirmDialogOpen: true,
      deletingCertificate,
    });
  };

  private confirmDelete = async () => {
    const { dispatch } = this.props;
    try {
      const { deletingCertificate } = this.state;
      if (deletingCertificate) {
        await dispatch(deleteCertificateAction(deletingCertificate.get("name")));
        await dispatch(setSuccessNotificationAction("Successfully delete a certificate"));
      }
    } catch {
      dispatch(setErrorNotificationAction());
    }
  };

  private renderStatus = (rowData: RowData) => {
    const ready = rowData.get("ready");

    if (ready === "True") {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <SuccessBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>Normal</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else if (!!rowData.get("reason")) {
      return (
        <FlexRowItemCenterBox>
          <FlexRowItemCenterBox mr={1}>
            <PendingBadge />
          </FlexRowItemCenterBox>
          <FlexRowItemCenterBox>{rowData.get("reason")}</FlexRowItemCenterBox>
        </FlexRowItemCenterBox>
      );
    } else {
      return <PendingBadge />;
    }
  };

  private renderType = (rowData: RowData) => {
    return rowData.get("isSelfManaged") ? "UPLOADED" : "MANAGED";
  };

  private getColumns() {
    const columns = [
      // @ts-ignore
      {
        title: "Name",
        field: "name",
        sorting: false,
        render: this.renderName,
        customFilterAndSearch: customSearchForImmutable,
      },
      {
        title: "Domains",
        field: "domains",
        sorting: false,
        render: this.renderDomains,
      },
      {
        title: "Status",
        field: "status",
        sorting: false,
        render: this.renderStatus,
      },
      {
        title: "Type",
        field: "isSelfManaged",
        sorting: false,
        render: this.renderType,
      },
      {
        title: "Actions",
        field: "moreAction",
        sorting: false,
        searchable: false,
        render: this.renderMoreActions,
      },
    ];

    return columns;
  }

  private getData = () => {
    const { certificates } = this.props;
    const data: RowData[] = [];

    certificates.forEach((certificate, index) => {
      const rowData = certificate as RowData;
      rowData.index = index;
      data.push(rowData);
    });

    return data;
  };

  public render() {
    const { dispatch, isFirstLoaded, isLoading } = this.props;
    const tableData = this.getData();
    return (
      <BasePage
        secondHeaderRight={
          <>
            <H4>Certificates</H4>
            <CustomizedButton
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => {
                blinkTopProgressAction();
                dispatch(openDialogAction(addCertificateDialogId));
                dispatch(setEditCertificateModal(null));
              }}
            >
              Add
            </CustomizedButton>
          </>
        }
      >
        <NewModal />
        {this.renderDeleteConfirmDialog()}
        <Box p={2}>
          {isLoading && !isFirstLoaded ? (
            <Loading />
          ) : (
            <KTable
              options={{
                paging: tableData.length > 20,
              }}
              columns={this.getColumns()}
              data={tableData}
              title=""
            />
          )}
        </Box>
      </BasePage>
    );
  }
}

export const CertificateListPage = withStyles(styles)(
  connect(mapStateToProps)(CertificateDataWrapper(CertificateListPageRaw)),
);
