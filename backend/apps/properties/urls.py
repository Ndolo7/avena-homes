from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PropertyViewSet, UnitViewSet

router = DefaultRouter()
# Register "units" BEFORE "" so ^units/$ is matched before ^(?P<pk>[^/.]+)/$
router.register(r"units", UnitViewSet, basename="unit")
router.register(r"", PropertyViewSet, basename="property")

urlpatterns = [path("", include(router.urls))]
