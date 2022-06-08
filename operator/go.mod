module github.com/kalmhq/kalm/operator

go 1.15

require (
	github.com/go-logr/logr v0.2.1-0.20200730175230-ee2de8da5be6
	github.com/jetstack/cert-manager v0.15.2
	github.com/kalmhq/kalm/controller v0.0.0-20200722131031-2336d7eaf4c9
	github.com/prometheus/prometheus v1.8.2
	github.com/stretchr/testify v1.6.1
	golang.org/x/sys v0.0.0-20220608164250-635b8c9b7f68 // indirect
	gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776
	gotest.tools v2.2.0+incompatible
	istio.io/api v0.0.0-20200722065756-9d7f2a3afc5b
	istio.io/client-go v0.0.0-20200717004237-1af75184beba
	istio.io/pkg v0.0.0-20201203133420-4a552406785d
	k8s.io/api v0.18.6
	k8s.io/apiextensions-apiserver v0.18.6
	k8s.io/apimachinery v0.18.6
	k8s.io/client-go v0.18.6
	k8s.io/kubectl v0.18.0
	sigs.k8s.io/controller-runtime v0.6.3
)

replace github.com/kalmhq/kalm/controller => ../controller
