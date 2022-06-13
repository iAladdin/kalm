package controllers

import (
	"context"
	"strings"

	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type StorageClassReconciler struct {
	*BaseReconciler
	ctx context.Context
}

func NewStorageClassReconciler(mgr ctrl.Manager) *StorageClassReconciler {
	return &StorageClassReconciler{
		BaseReconciler: NewBaseReconciler(mgr, "KalmPVC"),
		ctx:            context.Background(),
	}
}

func (r *StorageClassReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.StorageClass{}).
		Complete(r)
}

// +kubebuilder:rbac:groups=storage.k8s.io,resources=storageclasses,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=nodes,verbs=get;list;watch

func (r *StorageClassReconciler) Reconcile(ctx context.Context, _ ctrl.Request) (ctrl.Result, error) {
	// prepare storage class
	cloudProvider, ok := r.guessCurrentCloudProvider()
	if !ok {
		r.Log.Info("fail to find current cloudProvier")
		return ctrl.Result{}, nil
	}

	err := r.reconcileDefaultStorageClass(cloudProvider)
	return ctrl.Result{}, err
}

func (r *StorageClassReconciler) guessCurrentCloudProvider() (string, bool) {
	var nodeList corev1.NodeList
	err := r.List(r.ctx, &nodeList)
	if err != nil {
		return "", false
	}

	for _, node := range nodeList.Items {
		if isGoogleNode(node) {
			return "gcp", true
		}

		if isAzureNode(node) {
			return "azure", true
		}

		if isMinikube(node) {
			return "minikube", true
		}
		// todo, more for minikube & aws
	}

	return "", false
}

func (r *StorageClassReconciler) reconcileDefaultStorageClass(cloudProvider string) error {
	var expectedStorageClasses []v1.StorageClass

	reclaimPolicy := corev1.PersistentVolumeReclaimRetain
	switch cloudProvider {
	case "aws":
		hdd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name:        "gp2",
				Annotations: docInfoOnStorageClass["aws"],
			},
			Provisioner:   "kubernetes.io/aws-ebs",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":   "gp2",
				"fstype": "ext4",
			},
		}

		//todo ssd

		expectedStorageClasses = []v1.StorageClass{hdd}
	case "azure":

		//todo

	case "gcp":
		hdd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name:        "pd-standard",
				Annotations: docInfoOnStorageClass["gcp"],
			},
			Provisioner:   "kubernetes.io/gce-pd",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":             "pd-standard",
				"fstype":           "ext4",
				"replication-type": "none",
			},
		}
		ssd := v1.StorageClass{
			ObjectMeta: ctrl.ObjectMeta{
				Name:        "pd-ssd",
				Annotations: docInfoOnStorageClass["gcp"],
			},
			Provisioner:   "kubernetes.io/gce-pd",
			ReclaimPolicy: &reclaimPolicy,
			Parameters: map[string]string{
				"type":             "pd-ssd",
				"fstype":           "ext4",
				"replication-type": "none",
			},
		}

		expectedStorageClasses = []v1.StorageClass{hdd, ssd}
	default:
		r.Log.Info("unknown cloudProvider", "cloudProvider:", cloudProvider)
		return nil
	}

	// set labels for kalm managed storage class
	for i := 0; i < len(expectedStorageClasses); i++ {
		sc := &expectedStorageClasses[i]

		if sc.Labels == nil {
			sc.Labels = make(map[string]string)
		}

		sc.Labels[KalmLabelManaged] = "true"
	}

	for i := range expectedStorageClasses {
		expectedSC := expectedStorageClasses[i]

		var sc v1.StorageClass
		isNew := false

		err := r.Get(r.ctx, client.ObjectKey{Name: expectedSC.Name}, &sc)
		if err != nil {
			if !errors.IsNotFound(err) {
				return err
			}

			isNew = true
		}

		if isNew {
			if err := r.Create(r.ctx, &expectedSC); err != nil {
				return err
			}
		} else {
			sc.Parameters = expectedSC.Parameters
			sc.Provisioner = expectedSC.Provisioner
			sc.ReclaimPolicy = expectedSC.ReclaimPolicy
			sc.Annotations = mergeMap(sc.Annotations, expectedSC.Annotations)

			if err := r.Update(r.ctx, &expectedSC); err != nil {
				return err
			}
		}
	}

	return nil
}

func isGoogleNode(node corev1.Node) bool {
	if strings.Contains(node.Name, "gke") {
		return true
	}

	gkeLabels := []string{
		"cloud.google.com/gke-nodepool",
		"cloud.google.com/gke-os-distribution",
	}

	for _, gkeLabel := range gkeLabels {
		if _, exist := node.Labels[gkeLabel]; exist {
			return true
		}
	}

	return false
}

func isAzureNode(node corev1.Node) bool {
	if strings.HasPrefix(node.Name, "aks") {
		return true
	}

	if strings.Contains(node.Status.NodeInfo.KernelVersion, "azure") {
		return true
	}

	labels := []string{
		"kubernetes.azure.com/cluster",
		"kubernetes.azure.com/role",
	}

	for _, label := range labels {
		if _, exist := node.Labels[label]; exist {
			return true
		}
	}

	return false
}

func isMinikube(node corev1.Node) bool {
	if node.Name == "minikube" {
		return true
	}

	return false
}

const (
	KalmAnnoSCDocLink   = "kalm-annotation-sc-doc-link"
	KalmAnnoSCPriceLink = "kalm-annotation-sc-price-link"
)

var docInfoOnStorageClass = map[string]map[string]string{
	"aws": {
		KalmAnnoSCDocLink:   "todo",
		KalmAnnoSCPriceLink: "todo",
	},
	"azure": {
		KalmAnnoSCDocLink:   "todo",
		KalmAnnoSCPriceLink: "todo",
	},
	"gcp": {
		KalmAnnoSCDocLink:   "https://cloud.google.com/compute/docs/disks#pdspecs",
		KalmAnnoSCPriceLink: "https://cloud.google.com/compute/disks-image-pricing#disk",
	},
	"minikube": {
		KalmAnnoSCDocLink:   "https://minikube.sigs.k8s.io/docs/handbook/persistent_volumes/",
		KalmAnnoSCPriceLink: "",
	},
}

func mergeMap(old, new map[string]string) map[string]string {
	if old == nil {
		old = make(map[string]string)
	}

	for k, v := range new {
		old[k] = v
	}

	return old
}
