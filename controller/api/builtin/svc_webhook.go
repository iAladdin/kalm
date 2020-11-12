package builtin

import (
	"context"
	"fmt"
	"net/http"

	"k8s.io/api/admission/v1beta1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/runtime/inject"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var svcAdmissionHandlerLog = logf.Log.WithName("svc-admission-handler")

// +kubebuilder:webhook:verbs=create;update;delete,path=/admission-handler-v1-svc,mutating=false,failurePolicy=fail,groups="",resources=services,versions=v1,name=vsvc.kb.io

type SvcAdmissionHandler struct {
	client  client.Client
	decoder *admission.Decoder
}

var _ admission.Handler = &SvcAdmissionHandler{}

var _ admission.DecoderInjector = &SvcAdmissionHandler{}
var _ inject.Client = &SvcAdmissionHandler{}

func (v *SvcAdmissionHandler) Handle(ctx context.Context, req admission.Request) admission.Response {

	svcAdmissionHandlerLog.Info("svc webhook called", "op", req.Operation)

	switch req.Operation {
	case v1beta1.Create:
		return v.HandleCreate(ctx, req)
	case v1beta1.Delete:
		return v.HandleDelete(ctx, req)
	default:
		svcAdmissionHandlerLog.Info("ignored", "req.Operation", req.Operation)
		return admission.Allowed("")
	}
}

func (v *SvcAdmissionHandler) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}

func (v *SvcAdmissionHandler) InjectClient(c client.Client) error {
	v.client = c
	return nil
}

func (v *SvcAdmissionHandler) HandleCreate(ctx context.Context, req admission.Request) admission.Response {
	svc := corev1.Service{}
	err := v.decoder.Decode(req, &svc)
	if err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if v1alpha1.IsKalmSystemNamespace(svc.Namespace) {
		return admission.Allowed("")
	}

	var ns v1.Namespace
	if err := v.client.Get(context.Background(), client.ObjectKey{Name: svc.Namespace}, &ns); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if !v1alpha1.IsNamespaceKalmEnabled(ns) {
		return admission.Allowed("")
	}

	tenantName := svc.Labels[v1alpha1.TenantNameLabelKey]
	if tenantName == "" {
		return admission.Errored(http.StatusBadRequest, v1alpha1.NoTenantFoundError)
	}

	var svcList corev1.ServiceList
	if err := v.client.List(ctx, &svcList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenantName}); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	svcExist := false
	for _, tmpSvc := range svcList.Items {
		if tmpSvc.Namespace != svc.Namespace || tmpSvc.Name != svc.Name {
			continue
		}

		svcExist = true
		break
	}

	cnt := len(svcList.Items)
	if !svcExist {
		cnt += 1
	}

	newQuantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)
	if err := v1alpha1.SetTenantResourceByName(tenantName, v1alpha1.ResourceServicesCount, *newQuantity); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	return admission.Allowed("")
}

func (v *SvcAdmissionHandler) HandleDelete(ctx context.Context, req admission.Request) admission.Response {
	svc := corev1.Service{}
	err := v.decoder.DecodeRaw(req.OldObject, &svc)
	if err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if v1alpha1.IsKalmSystemNamespace(svc.Namespace) {
		return admission.Allowed("")
	}

	var ns v1.Namespace
	if err := v.client.Get(context.Background(), client.ObjectKey{Name: svc.Namespace}, &ns); err != nil {
		return admission.Errored(http.StatusBadRequest, err)
	}

	if !v1alpha1.IsNamespaceKalmEnabled(ns) {
		return admission.Allowed("")
	}

	tenantName := svc.Labels[v1alpha1.TenantNameLabelKey]
	if tenantName == "" {
		svcAdmissionHandlerLog.Error(v1alpha1.NoTenantFoundError, "no tenant found in svc, ignored", "ns/name", fmt.Sprintf("%s/%s", svc.Namespace, svc.Name))
		return admission.Allowed("")
	}

	var svcList corev1.ServiceList
	if err := v.client.List(ctx, &svcList, client.MatchingLabels{v1alpha1.TenantNameLabelKey: tenantName}); err != nil {
		return admission.Errored(http.StatusInternalServerError, err)
	}

	cnt := 0
	for _, tmpSvc := range svcList.Items {
		if tmpSvc.Namespace == svc.Namespace && tmpSvc.Name == svc.Name {
			continue
		}

		if tmpSvc.DeletionTimestamp != nil && tmpSvc.DeletionTimestamp.Unix() > 0 {
			continue
		}

		cnt += 1
	}

	newQuantity := resource.NewQuantity(int64(cnt), resource.DecimalSI)

	if err := v1alpha1.SetTenantResourceByName(tenantName, v1alpha1.ResourceServicesCount, *newQuantity); err != nil {
		svcAdmissionHandlerLog.Error(err, "fail to update tenant for svc deletion, ignored", "ns/name", fmt.Sprintf("%s/%s", svc.Namespace, svc.Name))
		return admission.Allowed("")
	}

	return admission.Allowed("")
}
