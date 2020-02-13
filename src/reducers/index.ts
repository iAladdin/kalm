import { combineReducers } from "redux-immutable";
import { reducer as formReducer } from "redux-form/immutable";
import { FormState } from "redux-form";
import test from "./test";
import notification, { State as NotificationState } from "./notification";
import components, { State as ComponentState } from "./component";
import applications, { State as ApplicationState } from "./application";
import configs, { State as ConfigState } from "./config";
import { connectRouter, RouterState } from "connected-react-router/immutable";
import { History, LocationState } from "history";
import { ImmutableMap } from "../typings";

export type RootState = ImmutableMap<{
  components: ComponentState;
  applications: ApplicationState;
  configs: ConfigState;
  router: RouterState<LocationState>;
  notification: NotificationState;
  form: FormState;
}>;

// combineReducers returns immutable map, but the type is not working correctly
// https://github.com/gajus/redux-immutable/issues/74

export default (history: History<LocationState>) =>
  combineReducers<RootState>({
    // @ts-ignore
    form: formReducer,
    router: connectRouter(history),
    components,
    applications,
    configs,
    notification,
    test
  });
