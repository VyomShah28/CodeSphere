from django.urls import path
from . import views

urlpatterns = [
    path("submitCode",views.submit_code, name="Submit_Code"),
    path("runCode", views.run_code, name="Run_Code"),
    path("getTestCases", views.get_test_cases, name="Get_Test_Cases"),
]