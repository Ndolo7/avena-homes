from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OnboardTenantView, TenantViewSet, TenancyViewSet

router = DefaultRouter()
router.register(r"tenants", TenantViewSet, basename="tenant")
router.register(r"tenancies", TenancyViewSet, basename="tenancy")

urlpatterns = [
    path("", include(router.urls)),
    path("onboard/", OnboardTenantView.as_view(), name="tenant-onboard"),
]
