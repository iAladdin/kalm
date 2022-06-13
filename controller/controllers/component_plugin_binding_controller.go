/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/xeipuuv/gojsonschema"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ComponentPluginBindingReconciler reconciles a ComponentPluginBinding object
type ComponentPluginBindingReconciler struct {
	*BaseReconciler
}

// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentpluginbindings,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core.kalm.dev,resources=componentpluginbindings/status,verbs=get;update;patch

func (r *ComponentPluginBindingReconciler) Reconcile(ctx context.Context, req ctrl.Request) (reconcile.Result, error) {
	task := &ComponentPluginBindingReconcilerTask{
		ComponentPluginBindingReconciler: r,
		ctx:                              context.Background(),
	}

	return ctrl.Result{}, task.Run(req)
}

type ComponentPluginBindingReconcilerTask struct {
	*ComponentPluginBindingReconciler
	ctx     context.Context
	binding *v1alpha1.ComponentPluginBinding
}

func (r *ComponentPluginBindingReconcilerTask) Run(req ctrl.Request) error {
	ctx := context.Background()

	var pluginBinding v1alpha1.ComponentPluginBinding

	if err := r.Get(ctx, req.NamespacedName, &pluginBinding); err != nil {
		return client.IgnoreNotFound(err)
	}

	r.binding = &pluginBinding

	if r.binding.ObjectMeta.Labels == nil {
		r.binding.ObjectMeta.Labels = make(map[string]string)
	}

	r.binding.ObjectMeta.Labels["kalm-plugin"] = r.binding.Spec.PluginName

	if r.binding.Spec.ComponentName != "" {
		r.binding.ObjectMeta.Labels[v1alpha1.KalmLabelComponentKey] = r.binding.Spec.ComponentName
	}

	var component v1alpha1.Component
	err := r.Get(
		ctx,
		types.NamespacedName{
			Name:      r.binding.Spec.ComponentName,
			Namespace: r.binding.Namespace,
		},
		&component)

	if err != nil {
		if !errors.IsNotFound(err) {
			return err
		}

		r.WarningEvent(err, "try to bind to non-exist component")
	} else {
		err := ctrl.SetControllerReference(&component, r.binding, r.Scheme)
		if err != nil {
			r.WarningEvent(err, "fail to set component as owner of binding")
		}
	}

	if err := r.Update(context.Background(), r.binding); err != nil {
		r.WarningEvent(err, "update plugin binding error.")
		return err
	}

	return r.UpdatePluginBindingStatus()
}

func (r *ComponentPluginBindingReconcilerTask) UpdatePluginBindingStatus() error {
	pluginProgram := componentPluginsCache.Get(r.binding.Spec.PluginName)

	if pluginProgram == nil {
		return nil
	}

	isConfigValid := true
	var configError string

	if pluginProgram.ConfigSchema != nil {
		if r.binding.Spec.Config == nil {
			isConfigValid = false
			configError = "Configuration is required."
		} else {
			pluginConfig := gojsonschema.NewStringLoader(string(r.binding.Spec.Config.Raw))
			res, err := pluginProgram.ConfigSchema.Validate(pluginConfig)

			if err != nil {
				isConfigValid = false
				configError = err.Error()
			} else {
				if !res.Valid() {
					isConfigValid = false
					configError = res.Errors()[0].String()
				}
			}
		}
	}

	pluginBindingCopy := r.binding.DeepCopy()
	pluginBindingCopy.Status.ConfigError = configError
	pluginBindingCopy.Status.ConfigValid = isConfigValid

	if err := r.Status().Patch(r.ctx, pluginBindingCopy, client.MergeFrom(r.binding)); err != nil {
		r.WarningEvent(err, "Patch plugin binding status error.")
		return err
	}

	return nil
}

func (r *ComponentPluginBindingReconcilerTask) WarningEvent(err error, msg string, args ...interface{}) {
	r.EmitWarningEvent(r.binding, err, msg, args...)
}

func (r *ComponentPluginBindingReconcilerTask) NormalEvent(reason, msg string, args ...interface{}) {
	r.EmitNormalEvent(r.binding, reason, msg, args...)
}

func NewComponentPluginBindingReconciler(mgr ctrl.Manager) *ComponentPluginBindingReconciler {
	return &ComponentPluginBindingReconciler{
		NewBaseReconciler(mgr, "ComponentPluginBinding"),
	}
}

func (r *ComponentPluginBindingReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha1.ComponentPluginBinding{}).
		Complete(r)
}
