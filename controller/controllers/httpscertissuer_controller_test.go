package controllers

import (
	"context"
	"github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"testing"
)

type HttpsCertIssuerControllerSuite struct {
	BasicSuite
}

func TestHttpsCertIssuerControllerSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertIssuerControllerSuite))
}

func (suite *HttpsCertIssuerControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	suite.ensureNsExists(CertManagerNamespace)
}

func (suite *HttpsCertIssuerControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *HttpsCertIssuerControllerSuite) TestBasicCRUD() {
	//create
	caHttpsCertIssuer := genEmptyCAHttpsCertIssuer()
	suite.createHttpsCertIssuer(caHttpsCertIssuer)

	//get
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: caHttpsCertIssuer.Name,
			},
			&caHttpsCertIssuer,
		)

		return err == nil
	})
	// corresponding Issuer should be created too
	var issuer v1.ClusterIssuer
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{
				Name: caHttpsCertIssuer.Name,
			},
			&issuer,
		)

		return err == nil
	})

	//fmt.Printf("issuer: %+v", caHttpsCertIssuer)

	//suite.Eventually(func() bool {
	//	suite.reloadHttpsCertIssuer(&caHttpsCertIssuer)
	//	return caHttpsCertIssuer.Status.OK
	//})

	// delete
	suite.reloadHttpsCertIssuer(&caHttpsCertIssuer)
	suite.Nil(suite.K8sClient.Delete(context.Background(), &caHttpsCertIssuer))

	// Read after deletion
	suite.Eventually(func() bool {
		return errors.IsNotFound(
			suite.K8sClient.Get(
				context.Background(),
				types.NamespacedName{Name: caHttpsCertIssuer.Name, Namespace: caHttpsCertIssuer.Namespace},
				&caHttpsCertIssuer,
			),
		)
	})
	//todo
	//suite.Eventually(func() bool {
	//	return errors.IsNotFound(
	//		suite.K8sClient.Get(
	//			context.Background(),
	//			types.NamespacedName{Name: issuer.Name},
	//			&issuer,
	//		),
	//	)
	//})
}

func (suite *HttpsCertIssuerControllerSuite) reloadHttpsCertIssuer(issuer *v1alpha1.HttpsCertIssuer) {
	err := suite.K8sClient.Get(
		context.Background(),
		types.NamespacedName{
			Name: issuer.Name,
		},
		issuer,
	)

	suite.Nil(err)
}

func genEmptyCAHttpsCertIssuer() v1alpha1.HttpsCertIssuer {
	return v1alpha1.HttpsCertIssuer{
		ObjectMeta: metaV1.ObjectMeta{
			Name: randomName()[:12],
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{
			CAForTest: &v1alpha1.CAForTestIssuer{},
		},
	}
}
