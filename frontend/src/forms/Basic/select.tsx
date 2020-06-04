import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  makeStyles,
  MenuItem,
  Select,
  SelectProps,
  Tooltip
} from "@material-ui/core";
import FormHelperText from "@material-ui/core/FormHelperText";
import React from "react";
import { WrappedFieldMetaProps, WrappedFieldProps } from "redux-form";
import { ID } from "../../utils";

const renderFormHelper = ({ touched, error }: Pick<WrappedFieldMetaProps, "touched" | "error">) => {
  if (!(touched && error)) {
    return;
  } else {
    return <FormHelperText>{touched && error}</FormHelperText>;
  }
};

interface Props {}

export const RenderSelectField = ({
  input,
  label,
  autoFocus,
  meta: { touched, error },
  children
}: WrappedFieldProps & SelectProps & Props) => {
  const id = ID();
  const labelId = ID();
  const classes = makeStyles(theme => ({
    root: {
      display: "flex"
    }
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  const onChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    input.onChange(event.target.value);
  };

  // select doesn't support endAdornment
  // tooltip doesn't work in FormControl
  // https://stackoverflow.com/questions/60384230/tooltip-inside-textinput-label-is-not-working-material-ui-react
  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
      style={{ pointerEvents: "auto" }}
      margin="dense">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId} style={{ pointerEvents: "auto" }}>
        {label}
      </InputLabel>
      <Select
        label={label}
        labelWidth={labelWidth}
        autoFocus={autoFocus}
        labelId={labelId}
        value={input.value}
        onChange={onChange}
        onBlur={input.onBlur}
        inputProps={{
          id: id
        }}>
        {children}
      </Select>

      {renderFormHelper({ touched, error })}
    </FormControl>
  );
};
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

export const RenderMutipleSelectField = ({
  input,
  label,
  options,
  autoFocus,
  meta: { touched, error }
}: WrappedFieldProps & SelectProps & { options: { text: string; value: string; tooltipTitle?: string }[] }) => {
  const id = ID();
  const labelId = ID();
  const classes = makeStyles(theme => ({
    root: {
      display: "flex"
    }
  }))();

  const [labelWidth, setLabelWidth] = React.useState(0);

  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  const inputLabel = React.useRef<HTMLLabelElement>(null);

  const onChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    input.onChange(event.target.value);
  };

  return (
    <FormControl
      classes={{ root: classes.root }}
      error={touched && error}
      variant="outlined"
      size="small"
      margin="dense">
      <InputLabel ref={inputLabel} htmlFor={id} id={labelId}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        labelWidth={labelWidth}
        multiple
        value={input.value}
        onChange={onChange}
        autoFocus={autoFocus}
        onBlur={input.onBlur}
        renderValue={selected => (selected as string[]).join(", ")}
        MenuProps={MenuProps}>
        {options.map(option => {
          return (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox checked={input.value.indexOf(option.value) > -1} />
              {option.tooltipTitle ? (
                <Tooltip arrow title={option.tooltipTitle} key={option.value}>
                  <ListItemText primary={option.text} />
                </Tooltip>
              ) : (
                <ListItemText primary={option.text} />
              )}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
